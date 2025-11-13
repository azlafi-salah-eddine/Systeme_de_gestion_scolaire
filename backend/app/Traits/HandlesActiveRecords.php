<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait HandlesActiveRecords
{
    /**
     * Applique le filtrage selon les permissions de l'utilisateur
     */
    protected function applyActiveFilter(Builder $query, Request $request): Builder
    {
        $user = $request->user();
        
        // Si l'utilisateur n'est pas connecté, on ne montre que les actifs
        if (!$user) {
            return $query->active();
        }

        // Si l'utilisateur est super admin, il peut voir tous les enregistrements
        if ($user->isSuperAdmin()) {
            // Si un filtre spécifique est demandé, on l'applique
            if ($request->filled('active')) {
                $active = filter_var($request->input('active'), FILTER_VALIDATE_BOOL);
                return $query->where('active', $active);
            }
            // Sinon, on retourne tout (actifs et inactifs)
            return $query;
        }

        // Pour les autres utilisateurs, on ne montre que les enregistrements actifs
        return $query->active();
    }

    /**
     * Applique le filtrage pour les relations
     */
    protected function applyActiveFilterToRelation(Builder $query, Request $request, string $relation): Builder
    {
        $user = $request->user();
        
        if (!$user || !$user->isSuperAdmin()) {
            return $query->whereHas($relation, function ($q) {
                $q->where('active', true);
            });
        }

        return $query;
    }

    /**
     * Vérifie si l'utilisateur peut voir les enregistrements inactifs
     */
    protected function canViewInactive(Request $request): bool
    {
        $user = $request->user();
        return $user && $user->isSuperAdmin();
    }

    /**
     * Vérifie si l'utilisateur peut supprimer (soft delete) des enregistrements
     */
    protected function canSoftDelete(Request $request): bool
    {
        $user = $request->user();
        return $user && $user->isAdmin();
    }

    /**
     * Vérifie si l'utilisateur peut restaurer des enregistrements
     */
    protected function canRestore(Request $request): bool
    {
        $user = $request->user();
        return $user && $user->isSuperAdmin();
    }
}
