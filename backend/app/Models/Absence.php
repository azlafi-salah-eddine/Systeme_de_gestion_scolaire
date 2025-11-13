<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\SoftDeleteActive;

class Absence extends Model
{
    use HasFactory, SoftDeleteActive;

    protected $table = 'absences';

    protected $fillable = [
        'eleve_id',
        'annee_scolaire_id',
        'professeur_id',
        'matiere_id',
        'date',
        'heure_debut',
        'heure_fin',
        'motif',
        'justifie',
        'justification',
        'piece_jointe',
        'active'
    ];

    protected $casts = [
        'date' => 'date',
        'justifie' => 'boolean',
        'active' => 'boolean',
    ];

    /**
     * L'élève absent
     */
    public function eleve(): BelongsTo
    {
        return $this->belongsTo(Eleve::class);
    }

    /**
     * Le professeur
     */
    public function professeur(): BelongsTo
    {
        return $this->belongsTo(Professeur::class);
    }

    /**
     * La matière
     */
    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matiere::class);
    }

    /**
     * L'année scolaire de l'absence
     */
    public function anneeScolaire(): BelongsTo
    {
        return $this->belongsTo(AnneeScolaire::class);
    }
} 