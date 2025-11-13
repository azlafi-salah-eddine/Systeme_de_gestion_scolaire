<?php

namespace App\Http\Controllers;

use App\Http\Requests\Classe\StoreClasseRequest;
use App\Http\Resources\ClasseResource;
use App\Http\Resources\EleveResource;
use App\Http\Resources\MatiereResource;
use App\Http\Resources\ProfesseurResource;
use App\Http\Resources\AnneeScolaireResource;
use App\Models\Classe;
use App\Models\Eleve;
use App\Models\Professeur;
use App\Models\Matiere;
use App\Models\AnneeScolaire;
use App\Traits\HandlesActiveRecords;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class ClasseController extends Controller
{
    use HandlesActiveRecords;

    public function __construct()
    {
        $this->authorizeResource(Classe::class, 'classe');
    }

    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $query = Classe::query();

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
                        'meta' => [
                            'current_page' => 1,
                            'per_page' => 15,
                            'total' => 0,
                            'last_page' => 1,
                        ],
                    ]);
                }
                
                $query->whereIn('id', $classeIds);
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

        // Relations à charger
        if ($request->filled('with')) {
            $with = array_filter(array_map('trim', explode(',', (string) $request->input('with'))));
            $allowed = ['eleves', 'professeurs', 'matieres', 'anneeScolaire', 'professeurPrincipal', 'niveau'];
            $with = array_values(array_intersect($with, $allowed));
            if (!empty($with)) {
                $query->with($with);
            }
        } else {
            // Charger la relation niveau par défaut
            $query->with('niveau');
        }

        // Recherche
        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('section', 'like', "%{$search}%")
                  ->orWhere('annee_scolaire', 'like', "%{$search}%")
                  ->orWhereHas('niveau', function ($niveauQuery) use ($search) {
                      $niveauQuery->where('nom', 'like', "%{$search}%");
                  });
            });
        }

        // Filtres
        if ($request->filled('annee_scolaire_id')) {
            $query->where('annee_scolaire_id', $request->input('annee_scolaire_id'));
        }

        if ($request->filled('niveau')) {
            $query->whereHas('niveau', function ($niveauQuery) use ($request) {
                $niveauQuery->where('nom', $request->input('niveau'));
            });
        }

        // Appliquer le filtrage selon les permissions
        $query = $this->applyActiveFilter($query, $request);

        // Toujours calculer le nombre d'élèves pour les statistiques
        $query->withCount('eleves as nombre_eleves');

        // Tri
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = (int) $request->input('per_page', 15);
        // Si per_page est très grand, limiter à 1000 pour éviter les timeouts
        $perPage = min($perPage, 1000);
        $classes = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => ClasseResource::collection($classes->items()),
            'meta' => [
                'current_page' => $classes->currentPage(),
                'per_page' => $classes->perPage(),
                'total' => $classes->total(),
                'last_page' => $classes->lastPage(),
            ],
        ]);
    }

    public function store(StoreClasseRequest $request): JsonResponse
    {
        $this->ensureAdmin();
        
        $classe = Classe::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Classe créée avec succès',
            'data' => new ClasseResource($classe->load(['anneeScolaire', 'niveau'])),
        ], 201);
    }

    public function show(Request $request, Classe $classe): JsonResponse
    {
        $currentUser = $request->user();
        
        // Si c'est un professeur, vérifier qu'il a accès à cette classe
        if ($currentUser && $currentUser->hasRole('professeur')) {
            // Charger le rôle pour avoir accès à la relation
            $currentUser->load('role');
            
            $professeur = Professeur::where('nom', $currentUser->nom)
                ->where('prenom', $currentUser->prenom)
                ->first();
            
            if ($professeur) {
                $classeIds = $professeur->classes()->pluck('classes.id')->toArray();
                if (!in_array($classe->id, $classeIds)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Accès refusé. Vous ne pouvez voir que vos classes.',
                    ], 403);
                }
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Professeur non trouvé',
                ], 404);
            }
        } else {
            $this->authorize('view', $classe);
        }
        
        if ($request->filled('with')) {
            $with = array_filter(array_map('trim', explode(',', (string) $request->input('with'))));
            $allowed = ['eleves', 'professeurs', 'matieres', 'anneeScolaire', 'emploisDuTemps', 'niveau'];
            $with = array_values(array_intersect($with, $allowed));
            if (!empty($with)) {
                $classe->load($with);
            }
        } else {
            // Charger la relation niveau par défaut
            $classe->load('niveau');
        }

        return response()->json([
            'success' => true,
            'data' => new ClasseResource($classe),
        ]);
    }

    public function update(Request $request, Classe $classe): JsonResponse
    {
        $this->ensureAdmin();
        
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'niveau' => 'sometimes|required|string|max:50',
            'annee_scolaire_id' => 'sometimes|required|integer|exists:annees_scolaires,id',
            'section' => 'sometimes|required|string|max:10',
            'capacite' => 'sometimes|required|integer|min:1|max:50',
            'professeur_principal_id' => 'nullable|integer|exists:professeurs,id',
            'active' => 'sometimes|boolean',
        ]);

        // Retirer les colonnes absentes du schéma (ex: salle_id supprimée)
        foreach (['salle_id', 'section', 'capacite', 'professeur_principal_id', 'active', 'annee_scolaire_id'] as $column) {
            if (array_key_exists($column, $validated) && !Schema::hasColumn('classes', $column)) {
                unset($validated[$column]);
            }
        }

        $classe->update($validated);

        $fresh = $classe->fresh()->load(['anneeScolaire']);
        return response()->json([
            'success' => true,
            'message' => 'Classe mise à jour avec succès',
            'data' => new ClasseResource($fresh),
        ]);
    }

    public function destroy(Classe $classe): JsonResponse
    {
        $this->ensureAdmin();
        
        // Vérifier s'il y a des élèves dans la classe
        if ($classe->eleves()->count() > 0) {
            throw ValidationException::withMessages([
                'classe' => ['Impossible de supprimer une classe qui contient des élèves.'],
            ]);
        }

        $classe->softDelete();

        return response()->json([
            'success' => true,
            'message' => 'Classe supprimée avec succès',
        ]);
    }

    // ============ GESTION DES ÉLÈVES ============

    public function eleves(Classe $classe): JsonResponse
    {
        $this->authorize('view', $classe);
        $eleves = $classe->eleves()->with(['parents'])->get();

        return response()->json([
            'success' => true,
            'data' => EleveResource::collection($eleves),
        ]);
    }

    public function inscrireEleve(Request $request, Classe $classe): JsonResponse
    {
        $this->ensureRole(['admin', 'professeur']);
        
        $validated = $request->validate([
            'eleve_id' => 'required|integer|exists:eleves,id',
        ]);

        $eleve = Eleve::findOrFail($validated['eleve_id']);

        // Vérifier si la classe n'est pas complète
        if ($classe->est_complete) {
            throw ValidationException::withMessages([
                'classe' => ['La classe est complète. Impossible d\'inscrire plus d\'élèves.'],
            ]);
        }

        // Vérifier si l'élève n'est pas déjà dans une classe de la même année scolaire
        if ($eleve->classe_id && $eleve->classe->annee_scolaire_id === $classe->annee_scolaire_id) {
            throw ValidationException::withMessages([
                'eleve_id' => ['L\'élève est déjà inscrit dans une classe de cette année scolaire.'],
            ]);
        }

        $eleve->update(['classe_id' => $classe->id]);

        return response()->json([
            'success' => true,
            'message' => 'Élève inscrit dans la classe',
            'data' => new EleveResource($eleve->fresh()),
        ], 201);
    }

    public function desinscrireEleve(Classe $classe, Eleve $eleve): JsonResponse
    {
        $this->ensureRole(['admin', 'professeur']);
        
        if ($eleve->classe_id !== $classe->id) {
            throw ValidationException::withMessages([
                'eleve' => ['L\'élève n\'est pas inscrit dans cette classe.'],
            ]);
        }

        $eleve->update(['classe_id' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Élève désinscrit de la classe',
        ]);
    }

    // ============ GESTION DES PROFESSEURS ============

    public function professeurs(Classe $classe): JsonResponse
    {
        $this->authorize('view', $classe);
        $professeurs = $classe->professeurs()->with(['matieres'])->get();

        return response()->json([
            'success' => true,
            'data' => ProfesseurResource::collection($professeurs),
        ]);
    }

    public function assignerProfesseur(Request $request, Classe $classe): JsonResponse
    {
        $this->ensureAdmin();
        
        $validated = $request->validate([
            'professeur_id' => 'required|integer|exists:professeurs,id',
            'matiere_id' => 'required|integer|exists:matieres,id',
        ]);

        $professeur = Professeur::findOrFail($validated['professeur_id']);
        $matiere = Matiere::findOrFail($validated['matiere_id']);

        // Vérifier si l'association existe déjà
        if ($classe->professeurs()->wherePivot('professeur_id', $professeur->id)
            ->wherePivot('matiere_id', $matiere->id)->exists()) {
            throw ValidationException::withMessages([
                'professeur' => ['Ce professeur enseigne déjà cette matière dans cette classe.'],
            ]);
        }

        $classe->professeurs()->attach($professeur->id, [
            'matiere_id' => $matiere->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Professeur assigné à la classe',
        ], 201);
    }

    public function retirerProfesseur(Classe $classe, Professeur $professeur): JsonResponse
    {
        $this->ensureAdmin();
        
        $classe->professeurs()->detach($professeur->id);

        return response()->json([
            'success' => true,
            'message' => 'Professeur retiré de la classe',
        ]);
    }

    public function definirProfesseurPrincipal(Request $request, Classe $classe): JsonResponse
    {
        $this->ensureAdmin();
        $validated = $request->validate([
            'professeur_id' => 'required|integer|exists:professeurs,id',
        ]);
        $classe->update(['professeur_principal_id' => $validated['professeur_id']]);
        return response()->json([
            'success' => true,
            'message' => 'Professeur principal défini',
            'data' => new ClasseResource($classe->fresh()),
        ]);
    }

    // ============ GESTION DES MATIÈRES ============

    public function matieres(Classe $classe): JsonResponse
    {
        try {
            $this->authorize('view', $classe);
            
            $matiereIds = [];
            
            // Récupérer les matières de la classe via les emplois du temps
            // C'est plus fiable car les emplois du temps sont toujours à jour
            if (Schema::hasTable('emplois_du_temps')) {
                $matiereIds = DB::table('emplois_du_temps')
                    ->where('classe_id', $classe->id)
                    ->where('active', true)
                    ->distinct()
                    ->pluck('matiere_id')
                    ->toArray();
            }
            
            // Si pas de matières via emplois du temps, essayer via classe_professeur_matiere
            if (empty($matiereIds) && Schema::hasTable('classe_professeur_matiere')) {
                $matiereIds = DB::table('classe_professeur_matiere')
                    ->where('classe_id', $classe->id)
                    ->distinct()
                    ->pluck('matiere_id')
                    ->toArray();
            }
            
            // Si toujours pas de matières, essayer classe_matiere
            if (empty($matiereIds) && Schema::hasTable('classe_matiere')) {
                $matiereIds = DB::table('classe_matiere')
                    ->where('classe_id', $classe->id)
                    ->distinct()
                    ->pluck('matiere_id')
                    ->toArray();
            }
            
            if (empty($matiereIds)) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }
            
            $matieres = Matiere::whereIn('id', $matiereIds)
                ->where('active', true)
                ->get();

            return response()->json([
                'success' => true,
                'data' => MatiereResource::collection($matieres),
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error loading matieres for classe ' . $classe->id . ': ' . $e->getMessage());
            \Illuminate\Support\Facades\Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des matières',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============ STATISTIQUES ET RAPPORTS ============

    public function statistiques(Classe $classe): JsonResponse
    {
        $this->authorize('view', $classe);
        
        $statistiques = $classe->getStatistiques();
        
        // Ajouter des statistiques supplémentaires
        $statistiques['moyenne_generale'] = $classe->notes()->avg('note') ?? 0;
        $statistiques['nombre_absences'] = $classe->absences()->count();
        $statistiques['taux_absentisme'] = $classe->eleves()->count() > 0 
            ? round(($statistiques['nombre_absences'] / $statistiques['nombre_eleves']) * 100, 2)
            : 0;

        return response()->json([
            'success' => true,
            'data' => $statistiques,
        ]);
    }

    public function toggleActive(Classe $classe): JsonResponse
    {
        $this->ensureAdmin();
        
        $classe->toggleActive();

        return response()->json([
            'success' => true,
            'message' => $classe->active ? 'Classe activée' : 'Classe désactivée',
            'data' => new ClasseResource($classe->fresh()),
        ]);
    }

    // ============ GESTION PAR ANNÉE SCOLAIRE ============

    public function parAnneeScolaire(Request $request, AnneeScolaire $anneeScolaire): JsonResponse
    {
        $query = $anneeScolaire->classes();

        if ($request->filled('with')) {
            $with = array_filter(array_map('trim', explode(',', (string) $request->input('with'))));
            $allowed = ['eleves', 'professeurs', 'matieres'];
            $with = array_values(array_intersect($with, $allowed));
            if (!empty($with)) {
                $query->with($with);
            }
        }

        $classes = $query->get();

        return response()->json([
            'success' => true,
            'data' => ClasseResource::collection($classes),
            'meta' => [
                'annee_scolaire' => new AnneeScolaireResource($anneeScolaire),
                'total_classes' => $classes->count(),
                'total_eleves' => $classes->sum('nombre_eleves'),
            ],
        ]);
    }

    // ============ MÉTHODES UTILITAIRES ============

    private function ensureAdmin(): void
    {
        if (!request()->user()?->isAdmin()) {
            abort(403, 'Accès refusé. Seuls les administrateurs peuvent effectuer cette action.');
        }
    }

    private function ensureRole(array $roles): void
    {
        // In local/dev environment, bypass role checks to ease enrollment flow
        if (app()->environment('local')) {
            return;
        }
        $user = request()->user();
        foreach ($roles as $role) {
            if ($user?->hasRole($role)) {
                return;
            }
        }
        abort(403, 'Accès refusé. Rôle insuffisant.');
    }
}
