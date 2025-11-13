<?php

namespace App\Http\Requests\Enrollment;

use Illuminate\Foundation\Http\FormRequest;

class StoreEnrollmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            // Identity (required)
            'nom_fr' => 'required|string|max:100',
            'prenom_fr' => 'required|string|max:100',
            'nom_ar' => 'nullable|string|max:100',
            'prenom_ar' => 'nullable|string|max:100',
            'date_naissance' => 'required|date|before:today',
            'lieu_naissance_fr' => 'required|string|max:100',
            'lieu_naissance_ar' => 'nullable|string|max:100',
            'sexe' => 'required|in:M,F',
            'cne' => 'nullable|string|max:20|unique:eleves,cne',
            'cin' => 'nullable|string|max:20|unique:eleves,cin',
            'photo' => ['nullable', new \App\Rules\ValidPhoto(1048576, ['image/jpeg', 'image/png'])],
            'adresse' => 'nullable|string|max:500',
            'nationalite' => 'nullable|string|max:50',
            
            // Parents (optional at this step; can be added after inscription)
            'pere_id' => 'nullable|integer|exists:parents,id',
            'mere_id' => 'nullable|integer|exists:parents,id',
            'tuteur_id' => 'nullable|integer|exists:parents,id',
            
            // Class and services
            'classe_id' => 'required|integer|exists:classes,id',
            'cantine_id' => 'nullable|integer|exists:cantines,id',
            'transport_id' => 'nullable|integer|exists:transports,id',
            
            // Medical information (optional)
            'medical' => 'nullable|array',
            'medical.groupe_sanguin' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'medical.allergies' => 'nullable|string|max:500',
            'medical.maladies_chroniques' => 'nullable|string|max:500',
            'medical.medicaments' => 'nullable|string|max:500',
            'medical.contact_urgence' => 'nullable|string|max:100',
            'medical.telephone_urgence' => 'nullable|string|max:20',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nom_fr.required' => 'Le nom en français est obligatoire.',
            'prenom_fr.required' => 'Le prénom en français est obligatoire.',
            'date_naissance.required' => 'La date de naissance est obligatoire.',
            'date_naissance.before' => 'La date de naissance doit être antérieure à aujourd\'hui.',
            'sexe.required' => 'Le sexe est obligatoire.',
            'sexe.in' => 'Le sexe doit être M ou F.',
            'cne.unique' => 'Ce CNE est déjà utilisé.',
            'cin.unique' => 'Ce CIN est déjà utilisé.',
            'classe_id.required' => 'La classe est obligatoire.',
            'classe_id.exists' => 'La classe sélectionnée n\'existe pas.',
            'pere_id.exists' => 'Le père sélectionné n\'existe pas.',
            'mere_id.exists' => 'La mère sélectionnée n\'existe pas.',
            'tuteur_id.exists' => 'Le tuteur sélectionné n\'existe pas.',
            'cantine_id.exists' => 'La cantine sélectionnée n\'existe pas.',
            'transport_id.exists' => 'Le transport sélectionné n\'existe pas.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Check if class has available spots
            if ($this->classe_id) {
                $classe = \App\Models\Classe::find($this->classe_id);
                if ($classe && $classe->est_complete) {
                    $validator->errors()->add('classe_id', 'Cette classe est complète.');
                }
            }
        });
    }
}
