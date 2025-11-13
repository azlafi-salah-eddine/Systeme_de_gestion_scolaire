<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\SoftDeleteActive;
use App\Models\Cantine;
use App\Models\Transport;

class Eleve extends Model
{
    use HasFactory, SoftDeleteActive;

    protected $table = 'eleves';

    protected $fillable = [
        'nom_fr',
        'prenom_fr',
        'nom_ar',
        'prenom_ar',
        'date_naissance',
        'lieu_naissance_fr',
        'lieu_naissance_ar',
        'sexe',
        'matricule',
        'photo',
        'cne',
        'cin',
        'adresse',
        'ancienne_ecole',
        'type_ecole',
        'statut_ecole',
        'nationalite',
        'langues',
        'infos_sante',
        'groupe_sanguin',
        'allergies',
        'maladies_chroniques',
        'medicaments',
        'personne_urgence',
        'telephone_urgence',
        'classe_id',
        'cantine_id',
        'transport_id',
        'date_inscription',
        'active'
    ];

    protected $casts = [
        'date_naissance' => 'date',
        'date_inscription' => 'date',
        'active' => 'boolean',
        'langues' => 'array',
    ];

    /**
     * La classe de l'élève
     */
    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class);
    }

    /**
     * Les parents de l'élève
     */
    public function parents(): BelongsToMany
    {
        return $this->belongsToMany(ParentEleve::class, 'eleve_parent', 'eleve_id', 'parent_id')
                    ->withPivot('relation', 'contact_principal')
                    ->withTimestamps();
    }

    /**
     * Les absences de l'élève
     */
    public function absences(): HasMany
    {
        return $this->hasMany(Absence::class);
    }

    /**
     * Les notes de l'élève
     */
    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    /**
     * La cantine de l'élève
     */
    public function cantine(): BelongsTo
    {
        return $this->belongsTo(Cantine::class);
    }

    /**
     * Le transport de l'élève
     */
    public function transport(): BelongsTo
    {
        return $this->belongsTo(Transport::class);
    }

    /**
     * Cantines associées via table pivot
     */
    public function cantines(): BelongsToMany
    {
        return $this->belongsToMany(Cantine::class, 'cantine_eleve', 'eleve_id', 'cantine_id')
            ->withPivot('date_inscription')
            ->withTimestamps();
    }

    /**
     * Transports associés via table pivot
     */
    public function transports(): BelongsToMany
    {
        return $this->belongsToMany(Transport::class, 'transport_eleve', 'eleve_id', 'transport_id')
            ->withPivot('date_inscription')
            ->withTimestamps();
    }

    /**
     * Nom complet de l'élève
     */
    public function getNomCompletAttribute(): string
    {
        $prenom = $this->prenom_fr ?? $this->prenom_ar ?? '';
        $nom = $this->nom_fr ?? $this->nom_ar ?? '';
        return trim($prenom . ' ' . $nom);
    }

    /**
     * Les contrôles de l'élève
     */
    public function controles(): BelongsToMany
    {
        return $this->belongsToMany(Controle::class, 'controle_eleve', 'eleve_id', 'controle_id')
                    ->withTimestamps();
    }

    /**
     * Âge de l'élève
     */
    public function getAgeAttribute(): ?int
    {
        return $this->date_naissance ? $this->date_naissance->age : null;
    }
} 