<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmploiDuTempsResource extends JsonResource
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
            'classe_id' => $this->classe_id,
            'professeur_id' => $this->professeur_id,
            'matiere_id' => $this->matiere_id,
            'salle_id' => $this->salle_id,
            'jour' => $this->jour,
            'heure_debut' => $this->heure_debut,
            'heure_fin' => $this->heure_fin,
            'active' => (bool) ($this->active ?? true),

            // Convenience fields for frontend
            'classe_nom' => $this->whenLoaded('classe', fn () => $this->classe?->nom),
            'matiere_nom' => $this->whenLoaded('matiere', fn () => $this->matiere?->nom),
            'matiere_couleur' => $this->whenLoaded('matiere', fn () => $this->matiere?->couleur),
            'professeur_nom' => $this->whenLoaded('professeur', fn () => $this->professeur?->nom_complet ?? trim(($this->professeur?->prenom.' '.($this->professeur?->nom))) ),
            'salle_nom' => $this->whenLoaded('salle', fn () => $this->salle?->nom),
            
            // Status fields for checking if elements are active
            'matiere_active' => $this->whenLoaded('matiere', fn () => $this->matiere?->active),
            'professeur_active' => $this->whenLoaded('professeur', fn () => $this->professeur?->active),
            'salle_active' => $this->whenLoaded('salle', fn () => $this->salle?->active),
            'classe_active' => $this->whenLoaded('classe', fn () => $this->classe?->active),

            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
