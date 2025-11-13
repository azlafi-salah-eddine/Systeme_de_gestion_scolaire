<?php

namespace App\Http\Requests\Eleve;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEleveRequest extends FormRequest
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
        $eleveId = $this->route('eleve');
        
        return [
            'nom_fr' => ['sometimes', 'string', 'max:100'],
            'prenom_fr' => ['sometimes', 'string', 'max:100'],
            'nom_ar' => ['sometimes', 'string', 'max:100'],
            'prenom_ar' => ['sometimes', 'string', 'max:100'],
            'date_naissance' => ['sometimes', 'date', 'before:today'],
            'lieu_naissance_fr' => ['sometimes', 'string', 'max:150'],
            'lieu_naissance_ar' => ['sometimes', 'string', 'max:150'],
            'sexe' => ['sometimes', 'in:M,F'],
            'matricule' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
                Rule::unique('eleves', 'matricule')->ignore($eleveId)
            ],
            'photo' => ['sometimes', 'nullable', new \App\Rules\ValidPhoto(1048576, ['image/jpeg', 'image/png'])],
            'cne' => [
                'sometimes', 
                'nullable',
                'string', 
                'max:20', 
                Rule::unique('eleves', 'cne')->ignore($eleveId)
            ],
            'cin' => [
                'sometimes', 
                'nullable',
                'string', 
                'max:20', 
                Rule::unique('eleves', 'cin')->ignore($eleveId)
            ],
            'adresse' => ['sometimes', 'string', 'max:500'],
            'ancienne_ecole' => ['sometimes', 'nullable', 'string', 'max:255'],
            'nationalite' => ['sometimes', 'nullable', 'string', 'max:100'],
            'langues' => ['sometimes', 'nullable', 'array'],
            'langues.*' => ['string', 'max:50'],
            'infos_sante' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'groupe_sanguin' => ['sometimes', 'nullable', 'string', 'max:10'],
            'allergies' => ['sometimes', 'nullable', 'string', 'max:500'],
            'personne_urgence' => ['sometimes', 'nullable', 'string', 'max:255'],
            'classe_id' => ['sometimes', 'nullable', 'exists:classes,id'],
            'date_inscription' => ['sometimes', 'date'],
            'active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nom_fr.string' => 'Le nom (FR) doit être une chaîne de caractères.',
            'nom_fr.max' => 'Le nom (FR) ne peut pas dépasser 100 caractères.',
            'prenom_fr.string' => 'Le prénom (FR) doit être une chaîne de caractères.',
            'prenom_fr.max' => 'Le prénom (FR) ne peut pas dépasser 100 caractères.',
            'date_naissance.date' => 'La date de naissance doit être une date valide.',
            'date_naissance.before' => 'La date de naissance doit être antérieure à aujourd\'hui.',
            'cne.string' => 'Le CNE doit être une chaîne de caractères.',
            'cne.max' => 'Le CNE ne peut pas dépasser 20 caractères.',
            'cin.string' => 'Le CIN doit être une chaîne de caractères.',
            'cin.max' => 'Le CIN ne peut pas dépasser 20 caractères.',
            'cne.unique' => 'Ce CNE existe déjà.',
            'adresse.string' => 'L\'adresse doit être une chaîne de caractères.',
            'adresse.max' => 'L\'adresse ne peut pas dépasser 500 caractères.',
            'classe_id.exists' => 'La classe sélectionnée n\'existe pas.',
            'date_inscription.date' => 'La date d\'inscription doit être une date valide.',
        ];
    }
}
