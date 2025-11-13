<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmploiDuTemps\StoreEmploiDuTempsRequest;
use App\Http\Resources\EmploiDuTempsResource;
use App\Models\EmploiDuTemps;
use App\Models\Professeur;
use App\Models\Classe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EmploiDuTempsController extends Controller
{
    public function __construct()
    {
        // Authorization removed for public access
        // $this->authorizeResource(EmploiDuTemps::class, 'emplois_du_temps');
    }

    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $query = EmploiDuTemps::query()->with(['classe', 'matiere', 'professeur', 'salle']);
        
        // Si c'est un professeur, filtrer par son emploi du temps uniquement
        if ($currentUser && $currentUser->hasRole('professeur')) {
            $professeur = $currentUser->getProfesseur();
            
            if ($professeur) {
                $query->where('professeur_id', $professeur->id);
            } else {
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'meta' => [
                        'current_page' => 1,
                        'per_page' => 15,
                        'total' => 0,
                        'last_page' => 1,
                    ],
                ]);
            }
        }
        
        // Par défaut, afficher seulement les emplois du temps actifs
        if (!$request->filled('active') || $request->boolean('active')) {
            $query->active();
        } elseif ($request->boolean('active') === false) {
            $query->inactive();
        }

        if ($request->filled('classe_id')) {
            $query->where('classe_id', (int) $request->input('classe_id'));
        }
        if ($request->filled('professeur_id')) {
            $query->where('professeur_id', (int) $request->input('professeur_id'));
        }
        if ($request->filled('jour')) {
            $query->where('jour', $request->input('jour'));
        }
        
        // Filter by annee_scolaire_id
        if ($request->filled('annee_scolaire_id')) {
            $query->where('annee_scolaire_id', $request->input('annee_scolaire_id'));
        }

        $perPage = (int) $request->input('per_page', 15);
        $items = $query->paginate($perPage);
        
        // Pas de filtrage - laisser le frontend gérer l'affichage "Élément supprimé"

        return response()->json([
            'success' => true,
            'data' => EmploiDuTempsResource::collection($items->items()),
            'meta' => [
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function store(StoreEmploiDuTempsRequest $request): JsonResponse
    {
        $data = $request->validated();
        
        // Si annee_scolaire_id n'est pas fourni, utiliser l'année scolaire active
        if (!isset($data['annee_scolaire_id']) || empty($data['annee_scolaire_id'])) {
            $activeAnneeScolaire = \App\Models\AnneeScolaire::where('active', true)->first();
            if ($activeAnneeScolaire) {
                $data['annee_scolaire_id'] = $activeAnneeScolaire->id;
            }
        }
        
        $this->ensureNoConflicts($data);

        $item = EmploiDuTemps::create($data);

        return response()->json([
            'success' => true,
            'message' => "Séance ajoutée",
            'data' => new EmploiDuTempsResource($item->load(['classe', 'matiere', 'professeur', 'salle'])),
        ], 201);
    }

    public function show(EmploiDuTemps $emplois_du_temps): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new EmploiDuTempsResource($emplois_du_temps->load(['classe', 'matiere', 'professeur', 'salle'])),
        ]);
    }

    public function update(Request $request, EmploiDuTemps $emplois_du_temps): JsonResponse
    {
        $validated = $request->validate([
            'classe_id' => 'sometimes|required|integer|exists:classes,id',
            'annee_scolaire_id' => 'nullable|integer|exists:annees_scolaires,id',
            'jour' => 'sometimes|required|string|in:lundi,mardi,mercredi,jeudi,vendredi,samedi',
            'heure_debut' => 'sometimes|required|date_format:H:i',
            'heure_fin' => 'sometimes|required|date_format:H:i|after:heure_debut',
            'matiere_id' => 'sometimes|required|integer|exists:matieres,id',
            'professeur_id' => 'sometimes|required|integer|exists:professeurs,id',
            'salle_id' => 'sometimes|required|integer|exists:salles,id',
            'couleur' => 'nullable|string|regex:/^#([A-Fa-f0-9]{6})$/',
            'notes' => 'nullable|string|max:2000',
            'active' => 'sometimes|boolean',
        ], [
            'classe_id.required' => 'La classe est obligatoire.',
            'classe_id.exists' => 'La classe sélectionnée n\'existe pas.',
            'jour.required' => 'Le jour est obligatoire.',
            'jour.in' => 'Le jour doit être lundi, mardi, mercredi, jeudi, vendredi ou samedi.',
            'heure_debut.required' => 'L\'heure de début est obligatoire.',
            'heure_debut.date_format' => 'L\'heure de début doit être au format HH:MM (ex: 08:00).',
            'heure_fin.required' => 'L\'heure de fin est obligatoire.',
            'heure_fin.date_format' => 'L\'heure de fin doit être au format HH:MM (ex: 09:00).',
            'heure_fin.after' => 'L\'heure de fin doit être après l\'heure de début.',
            'matiere_id.required' => 'La matière est obligatoire.',
            'matiere_id.exists' => 'La matière sélectionnée n\'existe pas.',
            'professeur_id.required' => 'Le professeur est obligatoire.',
            'professeur_id.exists' => 'Le professeur sélectionné n\'existe pas.',
            'salle_id.required' => 'La salle est obligatoire.',
            'salle_id.exists' => 'La salle sélectionnée n\'existe pas.',
            'couleur.regex' => 'La couleur doit être au format hexadécimal (ex: #FF0000).',
            'notes.max' => 'Les notes ne peuvent pas dépasser 2000 caractères.',
        ]);

        // Si annee_scolaire_id n'est pas fourni, utiliser l'année scolaire active
        if (!isset($validated['annee_scolaire_id']) || empty($validated['annee_scolaire_id'])) {
            $activeAnneeScolaire = \App\Models\AnneeScolaire::where('active', true)->first();
            if ($activeAnneeScolaire) {
                $validated['annee_scolaire_id'] = $activeAnneeScolaire->id;
            }
        }

        $candidate = array_merge($emplois_du_temps->toArray(), $validated);
        $this->ensureNoConflicts($candidate, $emplois_du_temps->id);

        $emplois_du_temps->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Séance mise à jour',
            'data' => new EmploiDuTempsResource($emplois_du_temps->fresh()->load(['classe', 'matiere', 'discipline', 'professeur', 'salle'])),
        ]);
    }

    public function destroy(EmploiDuTemps $emplois_du_temps): JsonResponse
    {
        $emplois_du_temps->softDelete();

        return response()->json([
            'success' => true,
            'message' => 'Séance supprimée',
        ]);
    }

    public function restore(EmploiDuTemps $emplois_du_temps): JsonResponse
    {
        $emplois_du_temps->restore();

        return response()->json([
            'success' => true,
            'message' => 'Séance restaurée',
        ]);
    }

    public function classeSchedule(Classe $classe, Request $request): JsonResponse
    {
        try {
            $currentUser = $request->user();
            
            // Si c'est un élève, vérifier qu'il appartient à cette classe
            if ($currentUser && $currentUser->hasRole('eleve')) {
                $eleve = $currentUser->getEleve();
                if (!$eleve || $eleve->classe_id !== $classe->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Accès refusé. Vous ne pouvez voir que l\'emploi du temps de votre classe.',
                    ], 403);
                }
            }
            
            $query = EmploiDuTemps::where('classe_id', $classe->id)
                ->active()
                ->orderBy('jour')->orderBy('heure_debut')
                ->with(['classe', 'matiere', 'professeur', 'salle']);
            
            // Filter by annee_scolaire_id if provided
            if ($request->filled('annee_scolaire_id')) {
                $query->where('annee_scolaire_id', $request->input('annee_scolaire_id'));
            }
            
            $items = $query->get();

            return response()->json([
                'success' => true,
                'data' => EmploiDuTempsResource::collection($items),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => [],
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function professorSchedule(Request $request, Professeur $professeur): JsonResponse
    {
        $currentUser = $request->user();
        
        // Si c'est un professeur, vérifier qu'il ne peut voir que son propre emploi du temps
        if ($currentUser && $currentUser->hasRole('professeur')) {
            // Charger le rôle pour avoir accès à la relation
            $currentUser->load('role');
            
            // Trouver le professeur associé via nom + prénom
            $userProfesseur = Professeur::where('nom', $currentUser->nom)
                ->where('prenom', $currentUser->prenom)
                ->first();
            
            if (!$userProfesseur) {
                return response()->json([
                    'success' => false,
                    'message' => 'Professeur non trouvé.',
                ], 404);
            }
            
            // Vérifier que le professeur demande son propre emploi du temps
            if ($userProfesseur->id !== $professeur->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès refusé. Vous ne pouvez voir que votre propre emploi du temps.',
                ], 403);
            }
        }
        
        $items = EmploiDuTemps::where('professeur_id', $professeur->id)
            ->active()
            ->orderBy('jour')->orderBy('heure_debut')
            ->with(['classe', 'matiere', 'professeur', 'salle'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => EmploiDuTempsResource::collection($items),
        ]);
    }

    public function destroyByClasse(Classe $classe): JsonResponse
    {
        EmploiDuTemps::where('classe_id', $classe->id)->update(['active' => false]);
        return response()->json([
            'success' => true,
            'message' => "Emploi du temps de la classe supprimé",
        ]);
    }

    private function ensureNoConflicts(array $data, ?int $ignoreId = null): void
    {
        // Strict overlap: existing.start < new.end AND existing.end > new.start
        // This allows back-to-back sessions like 08:00-09:00 and 09:00-10:00
        $overlapWhere = function ($q) use ($data, $ignoreId) {
            $q->where('jour', $data['jour'])
              ->where('heure_debut', '<', $data['heure_fin'])
              ->where('heure_fin', '>', $data['heure_debut']);

            if ($ignoreId) {
                $q->where('id', '!=', $ignoreId);
            }
        };

        $profConflict = EmploiDuTemps::where('professeur_id', $data['professeur_id'])
            ->where($overlapWhere)->exists();
        if ($profConflict) {
            throw ValidationException::withMessages([
                'professeur_id' => ['Conflit horaire détecté pour le professeur.'],
            ]);
        }

        if (!empty($data['salle_id'])) {
            $salleConflict = EmploiDuTemps::where('salle_id', $data['salle_id'])
                ->where($overlapWhere)->exists();
            if ($salleConflict) {
                throw ValidationException::withMessages([
                    'salle_id' => ['Conflit horaire détecté pour la salle.'],
                ]);
            }
        }
    }
}
