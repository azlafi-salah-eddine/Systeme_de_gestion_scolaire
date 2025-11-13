<?php

namespace App\Http\Requests\Classe;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClasseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) ($this->user()?->isAdmin());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nom' => 'required|string|max:100',
            'niveau_id' => 'required|integer|exists:niveaux,id',
            'annee_scolaire_id' => 'required|integer|exists:annees_scolaires,id',
            'section' => 'required|string|max:10',
            'capacite' => 'required|integer|min:1|max:50',
            // Removed salle_id from creation rules
            'professeur_principal_id' => 'nullable|integer|exists:professeurs,id',
            'active' => 'boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de la classe est obligatoire.',
            'nom.max' => 'Le nom de la classe ne peut pas dépasser 100 caractères.',
            'niveau_id.required' => 'Le niveau de la classe est obligatoire.',
            'niveau_id.exists' => 'Le niveau sélectionné n\'existe pas.',
            'annee_scolaire_id.required' => 'L\'année scolaire est obligatoire.',
            'annee_scolaire_id.exists' => 'L\'année scolaire sélectionnée n\'existe pas.',
            'section.required' => 'La section de la classe est obligatoire.',
            'section.max' => 'La section ne peut pas dépasser 10 caractères.',
            'capacite.required' => 'La capacité de la classe est obligatoire.',
            'capacite.min' => 'La capacité doit être d\'au moins 1 élève.',
            'capacite.max' => 'La capacité ne peut pas dépasser 50 élèves.',
            'professeur_principal_id.exists' => 'Le professeur principal sélectionné n\'existe pas.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'nom' => 'nom de la classe',
            'niveau_id' => 'niveau',
            'annee_scolaire_id' => 'année scolaire',
            'section' => 'section',
            'capacite' => 'capacité',
            'professeur_principal_id' => 'professeur principal',
            'active' => 'statut actif',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // S'assurer que active est un booléen
        if ($this->has('active')) {
            $this->merge([
                'active' => filter_var($this->active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true,
            ]);
        } else {
            $this->merge(['active' => true]);
        }
    }
}
