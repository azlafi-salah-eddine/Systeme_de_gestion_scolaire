<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\SoftDeleteActive;

class Niveau extends Model
{
    use HasFactory, SoftDeleteActive;

    protected $table = 'niveaux';

    protected $fillable = [
        'nom',
        'description',
        'bareme',
        'active',
    ];

    protected $casts = [
        'bareme' => 'decimal:2',
        'active' => 'boolean',
    ];


    public function classes(): HasMany
    {
        return $this->hasMany(Classe::class);
    }
}


