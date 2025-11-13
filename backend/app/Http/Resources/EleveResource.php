<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EleveResource extends JsonResource
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
            'nom_fr' => $this->nom_fr,
            'prenom_fr' => $this->prenom_fr,
            'nom_ar' => $this->nom_ar,
            'prenom_ar' => $this->prenom_ar,
            'nom_complet' => $this->nom_complet,
            'date_naissance' => $this->date_naissance?->format('Y-m-d'),
            'age' => $this->age,
            'lieu_naissance_fr' => $this->lieu_naissance_fr,
            'lieu_naissance_ar' => $this->lieu_naissance_ar,
            'sexe' => $this->sexe,
            'matricule' => $this->matricule,
            'cne' => $this->cne,
            'cin' => $this->cin,
            'photo' => $this->photo
                ? (str_starts_with($this->photo, 'http')
                    ? $this->photo
                    : 'http://localhost:8000/storage/' . $this->photo)
                : null,
            'adresse' => $this->adresse,
            'ancienne_ecole' => $this->ancienne_ecole,
            'infos_sante' => $this->infos_sante,
            'groupe_sanguin' => $this->groupe_sanguin,
            'allergies' => $this->allergies,
            'classe' => $this->whenLoaded('classe', function () {
                return [
                    'id' => $this->classe->id,
                    'nom' => $this->classe->nom,
                    'niveau' => $this->when($this->classe->relationLoaded('niveau'), function () {
                        return [
                            'id' => $this->classe->niveau->id,
                            'nom' => $this->classe->niveau->nom,
                        ];
                    }),
                ];
            }),
            'parents' => $this->whenLoaded('parents', function () {
                return $this->parents->map(function ($parent) {
                    return [
                        'id' => $parent->id,
                        'nom_complet' => $parent->nom_complet,
                        'telephone' => $parent->telephone,
                        'email' => $parent->email,
                        'relation' => $parent->pivot->relation,
                        'contact_principal' => $parent->pivot->contact_principal,
                    ];
                });
            }),
            // Helper fields pour faciliter l'identification père/mère
            'pere_id' => $this->whenLoaded('parents', function () {
                $pere = $this->parents->firstWhere('pivot.relation', 'pere');
                return $pere ? $pere->id : null;
            }),
            'mere_id' => $this->whenLoaded('parents', function () {
                $mere = $this->parents->firstWhere('pivot.relation', 'mere');
                return $mere ? $mere->id : null;
            }),
            'tuteur_id' => $this->whenLoaded('parents', function () {
                $tuteur = $this->parents->firstWhere('pivot.relation', 'tuteur');
                return $tuteur ? $tuteur->id : null;
            }),
            'date_inscription' => $this->date_inscription?->format('Y-m-d'),
            'active' => $this->active,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            // Données pivot pour les activités
            'pivot' => $this->when($this->pivot, function () {
                return [
                    'date_inscription' => $this->pivot->date_inscription,
                    'statut' => $this->pivot->statut,
                ];
            }),
        ];
    }
}
