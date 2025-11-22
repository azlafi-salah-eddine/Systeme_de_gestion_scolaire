<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsNotification extends Model
{
    protected $table = 'sms_notifications';

    protected $fillable = [
        'destinataire_type',
        'destinataire_id',
        'telephone',
        'message',
        'statut',
        'date_envoi',
        'type',
        'urgent',
        'numeros_personnalises',
    ];

    protected $casts = [
        'date_envoi' => 'datetime',
        'date_livraison' => 'datetime',
        'urgent' => 'boolean',
        'active' => 'boolean',
    ];
}
