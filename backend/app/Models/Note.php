<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\SoftDeleteActive;

class Note extends Model
{
    use HasFactory, SoftDeleteActive;

    protected $table = 'notes';

    protected $fillable = [
        'eleve_id',
        'controle_id',
        'matiere_id',
        'professeur_id',
        'note',
        'periode_id',
        'annee_scolaire_id',
        'active'
    ];

    protected $casts = [
        'note' => 'decimal:2',
        'active' => 'boolean',
    ];

    /**
     * Accesseur pour récupérer le bareme depuis le niveau de l'élève
     */
    public function getBaremeAttribute(): float
    {
        try {
            // Charger les relations si elles ne sont pas déjà chargées
            if (!$this->relationLoaded('eleve')) {
                $this->load('eleve.classe.niveau');
            } else {
                if (!$this->eleve->relationLoaded('classe')) {
                    $this->eleve->load('classe.niveau');
                } else {
                    if ($this->eleve->classe && !$this->eleve->classe->relationLoaded('niveau')) {
                        $this->eleve->classe->load('niveau');
                    }
                }
            }
            
            // Vérifier que toutes les relations existent
            if (!$this->eleve || !$this->eleve->classe || !$this->eleve->classe->niveau) {
                return 20.00;
            }
            
            return (float) ($this->eleve->classe->niveau->bareme ?? 20.00);
        } catch (\Exception $e) {
            // En cas d'erreur, retourner la valeur par défaut
            return 20.00;
        }
    }

    /**
     * L'élève noté
     */
    public function eleve(): BelongsTo
    {
        return $this->belongsTo(Eleve::class);
    }

    /**
     * Le professeur qui a donné la note
     */
    public function professeur(): BelongsTo
    {
        return $this->belongsTo(Professeur::class);
    }

    /**
     * La matière de la note
     */
    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matiere::class);
    }



    /**
     * Le type de contrôle de la note
     */
    public function controle(): BelongsTo
    {
        return $this->belongsTo(Controle::class);
    }

    /**
     * La période de la note
     */
    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class);
    }

    /**
     * L'année scolaire de la note
     */
    public function anneeScolaire(): BelongsTo
    {
        return $this->belongsTo(AnneeScolaire::class);
    }
} 