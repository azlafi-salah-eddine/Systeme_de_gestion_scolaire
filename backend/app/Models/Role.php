<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\SoftDeleteActive;

class Role extends Model
{
    use HasFactory, SoftDeleteActive;

    protected $fillable = [
        'type',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    /**
     * Les utilisateurs qui ont ce rôle (relation one-to-many via role_id)
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role_id');
    }
} 