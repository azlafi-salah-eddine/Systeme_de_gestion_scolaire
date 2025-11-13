<?php

namespace App\Http\Controllers;

use App\Models\Absence;
use App\Models\Eleve;
use App\Models\Professeur;
use App\Models\Matiere;
use App\Services\AbsenceFileService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AbsenceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $currentUser = $request->user();
            $query = Absence::with([
                'eleve' => function ($q) {
                    $q->withoutGlobalScopes();
                },
                'eleve.classe' => function ($q) {
                    $q->withoutGlobalScopes();
                },
                'professeur' => function ($q) {
                    $q->withoutGlobalScopes();
                },
                'matiere' => function ($q) {
                    $q->withoutGlobalScopes();
                }
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
                    
                    // Filtrer les absences pour les élèves de ses classes uniquement
                    $query->whereHas('eleve.classe', function ($q) use ($classeIds) {
                        $q->whereIn('classes.id', $classeIds);
                    });
                } else {
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
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('motif', 'like', "%{$search}%")
                      ->orWhereHas('eleve', function ($q) use ($search) {
                          $q->where('nom', 'like', "%{$search}%")
                            ->orWhere('prenom', 'like', "%{$search}%");
                      })
                      ->orWhereHas('professeur', function ($q) use ($search) {
                          $q->where('nom', 'like', "%{$search}%")
                            ->orWhere('prenom', 'like', "%{$search}%");
                      })
                      ->orWhereHas('matiere', function ($q) use ($search) {
                          $q->where('nom', 'like', "%{$search}%");
                      });
                });
            }

            if ($request->has('justifie') && $request->justifie !== '') {
                $query->where('justifie', $request->boolean('justifie'));
            }

            if ($request->has('dateFrom') && $request->dateFrom) {
                $query->where('date', '>=', $request->dateFrom);
            }

            if ($request->has('dateTo') && $request->dateTo) {
                $query->where('date', '<=', $request->dateTo);
            }

            if ($request->has('eleve_id') && $request->eleve_id) {
                $query->where('eleve_id', $request->eleve_id);
            }

            // Filtre par date exacte
            if ($request->has('date') && $request->date) {
                $query->whereDate('date', $request->date);
            }

            // Filtre par niveau (via la classe de l'élève)
            if ($request->has('niveau') && $request->niveau) {
                $query->whereHas('eleve.classe.niveau', function ($q) use ($request) {
                    $q->where('nom', $request->niveau);
                });
            }

            // Filtre par classe (via l'élève)
            if ($request->has('classe') && $request->classe) {
                $query->whereHas('eleve.classe', function ($q) use ($request) {
                    $q->where('nom', $request->classe);
                });
            }

            // Filtre par année scolaire (via l'élève)
            if ($request->has('annee_scolaire_id') && $request->annee_scolaire_id) {
                $query->whereHas('eleve.classe', function ($q) use ($request) {
                    $q->where('annee_scolaire_id', $request->annee_scolaire_id);
                });
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $absences = $query->orderBy('date', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $absences->items(),
                'meta' => [
                    'current_page' => $absences->currentPage(),
                    'last_page' => $absences->lastPage(),
                    'per_page' => $absences->perPage(),
                    'total' => $absences->total(),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des absences: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
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
                
                // Vérifier que l'élève est dans une classe du professeur
                if ($request->has('eleve_id')) {
                    $eleve = \App\Models\Eleve::find($request->eleve_id);
                    if ($eleve) {
                        $classeIds = $professeur->classes()->pluck('classes.id')->toArray();
                        if (!in_array($eleve->classe_id, $classeIds)) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Vous ne pouvez pas créer une absence pour un élève qui n\'est pas dans vos classes'
                            ], 403);
                        }
                    }
                }
                
                // Forcer le professeur_id
                $request->merge(['professeur_id' => $professeur->id]);
            }
            
            $validator = Validator::make($request->all(), [
                'eleve_id' => 'required|exists:eleves,id',
                'date' => 'required|date',
                'motif' => 'required|string|max:255',
                'justifie' => 'boolean',
                'professeur_id' => 'nullable|exists:professeurs,id',
                'heure_debut' => 'nullable|date_format:H:i',
                'heure_fin' => 'nullable|date_format:H:i|after:heure_debut',
                'justification' => 'nullable|string',
                'piece_jointe' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'matiere_id' => 'nullable|exists:matieres,id',
                'annee_scolaire_id' => 'nullable|exists:annees_scolaires,id',
                'active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();
            $data['active'] = $data['active'] ?? true;

            // Si annee_scolaire_id n'est pas fourni, utiliser l'année scolaire active
            if (!isset($data['annee_scolaire_id']) || empty($data['annee_scolaire_id'])) {
                $activeAnneeScolaire = \App\Models\AnneeScolaire::where('active', true)->first();
                if ($activeAnneeScolaire) {
                    $data['annee_scolaire_id'] = $activeAnneeScolaire->id;
                }
            }

            // Gestion de la pièce jointe
            if ($request->hasFile('piece_jointe')) {
                // Récupérer l'élève pour le service de fichier
                $eleve = \App\Models\Eleve::findOrFail($data['eleve_id']);
                $path = AbsenceFileService::saveAbsenceFile($eleve, $request->file('piece_jointe'));
                $data['piece_jointe'] = $path;
            }

            $absence = Absence::create($data);

            return response()->json([
                'success' => true,
                'data' => $absence->load(['eleve.classe', 'professeur', 'matiere']),
                'message' => 'Absence créée avec succès'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'absence: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Absence $absence): JsonResponse
    {
        try {
            $currentUser = request()->user();
            
            // Si c'est un professeur, vérifier qu'il peut voir cette absence
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = $currentUser->getProfesseur();
                
                if ($professeur) {
                    // Vérifier que l'élève de l'absence est dans une classe du professeur
                    $eleve = $absence->eleve;
                    if ($eleve) {
                        $classeIds = $professeur->classes()->pluck('classes.id')->toArray();
                        if (!in_array($eleve->classe_id, $classeIds)) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Vous ne pouvez pas voir une absence pour un élève qui n\'est pas dans vos classes'
                            ], 403);
                        }
                    }
                }
            }
            
            $absence->load(['eleve.classe', 'professeur', 'matiere']);
            
            return response()->json([
                'success' => true,
                'data' => $absence
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de l\'absence: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Absence $absence): JsonResponse
    {
        try {
            $currentUser = $request->user();
            $professeur = null;
            
            // Si c'est un professeur, vérifier qu'il peut modifier cette absence
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = $currentUser->getProfesseur();
                
                if (!$professeur) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Professeur non trouvé'
                    ], 404);
                }
                
                // Vérifier que l'élève de l'absence est dans une classe du professeur
                $eleve = $absence->eleve;
                if ($eleve) {
                    $classeIds = $professeur->classes()->pluck('classes.id')->toArray();
                    if (!in_array($eleve->classe_id, $classeIds)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Vous ne pouvez pas modifier une absence pour un élève qui n\'est pas dans vos classes'
                        ], 403);
                    }
                }
                
                // Si l'élève change, vérifier le nouvel élève
                if ($request->has('eleve_id')) {
                    $nouveauEleve = \App\Models\Eleve::find($request->eleve_id);
                    if ($nouveauEleve) {
                        $classeIds = $professeur->classes()->pluck('classes.id')->toArray();
                        if (!in_array($nouveauEleve->classe_id, $classeIds)) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Vous ne pouvez pas modifier une absence pour un élève qui n\'est pas dans vos classes'
                            ], 403);
                        }
                    }
                }
                
                // Forcer le professeur_id
                $request->merge(['professeur_id' => $professeur->id]);
            }
            
            $validator = Validator::make($request->all(), [
                'eleve_id' => 'sometimes|required|exists:eleves,id',
                'date' => 'sometimes|required|date',
                'motif' => 'sometimes|required|string|max:255',
                'justifie' => 'boolean',
                'professeur_id' => 'nullable|exists:professeurs,id',
                'heure_debut' => 'nullable|date_format:H:i',
                'heure_fin' => 'nullable|date_format:H:i|after:heure_debut',
                'justification' => 'nullable|string',
                'piece_jointe' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'matiere_id' => 'nullable|exists:matieres,id',
                'annee_scolaire_id' => 'nullable|exists:annees_scolaires,id',
                'active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->all();

            // Si annee_scolaire_id n'est pas fourni, utiliser l'année scolaire active
            if (!isset($data['annee_scolaire_id']) || empty($data['annee_scolaire_id'])) {
                $activeAnneeScolaire = \App\Models\AnneeScolaire::where('active', true)->first();
                if ($activeAnneeScolaire) {
                    $data['annee_scolaire_id'] = $activeAnneeScolaire->id;
                }
            }

            // Gestion de la pièce jointe
            if ($request->hasFile('piece_jointe')) {
                // Supprimer l'ancienne pièce jointe
                if ($absence->piece_jointe) {
                    AbsenceFileService::deleteAbsenceFile($absence->piece_jointe);
                }

                // Utiliser le service pour sauvegarder le fichier
                $path = AbsenceFileService::saveAbsenceFile($absence->eleve, $request->file('piece_jointe'));
                $data['piece_jointe'] = $path;
            }

            $absence->update($data);

            return response()->json([
                'success' => true,
                'data' => $absence->load(['eleve.classe', 'professeur', 'matiere']),
                'message' => 'Absence modifiée avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification de l\'absence: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Absence $absence): JsonResponse
    {
        try {
            $currentUser = request()->user();
            
            // Si c'est un professeur, vérifier qu'il peut supprimer cette absence
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = $currentUser->getProfesseur();
                
                if (!$professeur) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Professeur non trouvé'
                    ], 404);
                }
                
                // Vérifier que l'élève de l'absence est dans une classe du professeur
                $eleve = $absence->eleve;
                if ($eleve) {
                    $classeIds = $professeur->classes()->pluck('classes.id')->toArray();
                    if (!in_array($eleve->classe_id, $classeIds)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Vous ne pouvez pas supprimer une absence pour un élève qui n\'est pas dans vos classes'
                        ], 403);
                    }
                }
            }
            
            // Soft delete : désactiver l'absence au lieu de la supprimer définitivement
            $absence->update(['active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Absence supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'absence: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Justifier une absence
     */
    public function justify(Request $request, Absence $absence): JsonResponse
    {
        try {
            Log::info('Début justification absence ID: ' . $absence->id);
            Log::info('Données reçues: ' . json_encode($request->all()));
            
            $validator = Validator::make($request->all(), [
                'justification' => 'required|string',
                'piece_jointe' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
                'justify_consecutive' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                Log::error('Validation échouée: ' . json_encode($validator->errors()));
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $justifyConsecutive = $request->has('justify_consecutive') ? $request->boolean('justify_consecutive') : false;
            
            if ($justifyConsecutive) {
                return $this->justifyConsecutiveAbsences($request, $absence);
            }

            $data = [
                'justifie' => true,
                'justification' => $request->justification,
            ];

            // Gestion de la pièce jointe
            if ($request->hasFile('piece_jointe')) {
                // Supprimer l'ancienne pièce jointe
                if ($absence->piece_jointe) {
                    AbsenceFileService::deleteAbsenceFile($absence->piece_jointe);
                }

                // Utiliser le service pour sauvegarder le fichier
                $path = AbsenceFileService::saveAbsenceFile($absence->eleve, $request->file('piece_jointe'));
                $data['piece_jointe'] = $path;
            }

            $absence->update($data);

            return response()->json([
                'success' => true,
                'data' => $absence->load(['eleve.classe', 'professeur', 'matiere']),
                'message' => 'Absence justifiée avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la justification de l\'absence: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les absences consécutives pour un élève
     */
    public function getConsecutiveAbsences(Absence $absence): JsonResponse
    {
        try {
            $consecutiveAbsences = $this->findConsecutiveAbsences($absence);
            
            return response()->json([
                'success' => true,
                'data' => $consecutiveAbsences,
                'message' => 'Absences consécutives récupérées avec succès'
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getConsecutiveAbsences: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des absences consécutives: ' . $e->getMessage(),
                'debug' => [
                    'absence_id' => $absence->id,
                    'eleve_id' => $absence->eleve_id,
                    'date' => $absence->date
                ]
            ], 500);
        }
    }

    /**
     * Justifier les absences consécutives
     */
    private function justifyConsecutiveAbsences(Request $request, Absence $absence): JsonResponse
    {
        try {
            Log::info('Début justification consécutive pour absence ID: ' . $absence->id);
            
            // Utiliser la nouvelle méthode de détection des absences consécutives
            $consecutiveGroups = $this->detectConsecutiveAbsences($absence->eleve_id);
            Log::info('Groupes détectés: ' . count($consecutiveGroups));
            
            // Trouver le groupe qui contient l'absence actuelle
            $currentGroup = null;
            foreach ($consecutiveGroups as $group) {
                foreach ($group['group'] as $groupAbsence) {
                    if ($groupAbsence->id === $absence->id) {
                        $currentGroup = $group;
                        break 2;
                    }
                }
            }
            
            Log::info('Groupe trouvé: ' . ($currentGroup ? 'Oui' : 'Non'));
            
            if (!$currentGroup) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune absence consécutive trouvée'
                ], 404);
            }

            $data = [
                'justifie' => true,
                'justification' => $request->justification,
            ];

            // Gestion de la pièce jointe
            if ($request->hasFile('piece_jointe')) {
                // Utiliser le service pour sauvegarder le fichier
                $path = AbsenceFileService::saveAbsenceFile($absence->eleve, $request->file('piece_jointe'));
                $data['piece_jointe'] = $path;
            }

            // Justifier toutes les absences consécutives
            $updatedAbsences = [];
            foreach ($currentGroup['group'] as $consecutiveAbsence) {
                // Récupérer l'absence depuis la base de données
                $absenceModel = Absence::find($consecutiveAbsence->id);
                if (!$absenceModel) {
                    continue;
                }
                
                // Supprimer l'ancienne pièce jointe si elle existe
                if ($absenceModel->piece_jointe) {
                    Storage::disk('public')->delete($absenceModel->piece_jointe);
                }
                
                $absenceModel->update($data);
                $updatedAbsences[] = $absenceModel->load(['eleve.classe', 'professeur', 'matiere']);
            }

            return response()->json([
                'success' => true,
                'data' => $updatedAbsences,
                'message' => count($updatedAbsences) . ' absences consécutives justifiées avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la justification des absences consécutives: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Trouver les absences consécutives pour un élève
     */
    private function findConsecutiveAbsences(Absence $absence): array
    {
        $eleveId = $absence->eleve_id;
        
        // Trouver toutes les absences non justifiées pour cet élève
        $allAbsences = Absence::where('eleve_id', $eleveId)
            ->where('justifie', false)
            ->where('active', true)
            ->orderBy('date', 'asc')
            ->orderBy('heure_debut', 'asc')
            ->get();

        if ($allAbsences->isEmpty()) {
            return [];
        }

        // Convertir toutes les dates en format string pour comparaison
        $allAbsences = $allAbsences->map(function($absence) {
            $absence->date_string = $absence->date instanceof \Carbon\Carbon 
                ? $absence->date->format('Y-m-d') 
                : $absence->date;
            return $absence;
        });

        // Grouper les absences par date
        $absencesByDate = [];
        foreach ($allAbsences as $currentAbsence) {
            $dateString = $currentAbsence->date_string;
            if (!isset($absencesByDate[$dateString])) {
                $absencesByDate[$dateString] = [];
            }
            $absencesByDate[$dateString][] = $currentAbsence;
        }
        
        // Trier les dates
        $sortedDates = array_keys($absencesByDate);
        sort($sortedDates);
        
        // Trouver le groupe qui contient l'absence cible
        $targetDateString = $absence->date instanceof \Carbon\Carbon 
            ? $absence->date->format('Y-m-d') 
            : $absence->date;
        $targetDateIndex = array_search($targetDateString, $sortedDates);
        
        if ($targetDateIndex === false) {
            return [];
        }
        
        // Construire le groupe consécutif en partant de la date cible
        $consecutiveGroup = [];
        
        // Ajouter toutes les absences du même jour
        if (isset($absencesByDate[$targetDateString])) {
            $consecutiveGroup = array_merge($consecutiveGroup, $absencesByDate[$targetDateString]);
        }
        
        // Chercher les jours précédents consécutifs
        for ($i = $targetDateIndex - 1; $i >= 0; $i--) {
            if (!isset($sortedDates[$i])) {
                break;
            }
            
            $currentDate = \Carbon\Carbon::parse($sortedDates[$i]);
            $nextDate = \Carbon\Carbon::parse($sortedDates[$i + 1]);
            
            // Vérifier si c'est le jour précédent (différence de 1 jour)
            if ($nextDate->diffInDays($currentDate) === 1) {
                // Jour consécutif, ajouter les absences
                if (isset($absencesByDate[$sortedDates[$i]])) {
                    $consecutiveGroup = array_merge($consecutiveGroup, $absencesByDate[$sortedDates[$i]]);
                }
            } else {
                // Gap trouvé, arrêter
                break;
            }
        }
        
        // Chercher les jours suivants consécutifs
        for ($i = $targetDateIndex + 1; $i < count($sortedDates); $i++) {
            if (!isset($sortedDates[$i])) {
                break;
            }
            
            $currentDate = \Carbon\Carbon::parse($sortedDates[$i]);
            $prevDate = \Carbon\Carbon::parse($sortedDates[$i - 1]);
            
            // Vérifier si c'est le jour suivant (différence de 1 jour)
            if ($currentDate->diffInDays($prevDate) === 1) {
                // Jour consécutif, ajouter les absences
                if (isset($absencesByDate[$sortedDates[$i]])) {
                    $consecutiveGroup = array_merge($consecutiveGroup, $absencesByDate[$sortedDates[$i]]);
                }
            } else {
                // Gap trouvé, arrêter
                break;
            }
        }
        
        // Trier le groupe final par date et heure
        usort($consecutiveGroup, function($a, $b) {
            $dateCompare = strcmp($a->date_string, $b->date_string);
            if ($dateCompare === 0) {
                return strcmp($a->heure_debut ?? '', $b->heure_debut ?? '');
            }
            return $dateCompare;
        });

        return $consecutiveGroup;
    }

    /**
     * Détecter automatiquement TOUS les jours consécutifs d'absences pour un élève
     * @param int $eleveId ID de l'élève
     * @return array Groupes d'absences consécutives
     */
    public function detectConsecutiveAbsences(int $eleveId): array
    {
        // Trouver toutes les absences non justifiées pour cet élève
        $allAbsences = Absence::where('eleve_id', $eleveId)
            ->where('justifie', false)
            ->where('active', true)
            ->orderBy('date', 'asc')
            ->orderBy('heure_debut', 'asc')
            ->get();

        if ($allAbsences->isEmpty()) {
            return [];
        }

        // Convertir toutes les dates en format Carbon
        $allAbsences = $allAbsences->map(function($absence) {
            $absence->date_carbon = $absence->date instanceof \Carbon\Carbon 
                ? $absence->date 
                : \Carbon\Carbon::parse($absence->date);
            return $absence;
        });

        // Grouper les absences par date
        $absencesByDate = [];
        foreach ($allAbsences as $absence) {
            $dateString = $absence->date_carbon->format('Y-m-d');
            if (!isset($absencesByDate[$dateString])) {
                $absencesByDate[$dateString] = [];
            }
            $absencesByDate[$dateString][] = $absence;
        }

        // Trier les dates
        $sortedDates = array_keys($absencesByDate);
        sort($sortedDates);

        $consecutiveGroups = [];
        $currentGroup = [];
        $lastDate = null;

        foreach ($sortedDates as $dateString) {
            $currentDate = \Carbon\Carbon::parse($dateString);
            
            // Si c'est le premier jour ou si c'est consécutif au jour précédent
            if ($lastDate === null || $currentDate->diffInDays($lastDate) === 1 || $currentDate->isNextDay($lastDate)) {
                // Ajouter les absences de ce jour au groupe actuel
                $currentGroup = array_merge($currentGroup, $absencesByDate[$dateString]);
            } else {
                // Gap trouvé, sauvegarder le groupe actuel s'il contient des absences
                if (count($currentGroup) > 0) {
                    $uniqueDays = count(array_unique(array_map(function($absence) {
                        return $absence->date_carbon->format('Y-m-d');
                    }, $currentGroup)));
                    
                    // Inclure TOUS les groupes, même ceux d'un seul jour
                    $consecutiveGroups[] = [
                        'group' => $currentGroup,
                        'days_count' => $uniqueDays,
                        'start_date' => $currentGroup[0]->date_carbon->format('Y-m-d'),
                        'end_date' => end($currentGroup)->date_carbon->format('Y-m-d')
                    ];
                }
                
                // Commencer un nouveau groupe
                $currentGroup = $absencesByDate[$dateString];
            }
            
            $lastDate = $currentDate;
        }

        // Vérifier le dernier groupe
        if (count($currentGroup) > 0) {
            $uniqueDays = count(array_unique(array_map(function($absence) {
                return $absence->date_carbon->format('Y-m-d');
            }, $currentGroup)));
            
            $consecutiveGroups[] = [
                'group' => $currentGroup,
                'days_count' => $uniqueDays,
                'start_date' => $currentGroup[0]->date_carbon->format('Y-m-d'),
                'end_date' => end($currentGroup)->date_carbon->format('Y-m-d')
            ];
        }

        return $consecutiveGroups;
    }

    /**
     * API endpoint pour détecter les absences consécutives
     */
    public function getConsecutiveAbsencesDetection(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'eleve_id' => 'required|integer|exists:eleves,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 400);
            }

            $eleveId = $request->eleve_id;
            $consecutiveGroups = $this->detectConsecutiveAbsences($eleveId);

            return response()->json([
                'success' => true,
                'data' => $consecutiveGroups,
                'message' => count($consecutiveGroups) . ' groupe(s) d\'absences consécutives détecté(s)'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la détection des absences consécutives: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier si un groupe d'absences contient une absence spécifique
     */
    private function containsAbsence(array $group, Absence $targetAbsence): bool
    {
        foreach ($group as $absence) {
            if ($absence->id === $targetAbsence->id) {
                return true;
            }
        }
        return false;
    }

    /**
     * Déjustifier une absence
     */
    public function unjustify(Absence $absence): JsonResponse
    {
        try {
            $absence->update([
                'justifie' => false,
                'justification' => null,
                'piece_jointe' => null,
            ]);

            return response()->json([
                'success' => true,
                'data' => $absence->load(['eleve.classe', 'professeur', 'matiere']),
                'message' => 'Absence déjustifiée avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la déjustification de l\'absence: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporter les absences
     */
    public function export(Request $request)
    {
        try {
            $query = Absence::with(['eleve.classe', 'professeur', 'matiere']);

            // Appliquer les mêmes filtres que dans index
            if ($request->has('justifie') && $request->justifie !== '') {
                $query->where('justifie', $request->boolean('justifie'));
            }

            if ($request->has('dateFrom') && $request->dateFrom) {
                $query->where('date', '>=', $request->dateFrom);
            }

            if ($request->has('dateTo') && $request->dateTo) {
                $query->where('date', '<=', $request->dateTo);
            }

            $absences = $query->orderBy('date', 'desc')->get();

            $format = $request->get('format', 'excel');

            if ($format === 'csv') {
                return $this->exportToCsv($absences);
            } else {
                return $this->exportToExcel($absences);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Statistiques des absences
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', 'month');
            $query = Absence::query();

            // Appliquer le filtre de période
            switch ($period) {
                case 'week':
                    $query->where('date', '>=', now()->subWeek());
                    break;
                case 'month':
                    $query->where('date', '>=', now()->subMonth());
                    break;
                case 'year':
                    $query->where('date', '>=', now()->subYear());
                    break;
            }

            $total = $query->count();
            $justifiees = $query->where('justifie', true)->count();
            $nonJustifiees = $total - $justifiees;

            // Statistiques par mois
            $parMois = Absence::selectRaw('DATE_FORMAT(date, "%Y-%m") as mois, COUNT(*) as count')
                ->where('date', '>=', now()->subYear())
                ->groupBy('mois')
                ->orderBy('mois')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'justifiees' => $justifiees,
                    'non_justifiees' => $nonJustifiees,
                    'par_mois' => $parMois
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporter en CSV
     */
    private function exportToCsv($absences)
    {
        $filename = 'absences_' . date('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($absences) {
            $file = fopen('php://output', 'w');
            
            // En-têtes
            fputcsv($file, [
                'ID',
                'Élève',
                'Classe',
                'Date',
                'Motif',
                'Heure début',
                'Heure fin',
                'Professeur',
                'Matière',
                'Justifiée',
                'Justification',
                'Créée le'
            ]);

            // Données
            foreach ($absences as $absence) {
                fputcsv($file, [
                    $absence->id,
                    $absence->eleve ? $absence->eleve->nom . ' ' . $absence->eleve->prenom : '',
                    $absence->eleve && $absence->eleve->classe ? $absence->eleve->classe->nom : '',
                    $absence->date,
                    $absence->motif,
                    $absence->heure_debut,
                    $absence->heure_fin,
                    $absence->professeur ? $absence->professeur->nom . ' ' . $absence->professeur->prenom : '',
                    $absence->matiere ? $absence->matiere->nom : '',
                    $absence->justifie ? 'Oui' : 'Non',
                    $absence->justification,
                    $absence->created_at->format('d/m/Y H:i')
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Exporter en Excel (simplifié - retourne CSV pour l'instant)
     */
    private function exportToExcel($absences)
    {
        // Pour l'instant, on retourne un CSV
        // Dans une vraie application, on utiliserait une librairie comme PhpSpreadsheet
        return $this->exportToCsv($absences);
    }
}