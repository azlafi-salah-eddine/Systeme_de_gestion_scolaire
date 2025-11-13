<?php

namespace App\Http\Controllers;

use App\Http\Resources\ClasseResource;
use App\Http\Resources\AnneeScolaireResource;
use App\Models\AnneeScolaire;
use App\Models\Classe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Schema;

class AnneeScolaireClasseController extends Controller
{
    /**
     * Obtenir toutes les classes d'une année scolaire
     */
    public function index(Request $request, AnneeScolaire $anneeScolaire): JsonResponse
    {
        $query = $anneeScolaire->classes();

        // Relations à charger
        if ($request->filled('with')) {
            $with = array_filter(array_map('trim', explode(',', (string) $request->input('with'))));
            $allowed = ['eleves', 'professeurs', 'matieres', 'professeurPrincipal', 'niveau'];
            $with = array_values(array_intersect($with, $allowed));
            if (!empty($with)) {
                $query->with($with);
            }
        } else {
            // Charger la relation niveau par défaut
            $query->with('niveau');
        }

        // Filtres
        if ($request->filled('niveau_id')) {
            $query->where('niveau_id', $request->input('niveau_id'));
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        // Recherche
        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('section', 'like', "%{$search}%")
                  ->orWhereHas('niveau', function ($niveauQuery) use ($search) {
                      $niveauQuery->where('nom', 'like', "%{$search}%");
                  });
            });
        }

        // Tri
        $sortBy = $request->input('sort_by', 'niveau');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $classes = $query->get();

        // Calculer les statistiques
        $statistiques = [
            'total_classes' => $classes->count(),
            'total_eleves' => $classes->sum('nombre_eleves'),
            'classes_actives' => $classes->where('active', true)->count(),
            'classes_completes' => $classes->filter(fn($classe) => $classe->est_complete)->count(),
            'taux_occupation_moyen' => $classes->count() > 0 ? round($classes->avg('taux_occupation'), 2) : 0,
            'par_niveau' => $classes->groupBy('niveau')->map(fn($group) => [
                'nombre_classes' => $group->count(),
                'nombre_eleves' => $group->sum('nombre_eleves'),
                'taux_occupation_moyen' => round($group->avg('taux_occupation'), 2),
            ]),
        ];

        return response()->json([
            'success' => true,
            'data' => ClasseResource::collection($classes),
            'meta' => [
                'annee_scolaire' => new AnneeScolaireResource($anneeScolaire),
                'statistiques' => $statistiques,
            ],
        ]);
    }

    /**
     * Créer une nouvelle classe pour une année scolaire
     */
    public function store(Request $request, AnneeScolaire $anneeScolaire): JsonResponse
    {
        if (!request()->user()?->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'niveau_id' => 'nullable|integer|exists:niveaux,id',
            'section' => 'required|string|max:10',
            'capacite' => 'required|integer|min:1|max:50',
            'salle_id' => 'nullable|integer|exists:salles,id',
            'professeur_principal_id' => 'nullable|integer|exists:professeurs,id',
            'active' => 'boolean',
        ]);

        // Normaliser les IDs optionnels vides en null
        if (array_key_exists('salle_id', $validated) && $validated['salle_id'] === '') {
            $validated['salle_id'] = null;
        }
        if (array_key_exists('professeur_principal_id', $validated) && $validated['professeur_principal_id'] === '') {
            $validated['professeur_principal_id'] = null;
        }

        // Retirer les colonnes optionnelles absentes du schéma
        foreach (['section', 'capacite', 'salle_id', 'professeur_principal_id', 'active', 'annee_scolaire'] as $column) {
            if (!Schema::hasColumn('classes', $column)) {
                unset($validated[$column]);
            }
        }

        // Ajouter l'année scolaire
        $validated['annee_scolaire_id'] = $anneeScolaire->id;

        $classe = Classe::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Classe créée avec succès pour l\'année scolaire ' . $anneeScolaire->nom_formate,
            'data' => new ClasseResource($classe->load(['professeurPrincipal', 'niveau'])),
        ], 201);
    }

    /**
     * Dupliquer les classes d'une année scolaire vers une autre
     */
    public function dupliquer(Request $request, AnneeScolaire $anneeScolaire): JsonResponse
    {
        if (!request()->user()?->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'annee_scolaire_destination_id' => 'required|integer|exists:annees_scolaires,id',
            'niveaux' => 'nullable|array',
            'niveaux.*' => 'string',
            'inclure_eleves' => 'boolean',
            'inclure_professeurs' => 'boolean',
        ]);

        $anneeDestination = AnneeScolaire::findOrFail($validated['annee_scolaire_destination_id']);

        if ($anneeDestination->id === $anneeScolaire->id) {
            throw ValidationException::withMessages([
                'annee_scolaire_destination_id' => ['L\'année scolaire de destination doit être différente de l\'année source.'],
            ]);
        }

        $query = $anneeScolaire->classes();
        
        // Filtrer par niveaux si spécifié
        if (!empty($validated['niveaux'])) {
            $query->whereIn('niveau', $validated['niveaux']);
        }

        $classesSource = $query->get();
        $classesDupliquees = [];

        foreach ($classesSource as $classeSource) {
            $nouvelleClasse = $classeSource->replicate();
            $nouvelleClasse->annee_scolaire_id = $anneeDestination->id;
            $nouvelleClasse->professeur_principal_id = null; // Ne pas dupliquer le professeur principal
            $nouvelleClasse->save();

            // Dupliquer les élèves si demandé
            if ($validated['inclure_eleves'] ?? false) {
                foreach ($classeSource->eleves as $eleve) {
                    $eleve->update(['classe_id' => $nouvelleClasse->id]);
                }
            }

            // Dupliquer les professeurs si demandé
            if ($validated['inclure_professeurs'] ?? false) {
                $pivotData = $classeSource->professeurs()->get()->mapWithKeys(function ($professeur) {
                    return [$professeur->id => [
                        'matiere_id' => $professeur->pivot->matiere_id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]];
                })->toArray();

                $nouvelleClasse->professeurs()->attach($pivotData);
            }

            $classesDupliquees[] = $nouvelleClasse;
        }

        return response()->json([
            'success' => true,
            'message' => count($classesDupliquees) . ' classe(s) dupliquée(s) avec succès',
            'data' => ClasseResource::collection($classesDupliquees),
            'meta' => [
                'annee_source' => new AnneeScolaireResource($anneeScolaire),
                'annee_destination' => new AnneeScolaireResource($anneeDestination),
                'nombre_classes_dupliquees' => count($classesDupliquees),
            ],
        ], 201);
    }

    /**
     * Obtenir les statistiques détaillées des classes d'une année scolaire
     */
    public function statistiques(AnneeScolaire $anneeScolaire): JsonResponse
    {
        $classes = $anneeScolaire->classes()->with(['eleves', 'professeurs'])->get();

        $statistiques = [
            'annee_scolaire' => new AnneeScolaireResource($anneeScolaire),
            'resume' => [
                'total_classes' => $classes->count(),
                'classes_actives' => $classes->where('active', true)->count(),
                'total_eleves' => $classes->sum('nombre_eleves'),
                'capacite_totale' => $classes->sum('capacite'),
                'taux_occupation_moyen' => $classes->count() > 0 ? round($classes->avg('taux_occupation'), 2) : 0,
                'classes_completes' => $classes->filter(fn($classe) => $classe->est_complete)->count(),
            ],
            'par_niveau' => $classes->groupBy('niveau')->map(function ($group) {
                return [
                    'niveau' => $group->first()->niveau,
                    'nombre_classes' => $group->count(),
                    'classes_actives' => $group->where('active', true)->count(),
                    'total_eleves' => $group->sum('nombre_eleves'),
                    'capacite_totale' => $group->sum('capacite'),
                    'taux_occupation_moyen' => round($group->avg('taux_occupation'), 2),
                    'classes_completes' => $group->filter(fn($classe) => $classe->est_complete)->count(),
                ];
            })->values(),
            'par_section' => $classes->groupBy('section')->map(function ($group) {
                return [
                    'section' => $group->first()->section,
                    'nombre_classes' => $group->count(),
                    'total_eleves' => $group->sum('nombre_eleves'),
                    'taux_occupation_moyen' => round($group->avg('taux_occupation'), 2),
                ];
            })->values(),
            'professeurs' => [
                'total_professeurs_uniques' => $classes->flatMap->professeurs->unique('id')->count(),
                'professeurs_principaux' => $classes->whereNotNull('professeur_principal_id')->count(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $statistiques,
        ]);
    }

    /**
     * Archiver toutes les classes d'une année scolaire
     */
    public function archiver(AnneeScolaire $anneeScolaire): JsonResponse
    {
        if (!request()->user()?->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $classes = $anneeScolaire->classes();
        $nombreClasses = $classes->count();
        
        $classes->update(['active' => false]);

        return response()->json([
            'success' => true,
            'message' => $nombreClasses . ' classe(s) archivée(s) avec succès',
            'meta' => [
                'annee_scolaire' => new AnneeScolaireResource($anneeScolaire),
                'nombre_classes_archivees' => $nombreClasses,
            ],
        ]);
    }

    /**
     * Réactiver toutes les classes d'une année scolaire
     */
    public function reactiver(AnneeScolaire $anneeScolaire): JsonResponse
    {
        if (!request()->user()?->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $classes = $anneeScolaire->classes();
        $nombreClasses = $classes->count();
        
        $classes->update(['active' => true]);

        return response()->json([
            'success' => true,
            'message' => $nombreClasses . ' classe(s) réactivée(s) avec succès',
            'meta' => [
                'annee_scolaire' => new AnneeScolaireResource($anneeScolaire),
                'nombre_classes_reactives' => $nombreClasses,
            ],
        ]);
    }

    /**
     * Méthode utilitaire pour vérifier les droits admin
     */
    private function ensureAdmin(): void
    {
        if (!request()->user()?->hasRole('admin')) {
            abort(403, 'Accès refusé. Seuls les administrateurs peuvent effectuer cette action.');
        }
    }
}
