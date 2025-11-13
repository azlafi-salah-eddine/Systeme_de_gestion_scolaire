<?php

namespace App\Http\Requests\EmploiDuTemps;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmploiDuTempsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Allow public access for timetable creation
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'classe_id' => 'required|integer|exists:classes,id',
            'annee_scolaire_id' => 'nullable|integer|exists:annees_scolaires,id',
            'jour' => 'required|string|in:lundi,mardi,mercredi,jeudi,vendredi,samedi',
            'heure_debut' => 'required|date_format:H:i',
            'heure_fin' => 'required|date_format:H:i|after:heure_debut',
            'matiere_id' => 'required|integer|exists:matieres,id',
            'professeur_id' => 'required|integer|exists:professeurs,id',
            'salle_id' => 'required|integer|exists:salles,id',
            'couleur' => 'nullable|string|regex:/^#([A-Fa-f0-9]{6})$/',
            'notes' => 'nullable|string|max:2000',
            'active' => 'sometimes|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'classe_id.required' => 'La classe est obligatoire.',
            'classe_id.exists' => 'La classe sélectionnée n\'existe pas.',
            'jour.required' => 'Le jour est obligatoire.',
            'jour.in' => 'Le jour doit être lundi, mardi, mercredi, jeudi, vendredi ou samedi.',
            'heure_debut.required' => 'L\'heure de début est obligatoire.',
            'heure_debut.date_format' => 'L\'heure de début doit être au format HH:MM (ex: 08:00).',
            'heure_fin.required' => 'L\'heure de fin est obligatoire.',
            'heure_fin.date_format' => 'L\'heure de fin doit être au format HH:MM (ex: 09:00).',
            'heure_fin.after' => 'L\'heure de fin doit être après l\'heure de début.',
            'matiere_id.required' => 'La matière est obligatoire.',
            'matiere_id.exists' => 'La matière sélectionnée n\'existe pas.',
            'professeur_id.required' => 'Le professeur est obligatoire.',
            'professeur_id.exists' => 'Le professeur sélectionné n\'existe pas.',
            'salle_id.required' => 'La salle est obligatoire.',
            'salle_id.exists' => 'La salle sélectionnée n\'existe pas.',
            'couleur.regex' => 'La couleur doit être au format hexadécimal (ex: #FF0000).',
            'notes.max' => 'Les notes ne peuvent pas dépasser 2000 caractères.',
        ];
    }
}
