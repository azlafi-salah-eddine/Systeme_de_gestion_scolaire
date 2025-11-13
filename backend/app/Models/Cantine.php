<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Traits\SoftDeleteActive;

class Cantine extends Model
{
    use SoftDeleteActive;

    protected $fillable = [
        'nom',
        'capacite',
        'localisation',
        'active'
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function eleves(): BelongsToMany
    {
        return $this->belongsToMany(Eleve::class, 'eleve_cantine')
                    ->withPivot('date_inscription')
                    ->withTimestamps();
    }
}