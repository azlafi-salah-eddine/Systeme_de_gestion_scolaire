<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\SoftDeleteActive;

class Chauffeur extends Model
{
    use SoftDeleteActive;

    protected $fillable = [
        'nom',
        'prenom',
        'telephone',
        'permis',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function transports(): HasMany
    {
        return $this->hasMany(Transport::class);
    }
}
