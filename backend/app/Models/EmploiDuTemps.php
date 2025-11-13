<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\SoftDeleteActive;

class EmploiDuTemps extends Model
{
    use SoftDeleteActive;

    protected $table = "emplois_du_temps";
    
    protected $fillable = [
        "classe_id",
        "annee_scolaire_id",
        "jour",
        "heure_debut", 
        "heure_fin",
        "matiere_id",
        "professeur_id",
        "salle_id",
        "active"
    ];

    protected $casts = [
        "heure_debut" => "string",
        "heure_fin" => "string",
        "active" => "boolean",
    ];

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class);
    }

    public function matiere(): BelongsTo
    {
        return $this->belongsTo(Matiere::class);
    }

    public function professeur(): BelongsTo
    {
        return $this->belongsTo(Professeur::class);
    }

    public function salle(): BelongsTo
    {
        return $this->belongsTo(Salle::class);
    }

    public function anneeScolaire(): BelongsTo
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

}
