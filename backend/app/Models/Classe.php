<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use App\Traits\SoftDeleteActive;

class Classe extends Model
{
    use HasFactory, SoftDeleteActive;

    protected $table = 'classes';

    protected $fillable = [
        'nom',
        'niveau_id',
        'annee_scolaire_id',
        'annee_scolaire',
        'section',
        'capacite',
        // 'salle_id' is intentionally omitted; salle is managed via timetable
        'professeur_principal_id',
        'active'
    ];

    protected $casts = [
        'active' => 'boolean',
        'capacite' => 'integer',
    ];

    /**
     * L'année scolaire de la classe
     */
    public function anneeScolaire(): BelongsTo
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    /**
     * Le niveau de la classe
     */
    public function niveau(): BelongsTo
    {
        return $this->belongsTo(Niveau::class);
    }

    /**
     * Professeur principal de la classe
     */
    public function professeurPrincipal(): BelongsTo
    {
        return $this->belongsTo(Professeur::class, 'professeur_principal_id');
    }

    /**
     * Les élèves de la classe
     */
    public function eleves(): HasMany
    {
        return $this->hasMany(Eleve::class);
    }

    /**
     * Les emplois du temps de la classe
     */
    public function emploisDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class, 'classe_id');
    }

    /**
     * Les professeurs de la classe
     */
    public function professeurs(): BelongsToMany
    {
        return $this->belongsToMany(Professeur::class, 'classe_professeur_matiere');
    }

    /**
     * Les matières de la classe
     */
    public function matieres(): BelongsToMany
    {
        return $this->belongsToMany(Matiere::class, 'classe_professeur_matiere', 'classe_id', 'matiere_id');
    }

    /**
     * Les absences de la classe (via élèves)
     */
    public function absences(): HasManyThrough
    {
        return $this->hasManyThrough(Absence::class, Eleve::class, 'classe_id', 'eleve_id');
    }

    /**
     * Les notes de la classe (via élèves)
     */
    public function notes(): HasManyThrough
    {
        return $this->hasManyThrough(Note::class, Eleve::class, 'classe_id', 'eleve_id');
    }

    /**
     * Nom complet de la classe
     */
    public function getNomCompletAttribute(): string
    {
        $annee = $this->annee_scolaire ?? $this->getAnneeScolaireAttribute(null);
        $niveauNom = $this->niveau ? $this->niveau->nom : '';
        return trim(($this->nom ?: ($niveauNom . ' ' . $this->section)) . ' (' . ($annee ?: '—') . ')');
    }

    /**
     * Accesseur pour annee_scolaire: si non rempli, dérive de la relation
     */
    public function getAnneeScolaireAttribute($value): ?string
    {
        if (!empty($value)) {
            return $value;
        }
        $annee = $this->relationLoaded('anneeScolaire') ? $this->getRelation('anneeScolaire') : $this->anneeScolaire()->first();
        if ($annee) {
            return ($annee->annee_debut ?? '') . '-' . ($annee->annee_fin ?? '');
        }
        return null;
    }

    /**
     * Indique si la classe a atteint sa capacité
     */
    public function getEstCompleteAttribute(): bool
    {
        $capacite = $this->capacite ?? 0;
        if ($capacite <= 0) return false;
        return $this->eleves()->count() >= $capacite;
    }

    /**
     * Statistiques de base de la classe
     */
    public function getStatistiques(): array
    {
        $nombreEleves = $this->eleves()->count();
        return [
            'classe_id' => $this->id,
            'nombre_eleves' => $nombreEleves,
            'nombre_professeurs' => $this->professeurs()->count(),
            'nombre_matieres' => $this->matieres()->distinct('matiere_id')->count('matiere_id'),
            'active' => (bool) $this->active,
        ];
    }

    /**
     * Active/désactive la classe
     */
    public function toggleActive(): void
    {
        $this->active = !$this->active;
        $this->save();
    }
} 