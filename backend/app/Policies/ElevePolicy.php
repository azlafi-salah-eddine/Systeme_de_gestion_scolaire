<?php

namespace App\Policies;

use App\Models\Eleve;
use App\Models\User;

class ElevePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->hasAnyRole(['professeur', 'parent']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Eleve $eleve): bool
    {
        // Admin peut voir tous les élèves
        if ($user->isAdmin()) {
            return true;
        }

        // Professeur peut voir les élèves de ses classes
        if ($user->hasRole('professeur')) {
            return $eleve->classe && $user->classes->contains($eleve->classe);
        }

        // Parent peut voir ses propres enfants
        if ($user->hasRole('parent')) {
            return $eleve->parents->contains('user_id', $user->id);
        }

        // Élève peut voir ses propres informations
        if ($user->hasRole('eleve')) {
            // Ici on devrait avoir une relation entre User et Eleve
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
    public function update(User $user, Eleve $eleve): bool
    {
        // Admin peut modifier tous les élèves
        if ($user->isAdmin()) {
            return true;
        }

        // Parent peut modifier ses propres enfants
        if ($user->hasRole('parent')) {
            return $eleve->parents->contains('user_id', $user->id);
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Eleve $eleve): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Eleve $eleve): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Eleve $eleve): bool
    {
        return $user->isAdmin();
    }
}
