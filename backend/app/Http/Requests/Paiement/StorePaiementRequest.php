<?php

namespace App\Http\Requests\Paiement;

use Illuminate\Foundation\Http\FormRequest;

class StorePaiementRequest extends FormRequest
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
            'eleve_id' => 'required|integer|exists:eleves,id',
            'type' => 'required|string|in:inscription,scolarite,transport,cantine',
            'montant' => 'required|numeric|min:0',
            'date' => 'required|date',
            'statut' => 'required|string|in:en_attente,regle,annule',
        ];
    }
}
