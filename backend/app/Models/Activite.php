<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Traits\HandlesActiveRecords;
use App\Traits\SoftDeleteActive;

class Activite extends Model
{
    use HandlesActiveRecords, SoftDeleteActive;

    protected $fillable = [
        'nom',
        'description',
        'capacite',
        'date_debut',
        'date_fin',
        'heure_debut',
        'heure_fin',
        'lieu',
        'prix',
        'type',
        'responsable_id',
        'annee_scolaire_id',
        'active'
    ];

    protected $attributes = [
        'active' => 1,
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'heure_debut' => 'datetime:H:i',
        'heure_fin' => 'datetime:H:i',
        'prix' => 'decimal:2',
        'active' => 'boolean',
        'capacite' => 'integer'
    ];

    // Relations
    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Professeur::class, 'responsable_id');
    }
    
    public function anneeScolaire(): BelongsTo
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    public function eleves(): BelongsToMany
    {
        return $this->belongsToMany(Eleve::class, 'eleve_activite')
                    ->withPivot(['date_inscription', 'statut'])
                    ->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByResponsable($query, $responsableId)
    {
        return $query->where('responsable_id', $responsableId);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('date_debut', '>=', now());
    }

    public function scopeCurrent($query)
    {
        $today = now()->toDateString();
        return $query->where('date_debut', '<=', $today)
                    ->where(function($q) use ($today) {
                        $q->whereNull('date_fin')
                          ->orWhere('date_fin', '>=', $today);
                    });
    }

    // Accessors & Mutators
    public function getTypeLabelAttribute()
    {
        $types = [
            'sport' => 'Sport',
            'culturel' => 'Culturel',
            'artistique' => 'Artistique',
            'scientifique' => 'Scientifique',
            'social' => 'Social',
            'autre' => 'Autre'
        ];

        return $types[$this->type] ?? $this->type;
    }

    public function getStatutLabelAttribute()
    {
        $statuts = [
            'inscrit' => 'Inscrit',
            'present' => 'Présent',
            'absent' => 'Absent',
            'exclu' => 'Exclu'
        ];

        return $statuts[$this->pivot->statut] ?? $this->pivot->statut;
    }

    public function getPlacesDisponiblesAttribute()
    {
        return $this->capacite - $this->eleves()->count();
    }

    public function getEstCompletAttribute()
    {
        return $this->places_disponibles <= 0;
    }

    public function getEstEnCoursAttribute()
    {
        $today = now()->toDateString();
        return $this->date_debut <= $today && 
               ($this->date_fin === null || $this->date_fin >= $today);
    }

    public function getEstTermineeAttribute()
    {
        return $this->date_fin !== null && $this->date_fin < now()->toDateString();
    }

    // Méthodes utilitaires
    public function inscrireEleve($eleveId)
    {
        return $this->eleves()->attach($eleveId, [
            'date_inscription' => now()->toDateString(),
            'statut' => 'inscrit'
        ]);
    }

    public function desinscrireEleve($eleveId)
    {
        return $this->eleves()->detach($eleveId);
    }

    public function marquerPresence($eleveId, $statut = 'present')
    {
        return $this->eleves()->updateExistingPivot($eleveId, [
            'statut' => $statut
        ]);
    }

    public function getElevesInscrits()
    {
        return $this->eleves()->wherePivot('statut', 'inscrit')->get();
    }

    public function getElevesPresents()
    {
        return $this->eleves()->wherePivot('statut', 'present')->get();
    }

    public function getElevesAbsents()
    {
        return $this->eleves()->wherePivot('statut', 'absent')->get();
    }

    public function getElevesExclus()
    {
        return $this->eleves()->wherePivot('statut', 'exclu')->get();
    }
}
