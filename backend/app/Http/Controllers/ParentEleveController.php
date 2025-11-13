<?php

namespace App\Http\Controllers;

use App\Http\Requests\ParentEleve\StoreParentEleveRequest;
use App\Http\Resources\ParentEleveResource;
use App\Models\ParentEleve;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class ParentEleveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', ParentEleve::class);

        $query = ParentEleve::query()->with('eleves');
        
        // Par défaut, afficher seulement les parents actifs
        if (!$request->filled('active') || $request->boolean('active')) {
            $query->active();
        } elseif ($request->boolean('active') === false) {
            $query->inactive();
        }
        
        if ($request->filled('q')) {
            $q = '%' . trim((string) $request->input('q')) . '%';
            $query->where(function ($sub) use ($q) {
                $sub->where('nom', 'like', $q)
                    ->orWhere('prenom', 'like', $q)
                    ->orWhere('telephone', 'like', $q)
                    ->orWhere('email', 'like', $q)
                    ->orWhere('profession', 'like', $q);
            });
        }
        $parents = $query->paginate(15);
        return ParentEleveResource::collection($parents);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreParentEleveRequest $request): JsonResponse
    {
        Gate::authorize('create', ParentEleve::class);

        try {
            $parent = ParentEleve::create($request->validated());

            return response()->json([
                'message' => 'Parent créé avec succès',
                'parent' => new ParentEleveResource($parent->load('eleves'))
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création du parent',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(ParentEleve $parent): JsonResponse
    {
        Gate::authorize('view', $parent);

        return response()->json([
            'parent' => new ParentEleveResource($parent->load('eleves'))
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ParentEleve $parent): JsonResponse
    {
        Gate::authorize('update', $parent);

        $request->validate([
            'nom' => 'sometimes|string|max:100',
            'prenom' => 'sometimes|string|max:100',
            'telephone' => 'sometimes|string|max:20',
            'email' => 'sometimes|email|max:255|unique:parents,email,' . $parent->id,
            'adresse' => 'sometimes|string|max:255',
            'profession' => 'sometimes|nullable|string|max:100',
            'type' => 'sometimes|in:pere,mere,tuteur',
        ]);

        try {
            $parent->update($request->only([
                'nom', 'prenom', 'telephone', 'email', 'adresse', 
                'profession', 'type'
            ]));

            return response()->json([
                'message' => 'Parent mis à jour avec succès',
                'parent' => new ParentEleveResource($parent->load('eleves'))
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du parent',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ParentEleve $parent): JsonResponse
    {
        Gate::authorize('delete', $parent);

        try {
            $parent->softDelete();

            return response()->json([
                'message' => 'Parent supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression du parent',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurer un parent supprimé
     */
    public function restore(ParentEleve $parent): JsonResponse
    {
        Gate::authorize('restore', $parent);

        try {
            $parent->restore();

            return response()->json([
                'message' => 'Parent restauré avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la restauration du parent',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les élèves d'un parent
     */
    public function eleves(ParentEleve $parent): JsonResponse
    {
        Gate::authorize('view', $parent);

        return response()->json([
            'eleves' => $parent->eleves()->with('classe')->get()
        ]);
    }
}
