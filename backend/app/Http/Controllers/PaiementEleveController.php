<?php

namespace App\Http\Controllers;

use App\Models\PaiementEleve;
use App\Models\Eleve;
use App\Models\HistoriquePaiement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class PaiementEleveController extends Controller
{
    /**
     * Afficher la liste des paiements des élèves
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $relations = [
                'eleve.classe.niveau',
                'fraisScolaire.niveau',
                'anneeScolaire'
            ];
            
            // Charger les historiques si la table existe
            if (Schema::hasTable('historique_paiements')) {
                $orderColumn = null;
                $hasCreatedAt = false;
                
                if (Schema::hasColumn('historique_paiements', 'date_paiement')) {
                    $orderColumn = 'date_paiement';
                }
                
                if (Schema::hasColumn('historique_paiements', 'created_at')) {
                    $hasCreatedAt = true;
                    if (!$orderColumn) {
                        $orderColumn = 'created_at';
                    }
                }
                
                $relations['historiquePaiements'] = function($historiqueQuery) use ($orderColumn, $hasCreatedAt) {
                    $historiqueQuery->with('utilisateur');
                    
                    if ($orderColumn) {
                        $historiqueQuery->orderBy($orderColumn, 'desc');
                        
                        if ($orderColumn !== 'created_at' && $hasCreatedAt) {
                            $historiqueQuery->orderBy('created_at', 'desc');
                        }
                    }
                };
            }
            
            $query = PaiementEleve::with($relations)->active();
            
            // Exclure les élèves non affectés (sans classe)
            $query->whereHas('eleve', function ($q) {
                $q->whereNotNull('classe_id');
            });

            // Filtres
            if ($request->filled('eleve_id')) {
                $query->where('eleve_id', $request->input('eleve_id'));
            }

            if ($request->filled('mois')) {
                $query->where('mois', $request->input('mois'));
            }

            if ($request->filled('statut')) {
                $query->where('statut', $request->input('statut'));
            }

            if ($request->filled('type_frais')) {
                $query->whereHas('fraisScolaire', function($q) use ($request) {
                    $q->where('type', $request->input('type_frais'));
                });
            }

            if ($request->filled('frais_scolaire_id')) {
                $query->where('frais_scolaire_id', $request->input('frais_scolaire_id'));
            }

            if ($request->filled('classe_id')) {
                $query->whereHas('eleve', function($q) use ($request) {
                    $q->where('classe_id', $request->input('classe_id'));
                });
            }

            if ($request->filled('niveau_id')) {
                $query->whereHas('eleve.classe', function($q) use ($request) {
                    $q->where('niveau_id', $request->input('niveau_id'));
                });
            }

            if ($request->filled('niveau')) {
                $niveau = $request->input('niveau');
                $hasNiveauColumn = Schema::hasColumn('classes', 'niveau');

                if ($hasNiveauColumn) {
                    $query->where(function($nested) use ($niveau) {
                        $nested->whereHas('eleve.classe', function($classeQuery) use ($niveau) {
                            $classeQuery->where('niveau', $niveau);
                        })->orWhereHas('eleve.classe.niveau', function($niveauQuery) use ($niveau) {
                            $niveauQuery->where('nom', $niveau);
                        });
                    });
                } else {
                    $query->whereHas('eleve.classe.niveau', function($niveauQuery) use ($niveau) {
                        $niveauQuery->where('nom', $niveau);
                    });
                }
            }

            if ($request->filled('annee_scolaire_id')) {
                $query->where('annee_scolaire_id', $request->input('annee_scolaire_id'));
            }

            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->whereHas('eleve', function($q) use ($search) {
                    $q->where(function($subQuery) use ($search) {
                        $subQuery
                            ->where('nom_fr', 'like', "%{$search}%")
                            ->orWhere('prenom_fr', 'like', "%{$search}%")
                            ->orWhere('nom_ar', 'like', "%{$search}%")
                            ->orWhere('prenom_ar', 'like', "%{$search}%")
                            ->orWhere('matricule', 'like', "%{$search}%");
                    });
                });
            }

            // Access: parents/eleves only their own payments
            $user = $request->user();
            if ($user?->hasRole('eleve')) {
                $query->where('eleve_id', $user->eleve?->id ?? 0);
            } elseif ($user?->hasRole('parent')) {
                $eleveIds = $user->parentEleve?->eleves()->pluck('id') ?? collect([]);
                $query->whereIn('eleve_id', $eleveIds);
            }

            $perPage = (int) $request->input('per_page', 15);
            $items = $query->orderBy('mois', 'desc')->paginate($perPage);

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
                'message' => 'Erreur lors du chargement des paiements: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un paiement spécifique
     */
    public function show($id): JsonResponse
    {
        try {
            // Récupérer directement le paiement depuis la base de données sans scope
            $paiementEleve = PaiementEleve::withoutGlobalScopes()->where('id', $id)->first();
            
            if (!$paiementEleve) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paiement non trouvé'
                ], 404);
            }
            
            // Vérifier que le modèle a bien les attributs
            if (!$paiementEleve->exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paiement non trouvé'
                ], 404);
            }

            $historiqueTableExists = Schema::hasTable('historique_paiements');
            $orderColumn = null;
            $hasCreatedAt = false;

            if ($historiqueTableExists) {
                if (Schema::hasColumn('historique_paiements', 'date_paiement')) {
                    $orderColumn = 'date_paiement';
                }

                if (Schema::hasColumn('historique_paiements', 'created_at')) {
                    $hasCreatedAt = true;
                    if (!$orderColumn) {
                        $orderColumn = 'created_at';
                    }
                }
            }

            $relations = [
                'eleve.classe.niveau',
                'fraisScolaire.niveau',
                'anneeScolaire',
            ];

            if ($historiqueTableExists) {
                $relations['historiquePaiements'] = function($historiqueQuery) use ($orderColumn, $hasCreatedAt) {
                    $historiqueQuery->with('utilisateur');

                    if ($orderColumn) {
                        $historiqueQuery->orderBy($orderColumn, 'desc');

                        if ($orderColumn !== 'created_at' && $hasCreatedAt) {
                            $historiqueQuery->orderBy('created_at', 'desc');
                        }
                    }
                };
            }
            
            // Charger les relations
            $paiementEleve->load($relations);

            // Récupérer les attributs bruts pour éviter les problèmes de casting
            $attributes = $paiementEleve->getAttributes();
            
            // Construire manuellement les données pour éviter les problèmes de sérialisation
            $data = [
                'id' => $attributes['id'] ?? $paiementEleve->id,
                'eleve_id' => $attributes['eleve_id'] ?? $paiementEleve->eleve_id,
                'frais_scolaire_id' => $attributes['frais_scolaire_id'] ?? $paiementEleve->frais_scolaire_id,
                'mois' => $attributes['mois'] ?? $paiementEleve->mois,
                'montant_du' => $attributes['montant_du'] ?? $paiementEleve->montant_du,
                'montant_paye' => $attributes['montant_paye'] ?? $paiementEleve->montant_paye,
                'montant_restant' => $attributes['montant_restant'] ?? $paiementEleve->montant_restant,
                'statut' => $attributes['statut'] ?? $paiementEleve->statut,
                'date_echeance' => $paiementEleve->date_echeance?->format('Y-m-d') ?? ($attributes['date_echeance'] ?? null),
                'annee_scolaire_id' => $attributes['annee_scolaire_id'] ?? $paiementEleve->annee_scolaire_id,
                'active' => $attributes['active'] ?? $paiementEleve->active,
                'statut_label' => $paiementEleve->statut_label,
            ];

            // Ajouter les relations si elles sont chargées
            if ($paiementEleve->relationLoaded('eleve')) {
                $data['eleve'] = $paiementEleve->eleve?->toArray();
            }
            if ($paiementEleve->relationLoaded('fraisScolaire')) {
                $data['frais_scolaire'] = $paiementEleve->fraisScolaire?->toArray();
            }
            if ($paiementEleve->relationLoaded('anneeScolaire')) {
                $data['annee_scolaire'] = $paiementEleve->anneeScolaire?->toArray();
            }
            if ($paiementEleve->relationLoaded('historiquePaiements')) {
                $data['historique_paiements'] = $paiementEleve->historiquePaiements->map(function($item) {
                    return $item->toArray();
                })->toArray();
            }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors du chargement du paiement élève', [
                'paiement_id' => $paiementEleve->id ?? null,
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Enregistrer un paiement
     */
    public function enregistrerPaiement(Request $request, PaiementEleve $paiementEleve): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'montant' => 'required|numeric|min:0.01',
                'mode_paiement' => 'required|string|in:especes,virement,cheque',
                'reference' => 'nullable|string|max:255',
                'notes' => 'nullable|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $montant = $request->input('montant');
            $montantRestant = $paiementEleve->montant_restant;

            if ($montant > $montantRestant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le montant ne peut pas dépasser le montant restant à payer'
                ], 422);
            }

            DB::beginTransaction();

            $paiementEleve->ajouterPaiement(
                $montant,
                $request->input('mode_paiement'),
                $request->input('notes'),
                $request->user()?->id
            );

            if ($request->filled('reference') && Schema::hasTable('historique_paiements')) {
                $dernierHistorique = $paiementEleve->historiquePaiements()
                    ->latest()
                    ->first();

                if ($dernierHistorique) {
                    $dernierHistorique->update(['reference' => $request->input('reference')]);
                }
            }

            DB::commit();

            $historiqueTableExists = Schema::hasTable('historique_paiements');
            $orderColumn = null;
            $hasCreatedAt = false;

            if ($historiqueTableExists) {
                if (Schema::hasColumn('historique_paiements', 'date_paiement')) {
                    $orderColumn = 'date_paiement';
                }

                if (Schema::hasColumn('historique_paiements', 'created_at')) {
                    $hasCreatedAt = true;
                    if (!$orderColumn) {
                        $orderColumn = 'created_at';
                    }
                }
            }

            $relations = [
                'eleve.classe.niveau',
                'fraisScolaire.niveau',
            ];

            if ($historiqueTableExists) {
                $relations['historiquePaiements'] = function($historiqueQuery) use ($orderColumn, $hasCreatedAt) {
                    $historiqueQuery->with('utilisateur');

                    if ($orderColumn) {
                        $historiqueQuery->orderBy($orderColumn, 'desc');

                        if ($orderColumn !== 'created_at' && $hasCreatedAt) {
                            $historiqueQuery->orderBy('created_at', 'desc');
                        }
                    }
                };
            }

            $paiementEleve->load($relations);

            return response()->json([
                'success' => true,
                'data' => $paiementEleve,
                'message' => 'Paiement enregistré avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Erreur lors de l\'enregistrement d\'un paiement élève', [
                'paiement_id' => $paiementEleve->id ?? null,
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les paiements d'un élève
     */
    public function paiementsEleve(Eleve $eleve, Request $request): JsonResponse
    {
        try {
            $historiqueTableExists = Schema::hasTable('historique_paiements');
            $orderColumn = null;
            $hasCreatedAt = false;

            if ($historiqueTableExists) {
                if (Schema::hasColumn('historique_paiements', 'date_paiement')) {
                    $orderColumn = 'date_paiement';
                }

                if (Schema::hasColumn('historique_paiements', 'created_at')) {
                    $hasCreatedAt = true;
                    if (!$orderColumn) {
                        $orderColumn = 'created_at';
                    }
                }
            }

            $relations = [
                'fraisScolaire.niveau',
            ];

            if ($historiqueTableExists) {
                $relations['historiquePaiements'] = function($historiqueQuery) use ($orderColumn, $hasCreatedAt) {
                    if ($orderColumn) {
                        $historiqueQuery->orderBy($orderColumn, 'desc');

                        if ($orderColumn !== 'created_at' && $hasCreatedAt) {
                            $historiqueQuery->orderBy('created_at', 'desc');
                        }
                    }
                };
            }

            $query = PaiementEleve::where('eleve_id', $eleve->id)
                ->with($relations)
                ->active();

            if ($request->filled('mois')) {
                $query->where('mois', $request->input('mois'));
            }

            if ($request->filled('type_frais')) {
                $query->whereHas('fraisScolaire', function($q) use ($request) {
                    $q->where('type', $request->input('type_frais'));
                });
            }

            $paiements = $query->orderBy('mois', 'desc')->get();

            // Calculer les totaux
            $paiementsEnRetardCount = $paiements->filter(function ($p) {
                $isLateStatus = $p->statut === 'en_retard';
                $isPendingButPastDue = $p->statut === 'en_attente' && $p->date_echeance && $p->date_echeance < now();
                return $isLateStatus || $isPendingButPastDue;
            })->count();

            $totaux = [
                'total_du' => $paiements->sum('montant_du'),
                'total_paye' => $paiements->sum('montant_paye'),
                'total_restant' => $paiements->sum('montant_restant'),
                'paiements_regles' => $paiements->where('statut', 'regle')->count(),
                'paiements_en_retard' => $paiementsEnRetardCount,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'eleve' => $eleve->load('classe.niveau'),
                    'paiements' => $paiements,
                    'totaux' => $totaux
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors du chargement des paiements de l\'élève', [
                'eleve_id' => $eleve->id ?? null,
                'mois' => $request->input('mois'),
                'exception' => $e,
            ]);

            $eleveData = $eleve->loadMissing('classe.niveau');

            return response()->json([
                'success' => true,
                'data' => [
                    'eleve' => $eleveData,
                    'paiements' => [],
                    'totaux' => [
                        'total_du' => 0,
                        'total_paye' => 0,
                        'total_restant' => 0,
                        'paiements_regles' => 0,
                        'paiements_en_retard' => 0,
                    ],
                ],
                'warning' => 'Impossible de charger le contexte mensuel: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Obtenir les statistiques des paiements
     */
    public function statistiques(Request $request): JsonResponse
    {
        try {
            $anneeScolaireId = $request->input('annee_scolaire_id') ?? $this->getActiveAnneeScolaireId();
            $mois = $request->input('mois', now()->format('Y-m'));

            $stats = [
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
                'par_statut' => [
                    'en_attente' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                        ->where('mois', $mois)
                        ->where('statut', 'en_attente')
                        ->count(),
                    'partiel' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                        ->where('mois', $mois)
                        ->where('statut', 'partiel')
                        ->count(),
                    'regle' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                        ->where('mois', $mois)
                        ->where('statut', 'regle')
                        ->count(),
                    'en_retard' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                        ->where('mois', $mois)
                        ->enRetard()
                        ->count()
                ],
                'par_type' => [
                    'scolarite' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                        ->where('mois', $mois)
                        ->whereHas('fraisScolaire', function($q) {
                            $q->where('type', 'scolarite');
                        })
                        ->sum('montant_du'),
                    'cantine' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                        ->where('mois', $mois)
                        ->whereHas('fraisScolaire', function($q) {
                            $q->where('type', 'cantine');
                        })
                        ->sum('montant_du'),
                    'transport' => PaiementEleve::where('annee_scolaire_id', $anneeScolaireId)
                        ->where('mois', $mois)
                        ->whereHas('fraisScolaire', function($q) {
                            $q->where('type', 'transport');
                        })
                        ->sum('montant_du')
                ]
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