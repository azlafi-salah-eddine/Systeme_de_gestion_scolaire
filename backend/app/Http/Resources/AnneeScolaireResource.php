<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnneeScolaireResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            "id" => $this->id,
            "nom" => $this->nom,
            "annee_debut" => $this->getAnneeDebut(), // Accessor method
            "annee_fin" => $this->getAnneeFin(), // Accessor method
            "date_debut" => $this->date_debut?->format("Y-m-d"),
            "date_fin" => $this->date_fin?->format("Y-m-d"),
            "active" => $this->active,
            "description" => $this->description,
            "nom_formate" => $this->nom_formate,
            "created_at" => $this->created_at?->format("Y-m-d H:i:s"),
            "updated_at" => $this->updated_at?->format("Y-m-d H:i:s"),
            
            // Relations optionnelles
            "classes" => $this->whenLoaded("classes", function () {
                return $this->classes->map(function ($classe) {
                    return [
                        'id' => $classe->id,
                        'nom' => $classe->nom,
                        'niveau' => $classe->niveau,
                        'section' => $classe->section,
                        'capacite' => $classe->capacite,
                        'active' => $classe->active,
                    ];
                });
            }),
            "eleves" => $this->whenLoaded("eleves", function () {
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
            "paiements" => $this->whenLoaded("paiements", function () {
                return $this->paiements->map(function ($paiement) {
                    return [
                        'id' => $paiement->id,
                        'montant' => $paiement->montant,
                        'date_paiement' => $paiement->date_paiement?->format('Y-m-d'),
                        'type_paiement' => $paiement->type_paiement,
                        'statut' => $paiement->statut,
                    ];
                });
            }),
            "notes" => $this->whenLoaded("notes", function () {
                return $this->notes->map(function ($note) {
                    return [
                        'id' => $note->id,
                        'note' => $note->note,
                        'coefficient' => $note->coefficient,
                        'type_evaluation' => $note->type_evaluation,
                        'date_evaluation' => $note->date_evaluation?->format('Y-m-d'),
                    ];
                });
            }),
            
            // Statistiques (calculées à la volée)
            "statistiques" => $this->when($request->boolean('include_stats'), [
                'nombre_classes' => $this->whenLoaded('classes', fn() => $this->classes->count()),
                'nombre_eleves' => $this->whenLoaded('eleves', fn() => $this->eleves->count()),
                'nombre_paiements' => $this->whenLoaded('paiements', fn() => $this->paiements->count()),
                'nombre_notes' => $this->whenLoaded('notes', fn() => $this->notes->count()),
            ]),
        ];
    }
}
