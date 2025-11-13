<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActiviteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'description' => $this->description,
            'capacite' => $this->capacite,
            'places_disponibles' => $this->places_disponibles,
            'est_complet' => $this->est_complet,
            'date_debut' => $this->date_debut?->format('Y-m-d'),
            'date_fin' => $this->date_fin?->format('Y-m-d'),
            'heure_debut' => $this->heure_debut?->format('H:i'),
            'heure_fin' => $this->heure_fin?->format('H:i'),
            'lieu' => $this->lieu,
            'prix' => $this->prix,
            'type' => $this->type,
            'type_label' => $this->type_label,
            'responsable_id' => $this->responsable_id,
            'responsable' => $this->whenLoaded('responsable', function () {
                return [
                    'id' => $this->responsable->id,
                    'nom' => $this->responsable->nom,
                    'prenom' => $this->responsable->prenom,
                    'nom_complet' => $this->responsable->nom . ' ' . $this->responsable->prenom,
                ];
            }),
            'active' => $this->active,
            'est_en_cours' => $this->est_en_cours,
            'est_terminee' => $this->est_terminee,
            'eleves_count' => $this->when(isset($this->eleves), function () {
                return $this->eleves->count();
            }),
            'eleves' => EleveResource::collection($this->whenLoaded('eleves')),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}