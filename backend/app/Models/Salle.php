<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\SoftDeleteActive;

class Salle extends Model
{
    use HasFactory, SoftDeleteActive;

    protected $table = 'salles';

    protected $fillable = [
        'nom',
        'capacite',
        'type',
        'localisation',
        'equipements',
        'active',
    ];

    protected $casts = [
        'capacite' => 'integer',
        'active' => 'boolean',
    ];

    /**
     * Les séances planifiées dans cette salle
     */
    public function emploisDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class, 'salle_id');
    }
}
