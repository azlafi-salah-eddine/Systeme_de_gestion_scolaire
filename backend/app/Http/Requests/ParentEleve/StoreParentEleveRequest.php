<?php

namespace App\Http\Requests\ParentEleve;

use Illuminate\Foundation\Http\FormRequest;

class StoreParentEleveRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Sera vérifié par le middleware de rôle
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'string', 'email', 'max:255', 'unique:parents,email'],
            'adresse' => ['nullable', 'string', 'max:500'],
            'profession' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:pere,mere,tuteur'],
            'situation_familiale' => ['nullable', 'string', 'max:100'],
            'active' => ['boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
            'email.email' => 'L\'email doit être valide.',
            'email.unique' => 'Cet email existe déjà.',
            'type.required' => 'Le type de parent est obligatoire.',
            'type.in' => 'Le type de parent doit être père, mère ou tuteur.',
        ];
    }
}
