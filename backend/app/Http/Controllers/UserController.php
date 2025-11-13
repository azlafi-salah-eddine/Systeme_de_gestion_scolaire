<?php

namespace App\Http\Controllers;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use App\Traits\HandlesActiveRecords;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    use HandlesActiveRecords;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', User::class);
        
        $query = User::with('role');
        
        // Les professeurs ne peuvent voir que leur propre compte
        $currentUser = $request->user();
        if ($currentUser->hasRole('professeur')) {
            $query->where('id', $currentUser->id);
        }
        
        $query = $this->applyActiveFilter($query, $request);
        
        $users = $query->paginate(15);
        return UserResource::collection($users);
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
    public function store(StoreUserRequest $request): JsonResponse
    {
        Gate::authorize('create', User::class);

        try {
            DB::beginTransaction();

            $user = User::create([
                'nom_complet' => $request->nom_complet,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'telephone' => $request->telephone,
            ]);

            // Assigner le premier rôle (on utilise role_id, un seul rôle par user)
            if ($request->has('roles') && !empty($request->roles)) {
                $role = Role::whereIn('nom', $request->roles)->first();
                if ($role) {
                    $user->update(['role_id' => $role->id]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Utilisateur créé avec succès',
                'user' => new UserResource($user->load('role'))
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la création de l\'utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): JsonResponse
    {
        Gate::authorize('view', $user);
        
        return response()->json([
            'user' => new UserResource($user->load('role'))
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
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        Gate::authorize('update', $user);

        try {
            DB::beginTransaction();

            $updateData = [];
            
            if ($request->has('nom_complet')) {
                $updateData['nom_complet'] = $request->nom_complet;
            }
            
            if ($request->has('email')) {
                $updateData['email'] = $request->email;
            }
            
            if ($request->has('telephone')) {
                $updateData['telephone'] = $request->telephone;
            }
            
            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            if (!empty($updateData)) {
                $user->update($updateData);
            }

            // Mettre à jour le rôle si fourni (on utilise role_id, un seul rôle par user)
            if ($request->has('roles') && !empty($request->roles)) {
                $role = Role::whereIn('nom', $request->roles)->first();
                if ($role) {
                    $user->update(['role_id' => $role->id]);
                } else {
                    $user->update(['role_id' => null]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Utilisateur mis à jour avec succès',
                'user' => new UserResource($user->load('role'))
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la mise à jour de l\'utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): JsonResponse
    {
        Gate::authorize('delete', $user);

        try {
            // Soft delete au lieu de suppression physique
            $user->softDelete();

            return response()->json([
                'message' => 'Utilisateur supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de l\'utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurer un utilisateur supprimé (soft delete)
     */
    public function restore(Request $request, User $user): JsonResponse
    {
        if (!$this->canRestore($request)) {
            return response()->json([
                'message' => 'Vous n\'avez pas les permissions pour restaurer cet utilisateur'
            ], 403);
        }

        try {
            $user->restore();

            return response()->json([
                'message' => 'Utilisateur restauré avec succès',
                'user' => new UserResource($user->load('role'))
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la restauration de l\'utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
