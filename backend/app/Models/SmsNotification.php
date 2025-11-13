<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsNotification extends Model
{
    protected $table = 'sms';

    protected $fillable = [
        'destinataire_type',
        'destinataire_id',
        'message',
        'date',
    ];
}
