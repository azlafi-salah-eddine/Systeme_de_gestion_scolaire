<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            "id" => $this->id,
            "eleve_id" => $this->eleve_id,
            "controle_id" => $this->controle_id,
            "professeur_id" => $this->professeur_id,
            "note" => $this->note,
            "bareme" => $this->bareme,
            "periode_id" => $this->periode_id,
            "annee_scolaire_id" => $this->annee_scolaire_id,
            "active" => $this->active,
            "created_at" => $this->created_at?->format("Y-m-d H:i:s"),
            "updated_at" => $this->updated_at?->format("Y-m-d H:i:s"),
            
            // Relations optionnelles - simplified to avoid circular references
            "eleve" => $this->whenLoaded("eleve", function () {
                return [
                    'id' => $this->eleve->id,
                    'nom_fr' => $this->eleve->nom_fr,
                    'prenom_fr' => $this->eleve->prenom_fr,
                    'nom_complet' => $this->eleve->nom_complet,
                ];
            }),
            "controle" => $this->whenLoaded("controle", function () {
                return [
                    'id' => $this->controle->id,
                    'nom' => $this->controle->nom,
                    'type' => $this->controle->type,
                ];
            }),
            "professeur" => $this->whenLoaded("professeur", function () {
                return [
                    'id' => $this->professeur->id,
                    'nom' => $this->professeur->nom,
                    'prenom' => $this->professeur->prenom,
                    'nom_complet' => $this->professeur->nom_complet,
                ];
            }),
            "periode" => $this->whenLoaded("periode", function () {
                return [
                    'id' => $this->periode->id,
                    'nom' => $this->periode->nom,
                    'description' => $this->periode->description,
                    'date_debut' => $this->periode->date_debut?->format("Y-m-d"),
                    'date_fin' => $this->periode->date_fin?->format("Y-m-d"),
                ];
            }),
            "annee_scolaire" => $this->whenLoaded("anneeScolaire", function () {
                return [
                    'id' => $this->anneeScolaire->id,
                    'nom' => $this->anneeScolaire->nom,
                    'annee_debut' => $this->anneeScolaire->getAnneeDebut(),
                    'annee_fin' => $this->anneeScolaire->getAnneeFin(),
                    'active' => $this->anneeScolaire->active,
                ];
            }),
        ];
    }
}
