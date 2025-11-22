<?php

namespace App\Http\Requests\Sms;

use Illuminate\Foundation\Http\FormRequest;

class SendSmsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) ($this->user()?->hasAnyRole(['admin', 'super_admin']));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'destinataire_type' => 'required|string|in:eleve,parent,classe,niveau,tous,personnalise',
            'destinataire_id' => 'nullable|integer',
            'message' => 'required|string|max:1000',
            'numeros_personnalises' => 'nullable|array',
            'numeros_personnalises.*' => 'string',
        ];
    }
}
