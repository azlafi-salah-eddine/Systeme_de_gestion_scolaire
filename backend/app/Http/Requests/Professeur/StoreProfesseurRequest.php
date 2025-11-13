<?php

namespace App\Http\Requests\Professeur;

use Illuminate\Foundation\Http\FormRequest;

class StoreProfesseurRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Allow creation for now; controller may gate by policy
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'diplome' => 'nullable|string|max:200',
            'anciennete' => 'nullable|integer|min:0',
            'telephone' => 'nullable|string|max:15|unique:professeurs,telephone',
            'email' => 'nullable|email|unique:professeurs,email',
            'adresse' => 'nullable|string|max:255',
            'date_embauche' => 'nullable|date',
            'salaire' => 'nullable|numeric|min:0',
            'active' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom est requis',
            'prenom.required' => 'Le prénom est requis',
            'email.unique' => 'Cette adresse email est déjà utilisée',
            'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé',
        ];
    }
}


