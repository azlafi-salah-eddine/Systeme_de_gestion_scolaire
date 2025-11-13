<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\SoftDeleteActive;

class Paiement extends Model
{
    use SoftDeleteActive;

    protected $fillable = [
        'eleve_id',
        'annee_scolaire_id',
        'montant',
        'date_paiement',
        'mode_paiement',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
        'montant' => 'decimal:2',
        'date_paiement' => 'date',
    ];

    /**
     * L'élève qui a effectué le paiement
     */
    public function eleve()
    {
        return $this->belongsTo(Eleve::class);
    }

    /**
     * L'année scolaire du paiement
     */
    public function anneeScolaire()
    {
        return $this->belongsTo(AnneeScolaire::class);
    }
}
