<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfesseurResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'nom_complet' => $this->nom_complet,
            'diplome' => $this->diplome,
            'anciennete' => $this->anciennete,
            'telephone' => $this->telephone,
            'email' => $this->email,
            'adresse' => $this->adresse,
            'date_embauche' => $this->date_embauche?->format('Y-m-d'),
            'salaire' => $this->salaire,
            'active' => $this->active,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            
            // Relations
            'classes' => $this->whenLoaded('classes', function () {
                return $this->classes->map(function ($classe) {
                    return [
                        'id' => $classe->id,
                        'nom' => $classe->nom,
                        'nom_complet' => $classe->nom_complet,
                    ];
                });
            }),
            'matieres' => $this->whenLoaded('matieres', function () {
                return $this->matieres->map(function ($matiere) {
                    return [
                        'id' => $matiere->id,
                        'nom' => $matiere->nom,
                        'code' => $matiere->code,
                        'couleur' => $matiere->couleur,
                    ];
                });
            }),
        ];
    }
}