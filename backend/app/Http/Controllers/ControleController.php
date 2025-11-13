<?php

namespace App\Http\Controllers;

use App\Models\Controle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ControleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $currentUser = $request->user();
            $query = Controle::with(['matiere', 'matiere.niveau', 'professeur', 'periode']);
            
            // Si c'est un professeur, filtrer par ses contrôles uniquement
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = $currentUser->getProfesseur();
                
                if ($professeur) {
                    $query->where('professeur_id', $professeur->id);
                } else {
                    return response()->json([
                        'success' => true,
                        'data' => [],
                    ]);
                }
            }
            
            // Si c'est un élève, filtrer par les contrôles de sa classe
            if ($currentUser && $currentUser->hasRole('eleve')) {
                try {
                    $eleve = $currentUser->getEleve();
                    
                    if ($eleve && $eleve->classe_id) {
                        // Récupérer les matières de la classe de l'élève via les emplois du temps
                        // C'est plus fiable que via la table pivot
                        $matiereIds = DB::table('emplois_du_temps')
                            ->where('classe_id', $eleve->classe_id)
                            ->where('active', true)
                            ->distinct()
                            ->pluck('matiere_id')
                            ->toArray();
                        
                        // Si pas de matières via emplois du temps, essayer via classe_professeur_matiere
                        if (empty($matiereIds) && Schema::hasTable('classe_professeur_matiere')) {
                            $matiereIds = DB::table('classe_professeur_matiere')
                                ->where('classe_id', $eleve->classe_id)
                                ->distinct()
                                ->pluck('matiere_id')
                                ->toArray();
                        }
                        
                        // Si toujours pas de matières, essayer classe_matiere
                        if (empty($matiereIds) && Schema::hasTable('classe_matiere')) {
                            $matiereIds = DB::table('classe_matiere')
                                ->where('classe_id', $eleve->classe_id)
                                ->distinct()
                                ->pluck('matiere_id')
                                ->toArray();
                        }
                        
                        if (!empty($matiereIds)) {
                            // Filtrer uniquement par les matières de la classe
                            $query->whereIn('matiere_id', $matiereIds);
                        } else {
                            // Si la classe n'a pas de matières, retourner un tableau vide
                            return response()->json([
                                'success' => true,
                                'data' => [],
                            ]);
                        }
                    } else {
                        return response()->json([
                            'success' => true,
                            'data' => [],
                        ]);
                    }
                } catch (\Exception $e) {
                    // En cas d'erreur, logger et retourner un tableau vide
                    Log::error('Error filtering controles for eleve: ' . $e->getMessage());
                    Log::error('Stack trace: ' . $e->getTraceAsString());
                    return response()->json([
                        'success' => true,
                        'data' => [],
                    ]);
                }
            }
            
            // Filtres
            if ($request->filled('active')) {
                $query->where('active', filter_var($request->input('active'), FILTER_VALIDATE_BOOL));
            }
            
            if ($request->filled('matiere_id')) {
                $query->where('matiere_id', $request->input('matiere_id'));
            }
            
            if ($request->filled('professeur_id')) {
                $query->where('professeur_id', $request->input('professeur_id'));
            }
            
            if ($request->filled('annee_scolaire_id')) {
                $query->where('annee_scolaire_id', $request->input('annee_scolaire_id'));
            }
            
            if ($request->filled('periode_id')) {
                $query->where('periode_id', $request->input('periode_id'));
            }
            
            if ($request->filled('date_from')) {
                $query->where('debut_controle', '>=', $request->input('date_from'));
            }
            
            if ($request->filled('date_to')) {
                $query->where('fin_controle', '<=', $request->input('date_to'));
            }
            
            $controles = $query->orderBy('debut_controle', 'asc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $controles,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des contrôles: ' . $e->getMessage()
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
            
            // Si c'est un professeur, récupérer son ID et vérifier ses matières et classes
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = $currentUser->getProfesseur();
                
                if (!$professeur) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Professeur non trouvé'
                    ], 404);
                }
                
                // Vérifier que la matière appartient au professeur
                $matiereIds = $professeur->matieres()->pluck('matieres.id')->toArray();
                if (!in_array($request->matiere_id, $matiereIds)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous ne pouvez pas créer un contrôle pour une matière que vous n\'enseignez pas'
                    ], 403);
                }
                
                // Vérifier que le professeur enseigne cette matière dans au moins une classe
                // (via les emplois du temps)
                $classesIds = $professeur->classes()->pluck('classes.id')->toArray();
                $matiereClasses = \App\Models\EmploiDuTemps::where('professeur_id', $professeur->id)
                    ->where('matiere_id', $request->matiere_id)
                    ->whereIn('classe_id', $classesIds)
                    ->exists();
                
                if (!$matiereClasses) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous ne pouvez pas créer un contrôle pour une matière que vous n\'enseignez pas dans vos classes'
                    ], 403);
                }
                
                // Forcer le professeur_id
                $request->merge(['professeur_id' => $professeur->id]);
            }
            
            $validator = Validator::make($request->all(), [
                'libelle' => 'required|string|max:255',
                'debut_controle' => 'required|date',
                'fin_controle' => [
                    'required',
                    'date',
                    'after:debut_controle',
                    function ($attribute, $value, $fail) use ($request) {
                        $debut = \Carbon\Carbon::parse($request->debut_controle);
                        $fin = \Carbon\Carbon::parse($value);
                        $diffInHours = $debut->diffInHours($fin);
                        
                        if ($diffInHours > 5) {
                            $fail('La durée du contrôle ne peut pas dépasser 5 heures.');
                        }
                    }
                ],
                'matiere_id' => 'required|exists:matieres,id',
                'professeur_id' => 'required|exists:professeurs,id',
                'periode_id' => 'required|exists:periodes,id',
                'annee_scolaire_id' => 'required|exists:annees_scolaires,id',
                'instructions' => 'nullable|string',
                'active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $controle = Controle::create($request->all());
            
            $controle->load(['matiere', 'professeur']);

            return response()->json([
                'success' => true,
                'data' => $controle,
                'message' => 'Contrôle créé avec succès'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du contrôle: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Controle $controle): JsonResponse
    {
        try {
            $currentUser = request()->user();
            
            // Si c'est un professeur, vérifier qu'il peut voir ce contrôle
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = $currentUser->getProfesseur();
                
                if ($professeur && $controle->professeur_id !== $professeur->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous ne pouvez pas voir un contrôle qui ne vous appartient pas'
                    ], 403);
                }
            }
            
            $controle->load(['matiere', 'professeur']);
            
            return response()->json([
                'success' => true,
                'data' => $controle
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement du contrôle: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Controle $controle): JsonResponse
    {
        try {
            $currentUser = $request->user();
            
            // Si c'est un professeur, vérifier qu'il peut modifier ce contrôle
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = $currentUser->getProfesseur();
                
                if (!$professeur) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Professeur non trouvé'
                    ], 404);
                }
                
                // Vérifier que le contrôle appartient au professeur
                if ($controle->professeur_id !== $professeur->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous ne pouvez pas modifier un contrôle qui ne vous appartient pas'
                    ], 403);
                }
                
                // Si la matière change, vérifier qu'elle appartient au professeur
                if ($request->has('matiere_id')) {
                    $matiereIds = $professeur->matieres()->pluck('matieres.id')->toArray();
                    if (!in_array($request->matiere_id, $matiereIds)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Vous ne pouvez pas créer un contrôle pour une matière que vous n\'enseignez pas'
                        ], 403);
                    }
                }
                
                // Forcer le professeur_id
                $request->merge(['professeur_id' => $professeur->id]);
            }
            
            $validator = Validator::make($request->all(), [
                'libelle' => 'sometimes|string|max:255',
                'debut_controle' => 'sometimes|date',
                'fin_controle' => [
                    'sometimes',
                    'date',
                    function ($attribute, $value, $fail) use ($request, $controle) {
                        $debut = $request->has('debut_controle') 
                            ? \Carbon\Carbon::parse($request->debut_controle)
                            : \Carbon\Carbon::parse($controle->debut_controle);
                        $fin = \Carbon\Carbon::parse($value);
                        
                        if ($debut >= $fin) {
                            $fail('La date de fin doit être après la date de début.');
                        } else {
                            $diffInHours = $debut->diffInHours($fin);
                            if ($diffInHours > 5) {
                                $fail('La durée du contrôle ne peut pas dépasser 5 heures.');
                            }
                        }
                    }
                ],
                'matiere_id' => 'sometimes|exists:matieres,id',
                'professeur_id' => 'sometimes|exists:professeurs,id',
                'instructions' => 'nullable|string',
                'active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $controle->update($request->all());
            
            $controle->load(['matiere', 'professeur']);

            return response()->json([
                'success' => true,
                'data' => $controle,
                'message' => 'Contrôle mis à jour avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du contrôle: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les contrôles pour une classe avec leurs professeurs
     */
    public function getControlesForClasse(Request $request, $classeId): JsonResponse
    {
        try {
            $query = Controle::with(['matiere', 'professeur', 'periode'])
                ->where('active', true);

            // Filtres
            if ($request->filled('active')) {
                $query->where('active', filter_var($request->input('active'), FILTER_VALIDATE_BOOL));
            }
            
            if ($request->filled('matiere_id')) {
                $query->where('matiere_id', $request->input('matiere_id'));
            }
            
            if ($request->filled('professeur_id')) {
                $query->where('professeur_id', $request->input('professeur_id'));
            }
            
            if ($request->filled('date_from')) {
                $query->where('debut_controle', '>=', $request->input('date_from'));
            }
            
            if ($request->filled('date_to')) {
                $query->where('fin_controle', '<=', $request->input('date_to'));
            }
            
            $controles = $query->orderBy('debut_controle', 'asc')->get();
            
            return response()->json([
                'success' => true,
                'data' => $controles,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des contrôles: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Controle $controle): JsonResponse
    {
        try {
            $currentUser = request()->user();
            
            // Si c'est un professeur, vérifier qu'il peut supprimer ce contrôle
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = $currentUser->getProfesseur();
                
                if ($professeur && $controle->professeur_id !== $professeur->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous ne pouvez pas supprimer un contrôle qui ne vous appartient pas'
                    ], 403);
                }
            }
            
            // Check if controle is used in notes
            if ($controle->notes()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer ce contrôle car il est utilisé dans des notes'
                ], 422);
            }

            $controle->update(['active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Contrôle supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du contrôle: ' . $e->getMessage()
            ], 500);
        }
    }
}


