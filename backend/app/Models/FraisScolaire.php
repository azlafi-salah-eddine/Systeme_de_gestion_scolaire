<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HandlesActiveRecords;
use App\Traits\SoftDeleteActive;

class FraisScolaire extends Model
{
    use HandlesActiveRecords, SoftDeleteActive;

    protected $fillable = [
        'type',
        'nom',
        'description',
        'montant_mensuel',
        'niveau_id',
        'annee_scolaire_id',
        'obligatoire',
        'active'
    ];

    protected $casts = [
        'montant_mensuel' => 'decimal:2',
        'obligatoire' => 'boolean',
        'active' => 'boolean'
    ];

    // Relations
    public function niveau(): BelongsTo
    {
        return $this->belongsTo(Niveau::class);
    }

    // Removed classe relation; pricing is managed at niveau or global level only

    public function anneeScolaire(): BelongsTo
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    public function paiementsEleves(): HasMany
    {
        return $this->hasMany(PaiementEleve::class);
    }

    // Scopes
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByNiveau($query, $niveauId)
    {
        return $query->where('niveau_id', $niveauId);
    }

    // Removed scopeByClasse as classe-specific pricing is no longer supported

    public function scopeObligatoires($query)
    {
        return $query->where('obligatoire', true);
    }

    // Accessors
    public function getTypeLabelAttribute()
    {
        $types = [
            'scolarite' => 'Frais de Scolarité',
            'cantine' => 'Cantine',
            'transport' => 'Transport'
        ];

        return $types[$this->type] ?? $this->type;
    }

    // Méthodes utilitaires
    public function getMontantForEleve($eleveId)
    {
        // Si le montant mensuel est 0 ou null, retourner 0
        if (!$this->montant_mensuel || $this->montant_mensuel <= 0) {
            return 0;
        }
        
        // Si c'est spécifique à un niveau, vérifier le niveau de l'élève
        if ($this->niveau_id) {
            $eleve = Eleve::with('classe.niveau')->find($eleveId);
            if ($eleve && $eleve->classe) {
                // Vérifier si le niveau de la classe correspond
                $classeNiveauId = $eleve->classe->niveau_id ?? null;
                if ($classeNiveauId && $classeNiveauId === $this->niveau_id) {
                    return $this->montant_mensuel;
                }
                // Si pas de correspondance, retourner 0
                return 0;
            }
            // Si l'élève n'a pas de classe, retourner 0
            return 0;
        }

        // Si c'est général (pas de niveau spécifique), s'applique à tous les élèves
        return $this->montant_mensuel;
    }
}