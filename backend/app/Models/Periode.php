<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\SoftDeleteActive;

class Periode extends Model
{
    use HasFactory, SoftDeleteActive;

    protected $fillable = [
        'nom',
        'description',
        'date_debut',
        'date_fin',
        'annee_scolaire_id',
        'active'
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'active' => 'boolean',
    ];

    /**
     * L'année scolaire de la période
     */
    public function anneeScolaire(): BelongsTo
    {
        return $this->belongsTo(AnneeScolaire::class);
    }

    /**
     * Les notes de cette période
     */
    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }
}
