<?php

namespace App\Http\Requests\Eleve;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEleveRequest extends FormRequest
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
            // Core required fields
            'nom_fr' => ['required', 'string', 'max:100'],
            'prenom_fr' => ['required', 'string', 'max:100'],
            'nom_ar' => ['nullable', 'string', 'max:100'],
            'prenom_ar' => ['nullable', 'string', 'max:100'],
            'date_naissance' => ['required', 'date', 'after:1900-01-01', 'before:today'],
            'lieu_naissance_fr' => ['nullable', 'string', 'max:150'],
            'lieu_naissance_ar' => ['nullable', 'string', 'max:150'],
            'sexe' => ['required', 'in:M,F'],
            
            // Optional fields
            'matricule' => ['nullable', 'string', 'max:20', 'unique:eleves,matricule'],
            'photo' => ['nullable', new \App\Rules\ValidPhoto(1048576, ['image/jpeg', 'image/png'])],
            'cne' => ['nullable', 'string', 'max:20', 'unique:eleves,cne'],
            'cin' => ['nullable', 'string', 'max:20', 'unique:eleves,cin'],
            'adresse' => ['nullable', 'string', 'max:500'],
            'ancienne_ecole' => ['nullable', 'string', 'max:255'],
            'nationalite' => ['nullable', 'string', 'max:100'],
            'langues' => ['nullable', 'array'],
            'langues.*' => ['string', 'max:50'],
            'infos_sante' => ['nullable', 'string', 'max:1000'],
            'groupe_sanguin' => ['nullable', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'allergies' => ['nullable', 'string', 'max:500'],
            'maladies_chroniques' => ['nullable', 'string', 'max:500'],
            'medicaments' => ['nullable', 'string', 'max:500'],
            'personne_urgence' => ['nullable', 'string', 'max:255'],
            
            // Relationships - optional
            'classe_id' => ['nullable', 'exists:classes,id'],
            'cantine_id' => ['nullable', 'exists:cantines,id'],
            'transport_id' => ['nullable', 'exists:transports,id'],
            
            // School info - optional
            'type_ecole' => ['nullable', 'string', 'max:50', 'in:creche,ecole'],
            'statut_ecole' => ['nullable', 'string', 'max:50', 'in:publique,privee'],
            'telephone_urgence' => ['nullable', 'string', 'max:20'],
            'date_inscription' => ['nullable', 'date'],
            'active' => ['boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'required' => 'Ce champ est obligatoire.',
            'nom_fr.required' => 'Le nom français est obligatoire.',
            'prenom_fr.required' => 'Le prénom français est obligatoire.',
            'date_naissance.required' => 'La date de naissance est obligatoire.',
            'date_naissance.after' => 'La date de naissance doit être postérieure au 01/01/1900.',
            'date_naissance.before' => 'La date de naissance doit être antérieure à aujourd\'hui.',
            'sexe.required' => 'Le sexe est obligatoire.',
            'sexe.in' => 'Le sexe doit être M ou F.',
            'cne.unique' => 'Ce CNE existe déjà.',
            'cin.unique' => 'Ce CIN existe déjà.',
            'matricule.unique' => 'Ce matricule existe déjà.',
            'classe_id.exists' => 'La classe sélectionnée n\'existe pas.',
            'cantine_id.exists' => 'La cantine sélectionnée n\'existe pas.',
            'transport_id.exists' => 'Le transport sélectionné n\'existe pas.',
            'type_ecole.in' => 'Le type d\'école doit être "creche" ou "ecole".',
            'statut_ecole.in' => 'Le statut de l\'école doit être "publique" ou "privee".',
            'groupe_sanguin.in' => 'Le groupe sanguin doit être l\'un des suivants: A+, A-, B+, B-, AB+, AB-, O+, O-.',
        ];
    }
}
