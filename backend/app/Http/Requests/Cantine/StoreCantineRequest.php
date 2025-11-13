<?php

namespace App\Http\Requests\Cantine;

use Illuminate\Foundation\Http\FormRequest;

class StoreCantineRequest extends FormRequest
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
            'nom' => 'required|string|max:150|unique:cantines,nom',
            'capacite' => 'required|integer|min:0',
            'localisation' => 'required|string|max:255',
        ];
    }
}
