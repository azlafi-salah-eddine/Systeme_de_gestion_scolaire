<?php

namespace App\Http\Controllers;

use App\Models\Eleve;
use App\Models\Classe;
use App\Models\Professeur;
use App\Models\ParentEleve;
use App\Models\Matiere;
use App\Models\Niveau;
use App\Models\Cantine;
use App\Models\Menu;
use App\Models\Transport;
use App\Models\Chauffeur;
use App\Models\Accompagnateur;
use App\Models\Salle;
use App\Models\Activite;
use App\Models\Paiement;
use App\Models\Controle;
use App\Models\AnneeScolaire;
use App\Models\Note;
use App\Models\Absence;
use App\Models\Periode;
use App\Models\EmploiDuTemps;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Récupère toutes les statistiques du dashboard filtrées par année scolaire active
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $currentUser = $request->user();
            // Utiliser l'année scolaire active du middleware ou la récupérer
            $anneeActive = $request->get('annee_active') ?? AnneeScolaire::getActive();
            
            if (!$anneeActive) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune année scolaire active',
                    'data' => $this->getEmptyStats()
                ], 404);
            }

            // Si c'est un professeur, filtrer les statistiques par ses classes
            $professeur = null;
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = Professeur::where('nom', $currentUser->nom)
                    ->where('prenom', $currentUser->prenom)
                    ->first();
            }

            // Récupérer toutes les statistiques filtrées par année scolaire active
            $stats = $this->getAllStatistics($anneeActive->id, $professeur);

            return response()->json([
                'success' => true,
                'data' => $stats,
                'annee_scolaire' => [
                    'id' => $anneeActive->id,
                    'nom' => $anneeActive->nom,
                    'annee_debut' => $anneeActive->annee_debut,
                    'annee_fin' => $anneeActive->annee_fin,
                    'statut' => $anneeActive->statut,
                    'active' => $anneeActive->active
                ]
            ], 200, [], JSON_UNESCAPED_UNICODE);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère toutes les statistiques filtrées par année scolaire active
     */
    private function getAllStatistics(int $anneeScolaireId, ?Professeur $professeur = null): array
    {
        try {
            // Debug: Log l'ID de l'année scolaire
            \Log::info("Dashboard: Calcul des statistiques pour l'année scolaire ID: $anneeScolaireId");
            
            // Si c'est un professeur, récupérer ses classes
            $classeIds = null;
            if ($professeur) {
                $classeIds = $professeur->classes()
                    ->where('annee_scolaire_id', $anneeScolaireId)
                    ->pluck('classes.id')
                    ->toArray();
                
                if (empty($classeIds)) {
                    // Si pas de classes, retourner des stats vides
                    return $this->getEmptyStats();
                }
            }
            
            // Statistiques filtrées par année scolaire active
            $stats = [
                // Entités directement liées à l'année scolaire
                'classes' => $classeIds 
                    ? Classe::whereIn('id', $classeIds)->where('active', true)->count()
                    : Classe::where('annee_scolaire_id', $anneeScolaireId)->where('active', true)->count(),
                'periodes' => Periode::where('annee_scolaire_id', $anneeScolaireId)->where('active', true)->count(),
                'controles' => $professeur
                    ? Controle::where('professeur_id', $professeur->id)->where('annee_scolaire_id', $anneeScolaireId)->where('active', true)->count()
                    : Controle::where('annee_scolaire_id', $anneeScolaireId)->where('active', true)->count(),
                'notes' => $classeIds
                    ? Note::whereHas('eleve.classe', function($query) use ($classeIds) {
                        $query->whereIn('classes.id', $classeIds);
                    })->where('professeur_id', $professeur->id)->where('annee_scolaire_id', $anneeScolaireId)->where('active', true)->count()
                    : Note::where('annee_scolaire_id', $anneeScolaireId)->where('active', true)->count(),
                'absences' => $classeIds
                    ? Absence::whereHas('eleve.classe', function($query) use ($classeIds) {
                        $query->whereIn('classes.id', $classeIds);
                    })->where('annee_scolaire_id', $anneeScolaireId)->where('active', true)->count()
                    : Absence::where('annee_scolaire_id', $anneeScolaireId)->where('active', true)->count(),
                'paiements' => $classeIds
                    ? Paiement::whereHas('eleve.classe', function($q) use ($classeIds) {
                        $q->whereIn('classes.id', $classeIds);
                    })->where('active', true)->count()
                    : $this->safeCount(Paiement::class, ['annee_scolaire_id' => $anneeScolaireId, 'active' => true]),
                'emplois_du_temps' => $professeur
                    ? EmploiDuTemps::where('professeur_id', $professeur->id)->where('annee_scolaire_id', $anneeScolaireId)->where('active', true)->count()
                    : EmploiDuTemps::where('annee_scolaire_id', $anneeScolaireId)->where('active', true)->count(),
                
                // Entités liées indirectement via classes
                'eleves' => $classeIds
                    ? Eleve::whereIn('classe_id', $classeIds)->where('active', true)->count()
                    : Eleve::whereHas('classe', function($query) use ($anneeScolaireId) {
                        $query->where('annee_scolaire_id', $anneeScolaireId)->where('active', true);
                    })->where('active', true)->count(),
                
                // Entités globales (pas liées à une année spécifique) - masquées pour les professeurs
                'professeurs' => $professeur ? 0 : Professeur::where('active', true)->count(),
                'parents' => $classeIds
                    ? ParentEleve::whereHas('eleves.classe', function($query) use ($classeIds) {
                        $query->whereIn('classes.id', $classeIds);
                    })->where('active', true)->count()
                    : ($professeur ? 0 : ParentEleve::where('active', true)->count()),
                'matieres' => $professeur
                    ? $professeur->matieres()->where('active', true)->count()
                    : Matiere::where('active', true)->count(),
                'niveaux' => $professeur ? 0 : Niveau::where('active', true)->count(),
                'cantines' => $professeur ? 0 : Cantine::where('active', true)->count(),
                'menus' => $professeur ? 0 : Menu::where('active', true)->count(),
                'transports' => $professeur ? 0 : Transport::where('active', true)->count(),
                'chauffeurs' => $professeur ? 0 : Chauffeur::where('active', true)->count(),
                'accompagnateurs' => $professeur ? 0 : Accompagnateur::where('active', true)->count(),
                'salles' => $professeur ? 0 : Salle::where('active', true)->count(),
                'activites' => $professeur ? 0 : Activite::where('active', true)->count(),
            ];

            // Ajouter des statistiques calculées
            $stats['total_eleves_annee'] = $stats['eleves'];
            $stats['total_classes_annee'] = $stats['classes'];
            $stats['total_controles_annee'] = $stats['controles'];
            $stats['total_notes_annee'] = $stats['notes'];
            $stats['total_absences_annee'] = $stats['absences'];
            $stats['total_paiements_annee'] = $stats['paiements'];

            // Debug: Log les statistiques calculées
            \Log::info("Dashboard: Statistiques calculées", $stats);
            
            return $stats;
        } catch (\Exception $e) {
            // Debug: Log l'erreur
            \Log::error("Dashboard: Erreur lors du calcul des statistiques", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // En cas d'erreur, retourner des statistiques de base
            return $this->getEmptyStats();
        }
    }


    /**
     * Compte de manière sécurisée, retourne 0 si la table n'existe pas
     */
    private function safeCount(string $model, array $conditions = []): int
    {
        try {
            $query = $model::query();
            foreach ($conditions as $column => $value) {
                $query->where($column, $value);
            }
            return $query->count();
        } catch (\Exception $e) {
            \Log::warning("Table non trouvée pour le modèle $model: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Retourne des statistiques vides
     */
    private function getEmptyStats(): array
    {
        return [
            'eleves' => 0,
            'classes' => 0,
            'periodes' => 0,
            'controles' => 0,
            'notes' => 0,
            'absences' => 0,
            'paiements' => 0,
            'emplois_du_temps' => 0,
            'professeurs' => 0,
            'parents' => 0,
            'matieres' => 0,
            'niveaux' => 0,
            'cantines' => 0,
            'menus' => 0,
            'transports' => 0,
            'chauffeurs' => 0,
            'accompagnateurs' => 0,
            'salles' => 0,
            'activites' => 0,
            'total_eleves_annee' => 0,
            'total_classes_annee' => 0,
            'total_controles_annee' => 0,
            'total_notes_annee' => 0,
            'total_absences_annee' => 0,
            'total_paiements_annee' => 0
        ];
    }
}

