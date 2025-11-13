<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AbsenceProfesseur extends Model
{
    use HasFactory;

    protected $table = 'absences_professeurs';

    protected $fillable = [
        'professeur_id',
        'date',
        'periode',
        'justifiee',
        'motif',
        'justificatif',
        'remplacant_id',
        'active'
    ];

    protected $casts = [
        'date' => 'date',
        'justifiee' => 'boolean',
        'active' => 'boolean',
    ];

    /**
     * Le professeur absent
     */
    public function professeur(): BelongsTo
    {
        return $this->belongsTo(Professeur::class);
    }

    /**
     * Le professeur remplaçant
     */
    public function remplacant(): BelongsTo
    {
        return $this->belongsTo(Professeur::class, 'remplacant_id');
    }
} 