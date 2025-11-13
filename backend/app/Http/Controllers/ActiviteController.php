<?php

namespace App\Http\Controllers;

use App\Http\Requests\Activite\StoreActiviteRequest;
use App\Http\Requests\Activite\UpdateActiviteRequest;
use App\Http\Resources\ActiviteResource;
use App\Http\Resources\EleveResource;
use App\Models\Activite;
use App\Models\Eleve;
use App\Models\Professeur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ActiviteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Par défaut, ne montrer que les activités actives
        // Si with_inactive=true, montrer toutes les activités
        if ($request->boolean('with_inactive')) {
            $query = Activite::withInactive()->with(['responsable', 'eleves']);
        } else {
            $query = Activite::active()->with(['responsable', 'eleves']);
        }

        // Filtres
        if ($request->filled('type')) {
            $query->byType($request->input('type'));
        }

        if ($request->filled('responsable_id')) {
            $query->byResponsable($request->input('responsable_id'));
        }

        if ($request->filled('annee_scolaire_id')) {
            $query->where('annee_scolaire_id', $request->input('annee_scolaire_id'));
        }

        if ($request->filled('status')) {
            switch ($request->input('status')) {
                case 'upcoming':
                    $query->upcoming();
                    break;
                case 'current':
                    $query->current();
                    break;
                case 'completed':
                    $query->where('date_fin', '<', now()->toDateString());
                    break;
            }
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        // Recherche
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('lieu', 'like', "%{$search}%");
            });
        }

        // Tri
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = min((int) $request->input('per_page', 15), 100);
        $items = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => ActiviteResource::collection($items->items()),
            'meta' => [
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function store(StoreActiviteRequest $request): JsonResponse
    {
        $data = $request->validated();
        // Définir automatiquement l'année scolaire si non fournie
        if (empty($data['annee_scolaire_id'])) {
            $anneeActuelle = \App\Models\AnneeScolaire::getCurrent();
            if ($anneeActuelle) {
                $data['annee_scolaire_id'] = $anneeActuelle->id;
            }
        }
        $activite = Activite::create($data);
        
        return response()->json([
            'success' => true,
            'message' => 'Activité créée avec succès',
            'data' => new ActiviteResource($activite->load('responsable')),
        ], 201);
    }

    public function show(Activite $activite): JsonResponse
    {
        $activite->load(['responsable', 'eleves.parents']);
        
        return response()->json([
            'success' => true,
            'data' => new ActiviteResource($activite),
        ]);
    }

    public function update(UpdateActiviteRequest $request, Activite $activite): JsonResponse
    {
        $data = $request->validated();
        // Définir automatiquement l'année scolaire si non fournie et absente sur le modèle
        if (!array_key_exists('annee_scolaire_id', $data) || empty($data['annee_scolaire_id'])) {
            if (!$activite->annee_scolaire_id) {
                $anneeActuelle = \App\Models\AnneeScolaire::getCurrent();
                if ($anneeActuelle) {
                    $data['annee_scolaire_id'] = $anneeActuelle->id;
                }
            }
        }
        $activite->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Activité mise à jour avec succès',
            'data' => new ActiviteResource($activite->fresh(['responsable'])),
        ]);
    }

    public function destroy(Activite $activite): JsonResponse
    {
        // Vérifier s'il y a des élèves inscrits
        if ($activite->eleves()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer une activité avec des élèves inscrits',
            ], 422);
        }

        $activite->softDelete();

        return response()->json([
            'success' => true,
            'message' => 'Activité supprimée avec succès',
        ]);
    }

    public function restore($id): JsonResponse
    {
        $activite = Activite::inactive()->findOrFail($id);
        $activite->restore();

        return response()->json([
            'success' => true,
            'message' => 'Activité restaurée avec succès',
            'data' => new ActiviteResource($activite->fresh(['responsable'])),
        ]);
    }

    public function inscrireEleve(Request $request, Activite $activite): JsonResponse
    {
        $validated = $request->validate([
            'eleve_id' => 'required|integer|exists:eleves,id',
        ]);

        $eleve = Eleve::findOrFail($validated['eleve_id']);

        // Déterminer l'année cible de l'activité (utiliser l'année actuelle si non définie)
        $anneeCible = $activite->annee_scolaire_id;
        if (!$anneeCible) {
            $anneeActuelle = \App\Models\AnneeScolaire::getCurrent();
            $anneeCible = $anneeActuelle?->id;
            if ($anneeCible) {
                // Optionnel: fixer l'année sur l'activité manquante pour cohérence
                $activite->annee_scolaire_id = $anneeCible;
                $activite->save();
            }
        }

        // Charger la classe de l'élève et vérifier l'année scolaire
        $eleve->load('classe');
        if ($anneeCible) {
            $eleveAnneeId = $eleve->classe?->annee_scolaire_id;
            if (!$eleveAnneeId || (int)$eleveAnneeId !== (int)$anneeCible) {
                throw ValidationException::withMessages([
                    'eleve_id' => ['Cet élève n\'appartient pas à l\'année scolaire de cette activité.'],
                ]);
            }
        }

        // Vérifier si l'élève est déjà inscrit
        if ($activite->eleves()->where('eleve_id', $eleve->id)->exists()) {
            throw ValidationException::withMessages([
                'eleve_id' => ['Cet élève est déjà inscrit à cette activité.'],
            ]);
        }

        // Vérifier la capacité
        if ($activite->est_complet) {
            throw ValidationException::withMessages([
                'activite' => ['Cette activité est complète.'],
            ]);
        }

        $activite->inscrireEleve($eleve->id);

        return response()->json([
            'success' => true,
            'message' => 'Élève inscrit à l\'activité avec succès',
        ], 201);
    }

    public function desinscrireEleve(Activite $activite, Eleve $eleve): JsonResponse
    {
        if (!$activite->eleves()->where('eleve_id', $eleve->id)->exists()) {
            throw ValidationException::withMessages([
                'eleve_id' => ['Cet élève n\'est pas inscrit à cette activité.'],
            ]);
        }

        $activite->desinscrireEleve($eleve->id);

        return response()->json([
            'success' => true,
            'message' => 'Élève désinscrit de l\'activité avec succès',
        ]);
    }

    public function marquerPresence(Request $request, Activite $activite, Eleve $eleve): JsonResponse
    {
        $validated = $request->validate([
            'statut' => 'required|in:present,absent,exclu',
        ]);

        if (!$activite->eleves()->where('eleve_id', $eleve->id)->exists()) {
            throw ValidationException::withMessages([
                'eleve_id' => ['Cet élève n\'est pas inscrit à cette activité.'],
            ]);
        }

        $activite->marquerPresence($eleve->id, $validated['statut']);

        return response()->json([
            'success' => true,
            'message' => 'Présence mise à jour avec succès',
        ]);
    }

    public function eleves(Activite $activite): JsonResponse
    {
        // Récupérer les données avec les informations pivot
        $eleves = $activite->eleves()
            ->with(['parents', 'classe.niveau'])
            ->withPivot(['date_inscription', 'statut'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => EleveResource::collection($eleves),
        ]);
    }

    public function statistiques(Activite $activite): JsonResponse
    {
        $statistiques = [
            'total_inscrits' => $activite->eleves()->count(),
            'places_disponibles' => $activite->places_disponibles,
            'capacite' => $activite->capacite,
            'taux_occupation' => $activite->capacite > 0 ? round(($activite->eleves()->count() / $activite->capacite) * 100, 2) : 0,
            'par_statut' => [
                'inscrits' => $activite->getElevesInscrits()->count(),
                'presents' => $activite->getElevesPresents()->count(),
                'absents' => $activite->getElevesAbsents()->count(),
                'exclus' => $activite->getElevesExclus()->count(),
            ],
            'est_complet' => $activite->est_complet,
            'est_en_cours' => $activite->est_en_cours,
            'est_terminee' => $activite->est_terminee,
        ];

        return response()->json([
            'success' => true,
            'data' => $statistiques,
        ]);
    }

    public function options(): JsonResponse
    {
        $types = [
            ['value' => 'sport', 'label' => 'Sport'],
            ['value' => 'culturel', 'label' => 'Culturel'],
            ['value' => 'artistique', 'label' => 'Artistique'],
            ['value' => 'scientifique', 'label' => 'Scientifique'],
            ['value' => 'social', 'label' => 'Social'],
            ['value' => 'autre', 'label' => 'Autre'],
        ];

        $responsables = Professeur::active()
            ->select('id', 'nom', 'prenom')
            ->get()
            ->map(function ($prof) {
                return [
                    'value' => $prof->id,
                    'label' => $prof->nom . ' ' . $prof->prenom,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'types' => $types,
                'responsables' => $responsables,
            ],
        ]);
    }
}
