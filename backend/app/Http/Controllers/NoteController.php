<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\Eleve;
use App\Models\Professeur;
use App\Models\Periode;
use App\Models\AnneeScolaire;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class NoteController extends Controller
{
    /**
     * Afficher la liste des notes
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $currentUser = $request->user();
            Log::info('NoteController index called with params:', $request->all());
            $query = Note::with([
                'eleve' => function ($q) { $q->withoutGlobalScopes(); },
                'eleve.classe' => function ($q) { $q->withoutGlobalScopes(); },
                'eleve.classe.niveau' => function ($q) { $q->withoutGlobalScopes(); },
                'professeur' => function ($q) { $q->withoutGlobalScopes(); },
                'matiere' => function ($q) { $q->withoutGlobalScopes(); },
                'controle' => function ($q) { $q->withoutGlobalScopes(); },
                'periode' => function ($q) { $q->withoutGlobalScopes(); },
                'anneeScolaire' => function ($q) { $q->withoutGlobalScopes(); }
            ])->active();
            
            // Exclure les élèves non affectés (sans classe)
            $query->whereHas('eleve', function ($q) {
                $q->whereNotNull('classe_id');
            });

            // Si c'est un professeur, filtrer par ses classes uniquement
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = $currentUser->getProfesseur();
                
                if ($professeur) {
                    // Récupérer les IDs des classes du professeur
                    $classeIds = $professeur->classes()->pluck('classes.id')->toArray();
                    
                    // Si le professeur n'a pas de classes, retourner une liste vide
                    if (empty($classeIds)) {
                        return response()->json([
                            'success' => true,
                            'data' => [],
                            'pagination' => [
                                'current_page' => 1,
                                'last_page' => 1,
                                'per_page' => 15,
                                'total' => 0,
                            ]
                        ]);
                    }
                    
                    // Filtrer les notes pour les élèves de ses classes uniquement
                    $query->whereHas('eleve.classe', function ($q) use ($classeIds) {
                        $q->whereIn('classes.id', $classeIds);
                    });
                    
                    // Aussi filtrer par professeur_id pour s'assurer qu'il voit seulement ses notes
                    $query->where('professeur_id', $professeur->id);
                } else {
                    // Si pas de professeur trouvé, retourner liste vide
                    return response()->json([
                        'success' => true,
                        'data' => [],
                        'pagination' => [
                            'current_page' => 1,
                            'last_page' => 1,
                            'per_page' => 15,
                            'total' => 0,
                        ]
                    ]);
                }
            }

            // Filtres
            if ($request->has('niveau_id') && $request->niveau_id) {
                $query->whereHas('eleve.classe', function ($q) use ($request) {
                    $q->where('niveau_id', $request->niveau_id);
                });
            }

            if ($request->has('classe_id') && $request->classe_id) {
                $query->whereHas('eleve.classe', function ($q) use ($request) {
                    $q->where('id', $request->classe_id);
                });
            }

            if ($request->has('professeur_id') && $request->professeur_id) {
                $query->where('professeur_id', $request->professeur_id);
            }


            if ($request->has('eleve_id') && $request->eleve_id) {
                $query->where('eleve_id', $request->eleve_id);
            }

            if ($request->has('periode_id') && $request->periode_id) {
                $query->where('periode_id', $request->periode_id);
            }

            if ($request->has('annee_scolaire_id') && $request->annee_scolaire_id) {
                $query->where('annee_scolaire_id', $request->annee_scolaire_id);
            }

            if ($request->has('type_controle') && $request->type_controle) {
                $query->where('type_controle', $request->type_controle);
            }

            if ($request->has('controle_id') && $request->controle_id) {
                $query->where('controle_id', $request->controle_id);
            }

            // Filtres supplémentaires peuvent être ajoutés ici si nécessaire

            // Tri par défaut
            $query->orderBy('created_at', 'desc');

            // Pagination
            $perPage = $request->get('per_page', 15);
            $notes = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $notes->items(),
                'pagination' => [
                    'current_page' => $notes->currentPage(),
                    'last_page' => $notes->lastPage(),
                    'per_page' => $notes->perPage(),
                    'total' => $notes->total(),
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des notes: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher une note spécifique
     */
    public function show(Note $note): JsonResponse
    {
        try {
            $note->load([
                'eleve.classe.niveau',
                'professeur',
                'controle',
                'periode',
                'anneeScolaire'
            ]);

            return response()->json([
                'success' => true,
                'data' => $note
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de la note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer une nouvelle note
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $currentUser = $request->user();
            $professeur = null;
            
            // Si c'est un professeur, récupérer son ID et vérifier ses classes
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = $currentUser->getProfesseur();
                
                if (!$professeur) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Professeur non trouvé'
                    ], 404);
                }
            }
            
            $validator = Validator::make($request->all(), [
                'eleve_id' => 'required|exists:eleves,id',
                'controle_id' => 'nullable|exists:controles,id',
                'matiere_id' => 'nullable|exists:matieres,id',
                'professeur_id' => 'nullable|exists:professeurs,id',
                'note' => [
                    'required',
                    'numeric',
                    'min:0',
                    function ($attribute, $value, $fail) use ($request) {
                        // Récupérer le bareme du niveau de l'élève
                        if ($request->has('eleve_id')) {
                            $eleve = Eleve::with('classe.niveau')->find($request->eleve_id);
                            if ($eleve && $eleve->classe && $eleve->classe->niveau) {
                                $bareme = $eleve->classe->niveau->bareme ?? 20.00;
                                if ($value > $bareme) {
                                    $fail("La note ne peut pas dépasser le barème du niveau ({$bareme}).");
                                }
                            }
                        }
                    }
                ],
                'periode_id' => 'nullable|exists:periodes,id',
                'annee_scolaire_id' => 'nullable|exists:annees_scolaires,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Vérifier que l'élève est dans une classe du professeur
            if ($professeur) {
                $eleve = Eleve::findOrFail($request->eleve_id);
                $classeIds = $professeur->classes()->pluck('classes.id')->toArray();
                
                if (!in_array($eleve->classe_id, $classeIds)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous ne pouvez pas créer de note pour un élève qui n\'est pas dans vos classes'
                    ], 403);
                }
                
                // Forcer le professeur_id
                $request->merge(['professeur_id' => $professeur->id]);
            }

            $data = $request->all();
            // Le bareme est maintenant récupéré automatiquement depuis le niveau de l'élève
            // Supprimer bareme des données si présent (pour éviter les erreurs)
            unset($data['bareme']);
            $note = Note::create($data);
            $note->load(['eleve.classe.niveau', 'professeur', 'matiere', 'controle', 'periode', 'anneeScolaire']);

            return response()->json([
                'success' => true,
                'data' => $note,
                'message' => 'Note créée avec succès'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour une note
     */
    public function update(Request $request, Note $note): JsonResponse
    {
        try {
            $currentUser = $request->user();
            $professeur = null;
            
            // Si c'est un professeur, vérifier qu'il peut modifier cette note
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = $currentUser->getProfesseur();
                
                if (!$professeur) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Professeur non trouvé'
                    ], 404);
                }
                
                // Vérifier que la note appartient au professeur
                if ($note->professeur_id !== $professeur->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous ne pouvez pas modifier une note qui ne vous appartient pas'
                    ], 403);
                }
                
                // Vérifier que l'élève est dans une classe du professeur
                if ($request->has('eleve_id')) {
                    $eleve = Eleve::find($request->eleve_id);
                    if ($eleve) {
                        $classeIds = $professeur->classes()->pluck('classes.id')->toArray();
                        if (!in_array($eleve->classe_id, $classeIds)) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Vous ne pouvez pas créer de note pour un élève qui n\'est pas dans vos classes'
                            ], 403);
                        }
                    }
                } else {
                    // Vérifier l'élève actuel de la note
                    $eleve = $note->eleve;
                    if ($eleve) {
                        $classeIds = $professeur->classes()->pluck('classes.id')->toArray();
                        if (!in_array($eleve->classe_id, $classeIds)) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Vous ne pouvez pas modifier une note pour un élève qui n\'est pas dans vos classes'
                            ], 403);
                        }
                    }
                }
                
                // Forcer le professeur_id
                $request->merge(['professeur_id' => $professeur->id]);
            }
            
            $validator = Validator::make($request->all(), [
                'eleve_id' => 'sometimes|exists:eleves,id',
                'controle_id' => 'sometimes|exists:controles,id',
                'professeur_id' => 'sometimes|exists:professeurs,id',
                'note' => [
                    'sometimes',
                    'numeric',
                    'min:0',
                    function ($attribute, $value, $fail) use ($request, $note) {
                        // Récupérer le bareme du niveau de l'élève
                        $eleveId = $request->has('eleve_id') ? $request->eleve_id : $note->eleve_id;
                        if ($eleveId) {
                            $eleve = Eleve::with('classe.niveau')->find($eleveId);
                            if ($eleve && $eleve->classe && $eleve->classe->niveau) {
                                $bareme = $eleve->classe->niveau->bareme ?? 20.00;
                                if ($value > $bareme) {
                                    $fail("La note ne peut pas dépasser le barème du niveau ({$bareme}).");
                                }
                            }
                        }
                    }
                ],
                'type_controle' => 'sometimes|string|max:100',
                'periode_id' => 'sometimes|exists:periodes,id',
                'annee_scolaire_id' => 'sometimes|exists:annees_scolaires,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            // Le bareme est maintenant récupéré automatiquement depuis le niveau de l'élève
            // Supprimer bareme des données si présent (pour éviter les erreurs)
            unset($data['bareme']);
            $note->update($data);
            $note->load(['eleve.classe.niveau', 'professeur', 'matiere', 'controle', 'periode', 'anneeScolaire']);

            return response()->json([
                'success' => true,
                'data' => $note,
                'message' => 'Note mise à jour avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une note (soft delete)
     */
    public function destroy(Note $note): JsonResponse
    {
        try {
            $note->update(['active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Note supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la note: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des notes
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $query = Note::active();

            // Appliquer les mêmes filtres que l'index
            if ($request->has('niveau_id') && $request->niveau_id) {
                $query->whereHas('eleve.classe', function ($q) use ($request) {
                    $q->where('niveau_id', $request->niveau_id);
                });
            }

            if ($request->has('classe_id') && $request->classe_id) {
                $query->whereHas('eleve.classe', function ($q) use ($request) {
                    $q->where('id', $request->classe_id);
                });
            }

            $notes = $query->get();

            $statistics = [
                'total' => $notes->count(),
                'moyenne' => $notes->avg('note'),
                'excellentes' => $notes->where('note', '>=', 16)->count(),
                'bonnes' => $notes->where('note', '>=', 12)->where('note', '<', 16)->count(),
                'passables' => $notes->where('note', '>=', 10)->where('note', '<', 12)->count(),
                'insuffisantes' => $notes->where('note', '<', 10)->count(),
                'meilleure_note' => $notes->max('note'),
                'pire_note' => $notes->min('note')
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }
}
