<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\SoftDeleteActive;

class Matiere extends Model
{
    use HasFactory, SoftDeleteActive;

    protected $table = 'matieres';

    protected $fillable = [
        'code',
        'nom',
        'description',
        'coleur',
        'coefficient',
        'niveau_id',
        'active'
    ];

    protected $casts = [
        'active' => 'boolean',
        'coefficient' => 'decimal:2',
    ];

    /**
     * Les classes de cette matière
     */
    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(Classe::class, 'classe_professeur_matiere');
    }

    /**
     * Les professeurs de cette matière
     */
    public function professeurs(): BelongsToMany
    {
        return $this->belongsToMany(Professeur::class, 'classe_professeur_matiere');
    }

    /**
     * Le niveau de cette matière
     */
    public function niveau(): BelongsTo
    {
        return $this->belongsTo(Niveau::class);
    }

    /**
     * Les emplois du temps de cette matière
     */
    public function emploisDuTemps(): HasMany
    {
        return $this->hasMany(EmploiDuTemps::class, 'matiere_id');
    }
} 