<?php

namespace App\Http\Requests\Activite;

use Illuminate\Foundation\Http\FormRequest;

class UpdateActiviteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => 'sometimes|required|string|max:100',
            'description' => 'nullable|string|max:1000',
            'capacite' => 'sometimes|required|integer|min:1|max:1000',
            'date_debut' => 'sometimes|required|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
            'heure_debut' => 'nullable|date_format:H:i',
            'heure_fin' => 'nullable|date_format:H:i|after:heure_debut',
            'lieu' => 'sometimes|required|string|max:255',
            'prix' => 'sometimes|required|numeric|min:0|max:999999.99',
            'type' => 'sometimes|required|in:sport,culturel,artistique,scientifique,social,autre',
            'responsable_id' => 'nullable|exists:professeurs,id',
            'active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de l\'activité est obligatoire.',
            'nom.max' => 'Le nom ne peut pas dépasser 100 caractères.',
            'capacite.required' => 'La capacité est obligatoire.',
            'capacite.min' => 'La capacité doit être d\'au moins 1 personne.',
            'capacite.max' => 'La capacité ne peut pas dépasser 1000 personnes.',
            'date_debut.required' => 'La date de début est obligatoire.',
            'date_fin.after_or_equal' => 'La date de fin doit être postérieure ou égale à la date de début.',
            'heure_fin.after' => 'L\'heure de fin doit être postérieure à l\'heure de début.',
            'lieu.required' => 'Le lieu est obligatoire.',
            'prix.required' => 'Le prix est obligatoire.',
            'prix.min' => 'Le prix ne peut pas être négatif.',
            'type.required' => 'Le type d\'activité est obligatoire.',
            'type.in' => 'Le type d\'activité sélectionné n\'est pas valide.',
            'responsable_id.exists' => 'Le responsable sélectionné n\'existe pas.',
        ];
    }
}
