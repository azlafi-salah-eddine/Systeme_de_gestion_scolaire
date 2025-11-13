<?php

namespace App\Http\Requests\Professeur;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfesseurRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $professeurId = $this->route('professeur')?->id;
        
        return [
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'diplome' => 'sometimes|required|string|max:200',
            'anciennete' => 'sometimes|required|integer|min:0',
            'telephone' => [
                'sometimes',
                'required',
                'string',
                'max:15',
                Rule::unique('professeurs')->ignore($professeurId)
            ],
            'email' => [
                'sometimes',
                'required',
                'email',
                Rule::unique('professeurs')->ignore($professeurId)
            ],
            'adresse' => 'sometimes|required|string|max:255',
            'date_embauche' => 'sometimes|required|date',
            'salaire' => 'sometimes|required|numeric|min:0',
            'active' => 'sometimes|boolean'
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
