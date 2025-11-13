<?php

namespace App\Http\Controllers;

use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Role::class);
        
        $roles = Role::paginate(15);
        return RoleResource::collection($roles);
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
    public function store(StoreRoleRequest $request): JsonResponse
    {
        Gate::authorize('create', Role::class);

        try {
            $role = Role::create([
                'nom' => $request->nom,
                'description' => $request->description,
            ]);

            return response()->json([
                'message' => 'Rôle créé avec succès',
                'role' => new RoleResource($role)
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création du rôle',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Role $role): JsonResponse
    {
        Gate::authorize('view', $role);
        
        return response()->json([
            'role' => new RoleResource($role)
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
    public function update(Request $request, Role $role): JsonResponse
    {
        Gate::authorize('update', $role);

        $request->validate([
            'nom' => 'sometimes|string|min:3|max:255|unique:roles,nom,' . $role->id,
            'description' => 'sometimes|nullable|string|max:500',
        ]);

        try {
            $role->update($request->only(['nom', 'description']));

            return response()->json([
                'message' => 'Rôle mis à jour avec succès',
                'role' => new RoleResource($role)
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la mise à jour du rôle',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role): JsonResponse
    {
        Gate::authorize('delete', $role);

        try {
            // Vérifier si le rôle est utilisé
            if ($role->users()->count() > 0) {
                return response()->json([
                    'message' => 'Impossible de supprimer ce rôle car il est attribué à des utilisateurs'
                ], 422);
            }

            $role->delete();

            return response()->json([
                'message' => 'Rôle supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression du rôle',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
