<?php

namespace App\Http\Requests\Matiere;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMatiereRequest extends FormRequest
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
            'nom' => [
                'required',
                'string',
                'max:150',
                Rule::unique('matieres', 'nom')
                    ->where(fn($q) => $q->where('niveau_id', $this->input('niveau_id'))->where('active', true)),
            ],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('matieres', 'code')
                    ->where(fn($q) => $q->where('niveau_id', $this->input('niveau_id'))->where('active', true)),
            ],
            'coleur' => 'nullable|string|max:7',
            'description' => 'nullable|string|max:500',
            'coefficient' => 'nullable|numeric|min:0',
            'niveau_id' => 'nullable|exists:niveaux,id',
            'active' => 'boolean',
        ];
    }
    
    public function messages(): array
    {
        return [
            'nom.required' => 'Le nom de la matière est obligatoire.',
            'nom.unique' => 'Une matière active avec ce nom existe déjà.',
            'code.required' => 'Le code de la matière est obligatoire.',
            'code.unique' => 'Une matière active avec ce code existe déjà.',
            'niveau_id.exists' => 'Le niveau sélectionné n\'existe pas.',
        ];
    }
}
