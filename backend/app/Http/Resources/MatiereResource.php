<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MatiereResource extends JsonResource
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
            'code' => $this->code,
            'description' => $this->description,
            'couleur' => $this->coleur,
            'coefficient' => $this->coefficient,
            'niveau_id' => $this->niveau_id,
            'active' => $this->active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'niveau' => $this->whenLoaded('niveau', function () {
                return [
                    'id' => $this->niveau->id,
                    'nom' => $this->niveau->nom,
                ];
            }),
        ];
    }
}
