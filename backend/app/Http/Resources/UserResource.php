<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $nomComplet = ($this->nom && $this->prenom) ? trim($this->nom . ' ' . $this->prenom) : ($this->nom || $this->prenom || $this->nom_complet);
        
        // Si c'est un professeur, trouver l'ID du professeur associé
        $professeurId = null;
        if ($this->hasRole('professeur')) {
            $professeur = $this->getProfesseur();
            if ($professeur) {
                $professeurId = $professeur->id;
            }
        }
        
        // Si c'est un élève, trouver l'ID de l'élève associé et sa classe
        $eleveId = null;
        $classeId = null;
        if ($this->hasRole('eleve')) {
            $eleve = $this->getEleve();
            if ($eleve) {
                $eleveId = $eleve->id;
                $classeId = $eleve->classe_id;
            }
        }
        
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'name' => $nomComplet ?? $this->email,
            'nom_complet' => $nomComplet,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'role_id' => $this->role_id,
            'role' => $this->whenLoaded('role', function () {
                return $this->role ? [
                    'id' => $this->role->id,
                    'type' => $this->role->type,
                    'active' => $this->role->active,
                ] : null;
            }),
            'roles' => $this->role ? [$this->role->type] : [], // Pour compatibilité
            'professeur_id' => $professeurId, // ID du professeur si c'est un professeur
            'eleve_id' => $eleveId, // ID de l'élève si c'est un élève
            'classe_id' => $classeId, // ID de la classe si c'est un élève
            'created_at' => $this->created_at?->format('Y-m-d'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
