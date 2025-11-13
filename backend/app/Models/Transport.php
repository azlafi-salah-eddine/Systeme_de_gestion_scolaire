<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Traits\SoftDeleteActive;

class Transport extends Model
{
    use SoftDeleteActive;

    protected $fillable = [
        'ligne',
        'matricule',
        'capacite',
        'chauffeur_id',
        'accompagnateur_id',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function chauffeur(): BelongsTo
    {
        return $this->belongsTo(Chauffeur::class);
    }

    public function accompagnateur(): BelongsTo
    {
        return $this->belongsTo(Accompagnateur::class);
    }

    public function eleves(): BelongsToMany
    {
        return $this->belongsToMany(Eleve::class, 'eleve_transport')
            ->withPivot('date_inscription')
            ->withTimestamps();
    }
}
