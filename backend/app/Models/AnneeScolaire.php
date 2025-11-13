<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\Rule;
use App\Traits\SoftDeleteActive;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class AnneeScolaire extends Model
{
    use HasFactory, SoftDeleteActive;

    protected $table = 'annees_scolaires';

    protected $fillable = [
        'nom',
        'date_debut',
        'date_fin',
        'active',
        'description'
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'active' => 'boolean',
    ];

    /**
     * Boot method to handle model events
     */
    protected static function boot()
    {
        parent::boot();

        static::updating(function ($anneeScolaire) {
            // Si l'année scolaire passe de active=1 à active=0
            if ($anneeScolaire->isDirty('active') && $anneeScolaire->active == false) {
                $anneeScolaire->sanitizeRelatedActive(false);
            }
        });

        // Créer automatiquement les périodes quand une année scolaire est créée
        static::created(function ($anneeScolaire) {
            $anneeScolaire->createDefaultPeriodes();
        });

        // Aussi gérer la suppression directe
        static::deleting(function ($anneeScolaire) {
            $anneeScolaire->sanitizeRelatedActive(false);
        });
    }

    protected function sanitizeRelatedActive(bool $active): void
    {
        $this->updateRelationActive($this->periodes(), $active);
        $this->updateRelationActive($this->classes(), $active);
        $this->updateRelationActive($this->controles(), $active);
        $this->updateRelationActive($this->notes(), $active);
        $this->updateRelationActive($this->absences(), $active);
        $this->updateRelationActive($this->paiements(), $active);
        $this->updateRelationActive($this->emploisDuTemps(), $active);
    }

    protected function updateRelationActive($relation, bool $active): void
    {
        $related = $relation->getModel();

        if ($related && Schema::hasColumn($related->getTable(), 'active')) {
            $relation->update(['active' => $active]);
        }
    }

    /**
     * Créer les périodes par défaut pour cette année scolaire
     * Toujours créer Semestre 1 et Semestre 2 uniquement
     */
    public function createDefaultPeriodes()
    {
        // Extraire l'année من date_debut أو nom
        $year = $this->getAnneeDebut();
        
        $dateDebut = $this->date_debut ?? Carbon::create($year, 9, 1);
        $dateFin = $this->date_fin ?? Carbon::create($year + 1, 6, 30);
        
            $periodes = [
                [
                    'nom' => '1er Semestre',
                    'description' => 'Premier semestre de l\'année scolaire',
                'date_debut' => $dateDebut,
                'date_fin' => Carbon::create($year + 1, 1, 31),
                    'active' => true
                ],
                [
                    'nom' => '2ème Semestre',
                    'description' => 'Deuxième semestre de l\'année scolaire',
                'date_debut' => Carbon::create($year + 1, 2, 1),
                'date_fin' => $dateFin,
                    'active' => true
                ]
            ];

        foreach ($periodes as $periode) {
            $this->periodes()->create($periode);
        }
    }

    /**
     * Les classes de cette année scolaire
     */
    public function classes(): HasMany
    {
        return $this->hasMany(Classe::class);
    }

    public function eleves()
    {
        return $this->hasManyThrough(Eleve::class, Classe::class, 'annee_scolaire_id', 'classe_id');
    }

    public function paiements()
    {
        return $this->hasManyThrough(Paiement::class, Eleve::class, 'classe_id', 'eleve_id', 'id', 'id')
            ->join('classes', 'eleves.classe_id', '=', 'classes.id')
            ->where('classes.annee_scolaire_id', $this->id);
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function absences()
    {
        return $this->hasMany(Absence::class);
    }

    public function controles()
    {
        return $this->hasMany(Controle::class);
    }

    public function emploisDuTemps()
    {
        return $this->hasMany(EmploiDuTemps::class);
    }

    /**
     * Les périodes de cette année scolaire
     */
    public function periodes()
    {
        return $this->hasMany(Periode::class);
    }

    public static function validationRules($id = null): array
    {
        return [
            'nom' => [
                'required',
                'string',
                'max:255',
                Rule::unique('annees_scolaires')->ignore($id),
            ],
            'date_debut' => [
                'required',
                'date',
            ],
            'date_fin' => [
                'required',
                'date',
                'after:date_debut',
            ],
        ];
    }

    public static function validationMessages(): array
    {
        return [
            'nom.required' => 'Le nom de l\'année scolaire est obligatoire.',
            'nom.unique' => 'Cette année scolaire existe déjà.',
            'date_debut.required' => 'La date de début est obligatoire.',
            'date_debut.date' => 'La date de début doit être une date valide.',
            'date_fin.required' => 'La date de fin est obligatoire.',
            'date_fin.date' => 'La date de fin doit être une date valide.',
            'date_fin.after' => 'La date de fin doit être postérieure à la date de début.',
        ];
    }

    /**
     * Obtenir l'année de début depuis nom ou date_debut
     */
    public function getAnneeDebut(): int
    {
        // Essayer d'extraire depuis nom (format: "2024-2025")
        if ($this->nom && preg_match('/^(\d{4})-\d{4}$/', $this->nom, $matches)) {
            return (int) $matches[1];
        }
        
        // Sinon utiliser date_debut
        if ($this->date_debut) {
            return (int) Carbon::parse($this->date_debut)->format('Y');
        }
        
        return 0;
    }

    /**
     * Obtenir l'année de fin depuis nom ou date_fin
     */
    public function getAnneeFin(): int
    {
        // Essayer d'extraire depuis nom (format: "2024-2025")
        if ($this->nom && preg_match('/^\d{4}-(\d{4})$/', $this->nom, $matches)) {
            return (int) $matches[1];
        }
        
        // Sinon utiliser date_fin
        if ($this->date_fin) {
            return (int) Carbon::parse($this->date_fin)->format('Y');
        }
        
        return 0;
    }

    /**
     * Accessor pour obtenir l'année de début (compatibilité)
     */
    public function getAnneeDebutAttribute(): int
    {
        return $this->getAnneeDebut();
    }

    /**
     * Accessor pour obtenir l'année de fin (compatibilité)
     */
    public function getAnneeFinAttribute(): int
    {
        return $this->getAnneeFin();
    }

    /**
     * Accessor pour obtenir le nom formaté (compatibilité)
     */
    public function getNomFormateAttribute(): string
    {
        return $this->nom ?? ($this->getAnneeDebutAttribute() . '/' . $this->getAnneeFinAttribute());
    }

    /**
     * Obtenir l'année scolaire actuelle (basée sur la date système)
     * L'année actuelle est celle où la date du jour se trouve entre date_debut et date_fin
     * active = true est utilisé SEULEMENT pour soft delete (visible/non supprimée)
     */
    public static function getCurrent(): ?self
    {
        $today = Carbon::today();
        
        // Chercher l'année où today est entre date_debut et date_fin
        // active = true = année non supprimée (soft delete)
        return static::where('active', true) // Seulement les années non supprimées (soft delete)
            ->where('date_debut', '<=', $today)
            ->where('date_fin', '>=', $today)
            ->orderBy('date_debut', 'desc')
            ->first();
    }

    /**
     * Obtenir l'année scolaire active/actuelle (basée sur la date système)
     * Alias pour getCurrent() pour compatibilité
     */
    public static function getActive(): ?self
    {
        return static::getCurrent();
    }

    /**
     * Activer une année scolaire (méthode désactivée)
     * L'année actuelle est déterminée automatiquement par la date système
     * active = true/false est utilisé SEULEMENT pour soft delete
     */
    public function activer(): bool
    {
        // Cette méthode n'est plus utilisée
        // L'année actuelle est déterminée automatiquement par getCurrent() basée sur la date système
        // active = true/false est utilisé SEULEMENT pour soft delete (visible/hidden)
        return true;
    }

    /**
     * Obtenir les années scolaires accessibles pour un utilisateur
     * - Super Admin: toutes les années (active=true, non supprimées) - peut voir toutes pour gérer le système
     * - Admin/Prof: UNIQUEMENT l'année actuelle (basée sur la date système) - pas de choix
     * 
     * Note: active = true/false est utilisé SEULEMENT pour soft delete (visible/hidden)
     * L'année actuelle est déterminée par getCurrent() basée sur date_debut et date_fin
     */
    public static function getAccessibleForUser(?User $user = null): \Illuminate\Database\Eloquent\Collection
    {
        // Si pas d'utilisateur, retourner seulement l'année actuelle (basée sur date système)
        if (!$user) {
            $anneeActuelle = static::getCurrent();
            return $anneeActuelle ? collect([$anneeActuelle]) : collect();
        }

        // Super Admin voit toutes les années (active=true, non supprimées) pour gérer le système
        if ($user->isSuperAdmin()) {
            return static::where('active', true) // Seulement non supprimées (soft delete)
                ->orderBy('date_debut', 'desc')
                ->get();
        }

        // Pour Admin et Prof: UNIQUEMENT l'année actuelle (basée sur la date système)
        // Pas de choix - ils restent toujours dans l'année actuelle
        $anneeActuelle = static::getCurrent();
        
        return $anneeActuelle ? collect([$anneeActuelle]) : collect();
    }
} 