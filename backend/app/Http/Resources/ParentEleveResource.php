<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParentEleveResource extends JsonResource
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
            'telephone' => $this->telephone,
            'email' => $this->email,
            'adresse' => $this->adresse,
            'profession' => $this->profession,
            'type' => $this->type,
            'eleves' => $this->whenLoaded('eleves', function () {
                return $this->eleves->map(function ($eleve) {
                    return [
                        'id' => $eleve->id,
                        'nom_complet' => $eleve->nom_complet,
                        'classe' => $eleve->classe ? [
                            'id' => $eleve->classe->id,
                            'nom' => $eleve->classe->nom_complet,
                        ] : null,
                    ];
                });
            }),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
