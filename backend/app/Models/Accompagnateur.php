<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\SoftDeleteActive;

class Accompagnateur extends Model
{
    use SoftDeleteActive;

    protected $fillable = [
        'nom',
        'prenom',
        'telephone',
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
