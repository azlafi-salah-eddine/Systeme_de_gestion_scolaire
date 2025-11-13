<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriquePaiement extends Model
{
    protected $fillable = [
        'paiement_eleve_id',
        'montant',
        'date_paiement',
        'mode_paiement',
        'reference',
        'notes',
        'utilisateur_id',
        'annee_scolaire_id'
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_paiement' => 'date'
    ];

    protected $appends = [
        'mode_paiement_label',
    ];

    // Relations
    public function paiementEleve(): BelongsTo
    {
        return $this->belongsTo(PaiementEleve::class);
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function anneeScolaire(): BelongsTo
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    // Accessors
    public function getModePaiementLabelAttribute()
    {
        $modes = [
            'especes' => 'Espèces',
            'virement' => 'Virement',
            'cheque' => 'Chèque'
        ];

        return $modes[$this->mode_paiement] ?? $this->mode_paiement;
    }
}