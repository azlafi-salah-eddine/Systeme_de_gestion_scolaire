<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Traits\SoftDeleteActive;

class Professeur extends Model
{
    use HasFactory, SoftDeleteActive;

    protected $table = 'professeurs';

    protected $fillable = [
        'nom',
        'prenom',
        'diplome',
        'anciennete',
        'telephone',
        'email',
        'adresse',
        'date_embauche',
        'salaire',
        'active'
    ];

    protected $casts = [
        'date_embauche' => 'date',
        'salaire' => 'decimal:2',
        'active' => 'boolean',
    ];

    /**
     * Les classes du professeur (via emplois du temps)
     */
    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(Classe::class, 'emplois_du_temps', 'professeur_id', 'classe_id')
            ->distinct();
    }

    /**
     * Les matières du professeur (via emplois du temps)
     */
    public function matieres(): BelongsToMany
    {
        return $this->belongsToMany(Matiere::class, 'emplois_du_temps', 'professeur_id', 'matiere_id')
            ->distinct();
    }

    /**
     * Les absences du professeur
     */
    public function absences(): HasMany
    {
        return $this->hasMany(AbsenceProfesseur::class);
    }

    /**
     * Les notes données par le professeur
     */
    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    /**
     * Les séances d'emplois du temps du professeur
     */
    public function emploisDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class, 'professeur_id');
    }

    /**
     * La classe où il est professeur principal (si applicable)
     */
    public function classePrincipale(): HasOne
    {
        return $this->hasOne(Classe::class, 'professeur_principal_id');
    }

    /**
     * Nom complet du professeur
     */
    public function getNomCompletAttribute(): string
    {
        return $this->prenom . ' ' . $this->nom;
    }
}