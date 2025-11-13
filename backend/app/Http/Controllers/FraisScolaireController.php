<?php

namespace App\Http\Controllers;

use App\Models\FraisScolaire;
use App\Models\Eleve;
use App\Models\PaiementEleve;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FraisScolaireController extends Controller
{
    /**
     * Afficher la liste des frais scolaires
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = FraisScolaire::with(['niveau', 'anneeScolaire'])->active();

            if ($request->filled('type')) {
                $query->where('type', $request->input('type'));
            }

            if ($request->filled('niveau_id')) {
                $query->where('niveau_id', $request->input('niveau_id'));
            }

            // classe_id removed from model/schema; filter no longer supported

            $perPage = (int) $request->input('per_page', 15);
            $items = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $items->items(),
                'meta' => [
                    'current_page' => $items->currentPage(),
                    'per_page' => $items->perPage(),
                    'total' => $items->total(),
                    'last_page' => $items->lastPage(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des frais: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer un nouveau frais scolaire
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'required|string|in:scolarite,cantine,transport',
                'nom' => 'required|string|max:255',
                'description' => 'nullable|string',
                'montant_mensuel' => 'required|numeric|min:0',
                'niveau_id' => 'nullable|exists:niveaux,id',
                'obligatoire' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            $anneeScolaireId = $this->getActiveAnneeScolaireId();
            $data['annee_scolaire_id'] = $anneeScolaireId;
            $data['obligatoire'] = $data['obligatoire'] ?? true;

            // Vérifier s'il existe déjà un frais scolaire avec le même type et niveau
            $existingFrais = FraisScolaire::where('type', $data['type'])
                ->where('annee_scolaire_id', $anneeScolaireId)
                ->where('niveau_id', $data['niveau_id'] ?? null)
                ->where('active', true)
                ->first();

            if ($existingFrais) {
                return response()->json([
                    'success' => false,
                    'message' => 'Un frais scolaire de type "' . $data['type'] . '" existe déjà pour ce niveau',
                    'errors' => ['duplicate' => 'Ce type de frais existe déjà pour ce niveau']
                ], 422);
            }

            $frais = FraisScolaire::create($data);
            $frais->load(['niveau', 'anneeScolaire']);

            return response()->json([
                'success' => true,
                'data' => $frais,
                'message' => 'Frais scolaire créé avec succès'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un frais scolaire spécifique
     */
    public function show(FraisScolaire $fraisScolaire): JsonResponse
    {
        try {
            $fraisScolaire->load(['niveau', 'anneeScolaire']);

            return response()->json([
                'success' => true,
                'data' => $fraisScolaire
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour un frais scolaire
     */
    public function update(Request $request, FraisScolaire $fraisScolaire): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'sometimes|required|string|in:scolarite,cantine,transport',
                'nom' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'montant_mensuel' => 'sometimes|required|numeric|min:0',
                'niveau_id' => 'nullable|exists:niveaux,id',
                'obligatoire' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $fraisScolaire->update($request->all());
            $fraisScolaire->load(['niveau', 'anneeScolaire']);

            return response()->json([
                'success' => true,
                'data' => $fraisScolaire,
                'message' => 'Frais scolaire mis à jour avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un frais scolaire
     */
    public function destroy(FraisScolaire $fraisScolaire): JsonResponse
    {
        try {
            $fraisScolaire->update(['active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Frais scolaire supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer les paiements mensuels pour tous les élèves
     */
    public function genererPaiementsMensuels(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'mois' => 'required|string|regex:/^\d{4}-\d{2}$/', // Format: 2024-01
                'annee_scolaire_id' => 'nullable|exists:annees_scolaires,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $mois = $request->input('mois');
            $anneeScolaireId = $request->input('annee_scolaire_id') ?? $this->getActiveAnneeScolaireId();

            DB::beginTransaction();

            // Récupérer tous les frais scolaires actifs
            $fraisScolaires = FraisScolaire::where('annee_scolaire_id', $anneeScolaireId)
                ->where('active', true)
                ->get();

            // Récupérer tous les élèves actifs (en tenant compte des différentes structures de la table classes)
            $relations = [
                'classe.niveau',
                'cantine',
                'transport',
            ];

            if (Schema::hasTable('cantine_eleve')) {
                $relations[] = 'cantines';
            }

            if (Schema::hasTable('transport_eleve')) {
                $relations[] = 'transports';
            }

            // Récupérer tous les élèves actifs de l'année scolaire spécifiée (via leur classe)
            // IMPORTANT: On génère pour TOUTES les classes de l'année scolaire, même si certaines n'ont pas encore de paiements
            $eleves = Eleve::where('active', true)
                ->whereNotNull('classe_id') // Seulement les élèves affectés à une classe
                ->whereHas('classe', function ($q) use ($anneeScolaireId) {
                    $q->where('annee_scolaire_id', $anneeScolaireId)
                      ->where('active', true); // Seulement les classes actives
                })
                ->with($relations)
                ->get();

            $paiementsCrees = 0;
            $paiementsExistants = 0;
            $elevesSansPaiements = [];
            $elevesAvecPaiements = [];
            $elevesSansFraisApplicables = [];

            foreach ($eleves as $eleve) {
                $eleveAvecPaiements = false;
                $eleveSansPaiements = false;
                $eleveAvecFraisApplicables = false;
                
                foreach ($fraisScolaires as $frais) {
                    // Vérifier si l'élève est éligible pour ce type de frais
                    if ($frais->type === 'cantine') {
                        $inscritCantine = false;

                        if (!empty($eleve->cantine_id)) {
                            $inscritCantine = true;
                        }

                        if (!$inscritCantine && $eleve->relationLoaded('cantine') && $eleve->cantine) {
                            $inscritCantine = true;
                        }

                        if (
                            !$inscritCantine
                            && method_exists($eleve, 'cantines')
                            && $eleve->relationLoaded('cantines')
                            && $eleve->cantines
                            && $eleve->cantines->isNotEmpty()
                        ) {
                            $inscritCantine = true;
                        }

                        if (!$inscritCantine) {
                            continue; // Élève non inscrit à la cantine, passer au frais suivant
                        }
                    }

                    if ($frais->type === 'transport') {
                        $inscritTransport = false;

                        if (!empty($eleve->transport_id)) {
                            $inscritTransport = true;
                        }

                        if (!$inscritTransport && $eleve->relationLoaded('transport') && $eleve->transport) {
                            $inscritTransport = true;
                        }

                        if (
                            !$inscritTransport
                            && method_exists($eleve, 'transports')
                            && $eleve->relationLoaded('transports')
                            && $eleve->transports
                            && $eleve->transports->isNotEmpty()
                        ) {
                            $inscritTransport = true;
                        }

                        if (!$inscritTransport) {
                            continue; // Élève non inscrit au transport, passer au frais suivant
                        }
                    }

                    // Pour scolarité, TOUS les élèves avec une classe doivent recevoir le paiement
                    // (pas de vérification d'inscription nécessaire)
                    
                    $montant = $frais->getMontantForEleve($eleve->id);
                    
                    if ($montant > 0) {
                        $eleveAvecFraisApplicables = true;
                        
                        // Vérifier si le paiement existe déjà
                        $paiementExistant = PaiementEleve::where('eleve_id', $eleve->id)
                            ->where('frais_scolaire_id', $frais->id)
                            ->where('mois', $mois)
                            ->where('annee_scolaire_id', $anneeScolaireId)
                            ->first();

                        if ($paiementExistant) {
                            $paiementsExistants++;
                            $eleveAvecPaiements = true;
                        } else {
                            // Créer le paiement manquant
                            PaiementEleve::create([
                                'eleve_id' => $eleve->id,
                                'frais_scolaire_id' => $frais->id,
                                'mois' => $mois,
                                'montant_du' => $montant,
                                'montant_paye' => 0,
                                'montant_restant' => $montant,
                                'statut' => 'en_attente',
                                'date_echeance' => now()->addDays(15), // 15 jours pour payer
                                'annee_scolaire_id' => $anneeScolaireId
                            ]);
                            $paiementsCrees++;
                            $eleveSansPaiements = true;
                        }
                    }
                }
                
                // Suivi des élèves pour le rapport
                if ($eleveSansPaiements && !in_array($eleve->id, $elevesSansPaiements)) {
                    $elevesSansPaiements[] = $eleve->id;
                }
                if ($eleveAvecPaiements && !in_array($eleve->id, $elevesAvecPaiements)) {
                    $elevesAvecPaiements[] = $eleve->id;
                }
                if (!$eleveAvecFraisApplicables && !in_array($eleve->id, $elevesSansFraisApplicables)) {
                    $elevesSansFraisApplicables[] = $eleve->id;
                }
            }

            DB::commit();

            $totalEleves = $eleves->count();
            $totalClasses = $eleves->pluck('classe_id')->unique()->count();
            $elevesAvecPaiementsCompteur = count($elevesAvecPaiements);
            $elevesSansPaiementsCompteur = count($elevesSansPaiements);
            $elevesSansFraisCompteur = count($elevesSansFraisApplicables);
            
            // Message détaillé
            $message = "Génération terminée pour le mois $mois.\n";
            $message .= "$paiementsCrees nouveau(x) paiement(s) créé(s)\n";
            $message .= "$paiementsExistants paiement(s) existant(s) déjà présents\n";
            $message .= "$elevesSansPaiementsCompteur élève(s) avec nouveau(x) paiement(s)\n";
            $message .= "$elevesAvecPaiementsCompteur élève(s) avec paiement(s) déjà existant(s)\n";
            if ($elevesSansFraisCompteur > 0) {
                $message .= "\nATTENTION: $elevesSansFraisCompteur élève(s) sans frais applicables.\n";
                $message .= "Vérifiez que des frais scolaires sont configurés pour leurs niveaux.\n";
            }
            $message .= "\nTotal: $totalEleves élève(s) dans $totalClasses classe(s)";
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'paiements_crees' => $paiementsCrees,
                    'paiements_existants' => $paiementsExistants,
                    'eleves_traites' => $totalEleves,
                    'eleves_avec_nouveaux_paiements' => $elevesSansPaiementsCompteur,
                    'eleves_avec_paiements_existants' => $elevesAvecPaiementsCompteur,
                    'eleves_sans_frais_applicables' => $elevesSansFraisCompteur,
                    'classes_traitees' => $totalClasses,
                    'mois' => $mois,
                    'annee_scolaire_id' => $anneeScolaireId,
                    'frais_scolaires_trouves' => $fraisScolaires->count()
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des frais
     */
    public function statistiques(Request $request): JsonResponse
    {
        try {
            $anneeScolaireId = $request->input('annee_scolaire_id') ?? $this->getActiveAnneeScolaireId();
            $mois = $request->input('mois', now()->format('Y-m'));

            $stats = [
                'total_frais' => FraisScolaire::where('annee_scolaire_id', $anneeScolaireId)->active()->count(),
                'total_paiements' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                    ->where('mois', $mois)
                    ->count(),
                'montant_total_du' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                    ->where('mois', $mois)
                    ->sum('montant_du'),
                'montant_total_paye' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                    ->where('mois', $mois)
                    ->sum('montant_paye'),
                'montant_total_restant' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                    ->where('mois', $mois)
                    ->sum('montant_restant'),
                'paiements_regles' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                    ->where('mois', $mois)
                    ->where('statut', 'regle')
                    ->count(),
                'paiements_en_retard' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                    ->where('mois', $mois)
                    ->enRetard()
                    ->count()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getActiveAnneeScolaireId()
    {
        $anneeActive = \App\Models\AnneeScolaire::where('active', true)->first();
        return $anneeActive ? $anneeActive->id : 1;
    }
}