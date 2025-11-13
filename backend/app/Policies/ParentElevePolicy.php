<?php

namespace App\Policies;

use App\Models\ParentEleve;
use App\Models\User;

class ParentElevePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ParentEleve $parent): bool
    {
        // Admin peut voir tous les parents
        if ($user->isAdmin()) {
            return true;
        }

        // Parent peut voir ses propres informations
        if ($user->hasRole('parent')) {
            // Ici on devrait avoir une relation entre User et ParentEleve
            // Pour l'instant, on retourne false
            return false;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ParentEleve $parent): bool
    {
        // Admin peut modifier tous les parents
        if ($user->isAdmin()) {
            return true;
        }

        // Parent peut modifier ses propres informations
        if ($user->hasRole('parent')) {
            // Ici on devrait avoir une relation entre User et ParentEleve
            // Pour l'instant, on retourne false
            return false;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ParentEleve $parent): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ParentEleve $parent): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, ParentEleve $parent): bool
    {
        return $user->isAdmin();
    }
}
