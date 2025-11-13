<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Traits\SoftDeleteActive;

class ParentEleve extends Model
{
    use HasFactory, SoftDeleteActive;

    protected $table = 'parents';

    protected $fillable = [
        'nom',
        'prenom',
        'telephone',
        'email',
        'adresse',
        'profession',
        'type',
        'active'
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    /**
     * Les élèves de ce parent
     */
    public function eleves(): BelongsToMany
    {
        return $this->belongsToMany(Eleve::class, 'eleve_parent', 'parent_id', 'eleve_id')
                    ->withTimestamps();
    }

    /**
     * Nom complet du parent
     */
    public function getNomCompletAttribute(): string
    {
        return $this->prenom . ' ' . $this->nom;
    }
} 