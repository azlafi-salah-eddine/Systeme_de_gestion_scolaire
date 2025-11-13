<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClasseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $nombreEleves = $this->whenLoaded('eleves', fn () => $this->eleves->count(), fn () => $this->eleves_count ?? $this->eleves()->count());
        $capacite = (int) ($this->capacite ?? 0);
        $tauxOccupation = $capacite > 0 ? round(($nombreEleves / $capacite) * 100, 2) : 0;

        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'niveau' => $this->when(
                $this->relationLoaded('niveau') && $this->niveau,
                function () {
                    return [
                        'id' => $this->niveau->id,
                        'nom' => $this->niveau->nom,
                        'description' => $this->niveau->description,
                        'bareme' => $this->niveau->bareme ?? 20.00,
                        'active' => $this->niveau->active,
                    ];
                },
                $this->niveau
            ),
            'niveau_id' => $this->niveau_id,
            'section' => $this->section,
            'annee_scolaire' => $this->annee_scolaire,
            'annee_scolaire_id' => $this->annee_scolaire_id,
            'capacite' => $this->capacite,
            'professeur_principal_id' => $this->professeur_principal_id,
            'active' => (bool) $this->active,

            'nom_complet' => $this->nom_complet,
            'nom_court' => trim(($this->nom ?: ((is_object($this->niveau) ? $this->niveau->nom : $this->niveau) . ' ' . $this->section)) ?: ''),
            'nombre_eleves' => $nombreEleves,
            'taux_occupation' => $tauxOccupation,
            'est_complete' => (bool) $this->est_complete,

            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),

            'annee_scolaire_detail' => $this->when(
                $this->relationLoaded('anneeScolaire') && $this->getRelation('anneeScolaire'),
                function () {
                    $anneeScolaire = $this->getRelation('anneeScolaire');
                    return [
                        'id' => $anneeScolaire->id,
                        'nom' => $anneeScolaire->nom,
                        'annee_debut' => $anneeScolaire->getAnneeDebut(),
                        'annee_fin' => $anneeScolaire->getAnneeFin(),
                        'active' => $anneeScolaire->active,
                        'nom_formate' => $anneeScolaire->nom_formate,
                    ];
                }
            ),
            'eleves' => $this->whenLoaded('eleves', function () {
                return $this->eleves->map(function ($eleve) {
                    return [
                        'id' => $eleve->id,
                        'nom_fr' => $eleve->nom_fr,
                        'prenom_fr' => $eleve->prenom_fr,
                        'nom_complet' => $eleve->nom_complet,
                        'date_naissance' => $eleve->date_naissance?->format('Y-m-d'),
                        'active' => $eleve->active,
                    ];
                });
            }),
            'professeurs' => $this->whenLoaded('professeurs', function () {
                return $this->professeurs->map(function ($professeur) {
                    return [
                        'id' => $professeur->id,
                        'nom' => $professeur->nom,
                        'prenom' => $professeur->prenom,
                        'nom_complet' => $professeur->nom_complet,
                        'email' => $professeur->email,
                        'telephone' => $professeur->telephone,
                    ];
                });
            }),
            'matieres' => $this->whenLoaded('matieres', function () {
                return $this->matieres->map(function ($matiere) {
                    return [
                        'id' => $matiere->id,
                        'nom' => $matiere->nom,
                        'code' => $matiere->code,
                        'coefficient' => $matiere->coefficient,
                        'active' => $matiere->active,
                    ];
                });
            }),
            'emplois_du_temps' => $this->whenLoaded('emploisDuTemps', function () {
                return $this->emploisDuTemps->map(function ($emploi) {
                    return [
                        'id' => $emploi->id,
                        'jour' => $emploi->jour,
                        'heure_debut' => $emploi->heure_debut,
                        'heure_fin' => $emploi->heure_fin,
                        'active' => $emploi->active,
                    ];
                });
            }),
            'professeur_principal' => $this->when(
                $this->relationLoaded('professeurPrincipal') && $this->professeurPrincipal,
                function () {
                    return [
                        'id' => $this->professeurPrincipal->id,
                        'nom' => $this->professeurPrincipal->nom,
                        'prenom' => $this->professeurPrincipal->prenom,
                        'nom_complet' => $this->professeurPrincipal->nom_complet,
                        'email' => $this->professeurPrincipal->email,
                        'telephone' => $this->professeurPrincipal->telephone,
                    ];
                }
            ),
        ];
    }
}
