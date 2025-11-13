<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\SoftDeleteActive;

class Menu extends Model
{
    use SoftDeleteActive;

    protected $fillable = [
        "cantine_id",
        "jour",
        "plat_principal",
        "entree",
        "dessert",
        "boisson",
        "date_menu",
        "active"
    ];

    protected $casts = [
        "date_menu" => "date",
        "active" => "boolean"
    ];

    public function cantine(): BelongsTo
    {
        return $this->belongsTo(Cantine::class);
    }
}
