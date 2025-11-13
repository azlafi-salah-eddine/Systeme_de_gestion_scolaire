<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
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
        $userId = $this->route('user');
        
        return [
            'nom_complet' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes', 
                'string', 
                'email', 
                'max:255', 
                Rule::unique('users')->ignore($userId)
            ],
            'password' => ['sometimes', 'nullable', 'confirmed', Password::min(8)],
            'telephone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'roles' => ['sometimes', 'array', 'min:1'],
            'roles.*' => ['required', 'string', 'exists:roles,nom'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nom_complet.string' => 'Le nom complet doit être une chaîne de caractères.',
            'nom_complet.max' => 'Le nom complet ne peut pas dépasser 255 caractères.',
            'email.string' => 'L\'email doit être une chaîne de caractères.',
            'email.email' => 'L\'email doit être valide.',
            'email.max' => 'L\'email ne peut pas dépasser 255 caractères.',
            'email.unique' => 'Cet email est déjà utilisé.',
            'password.confirmed' => 'La confirmation du mot de passe ne correspond pas.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'telephone.string' => 'Le téléphone doit être une chaîne de caractères.',
            'telephone.max' => 'Le téléphone ne peut pas dépasser 20 caractères.',
            'roles.array' => 'Les rôles doivent être dans un tableau.',
            'roles.min' => 'Au moins un rôle doit être attribué.',
            'roles.*.required' => 'Chaque rôle est obligatoire.',
            'roles.*.exists' => 'Un des rôles spécifiés n\'existe pas.',
        ];
    }
}
