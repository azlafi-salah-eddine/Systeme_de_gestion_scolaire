<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Controle extends Model
{
    use HasFactory;

    protected $table = 'controles';

    protected $fillable = [
        'libelle',
        'debut_controle',
        'fin_controle',
        'matiere_id',
        'instructions',
        'active',
        'professeur_id',
        'periode_id',
        'annee_scolaire_id',
    ];

    protected $casts = [
        'debut_controle' => 'datetime',
        'fin_controle' => 'datetime',
        'active' => 'boolean',
    ];

    /**
     * Relation avec Matiere (un contrôle appartient à une matière)
     */
    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matiere::class);
    }

    /**
     * Relation avec Professeur (un contrôle appartient à un professeur)
     */
    public function professeur(): BelongsTo
    {
        return $this->belongsTo(Professeur::class);
    }

    /**
     * Relation avec Periode (un contrôle appartient à une période)
     */
    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class);
    }

    /**
     * Relation avec AnneeScolaire (un contrôle appartient à une année scolaire)
     */
    public function anneeScolaire(): BelongsTo
    {
        return $this->belongsTo(AnneeScolaire::class);
    }


    /**
     * Relation avec les notes (un contrôle peut avoir plusieurs notes)
     */
    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    /**
     * Scope pour les contrôles actifs
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope pour filtrer par matière
     */
    public function scopeByMatiere($query, $matiereId)
    {
        return $query->where('matiere_id', $matiereId);
    }

    /**
     * Scope pour filtrer par professeur
     */
    public function scopeByProfesseur($query, $professeurId)
    {
        return $query->where('professeur_id', $professeurId);
    }

}