<?php

namespace App\Policies;

use App\Models\User;
use App\Models\AnneeScolaire;

class AnneeScolairePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Seuls les super administrateurs peuvent voir la liste des années scolaires
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, AnneeScolaire $anneeScolaire): bool
    {
        // Seuls les super administrateurs peuvent voir une année scolaire
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Seuls les super administrateurs peuvent créer des années scolaires
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, AnneeScolaire $anneeScolaire): bool
    {
        // Seuls les super administrateurs peuvent modifier des années scolaires
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, AnneeScolaire $anneeScolaire): bool
    {
        // Seuls les super administrateurs peuvent supprimer des années scolaires
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can activate the model.
     */
    public function activate(User $user, AnneeScolaire $anneeScolaire): bool
    {
        // Seuls les super administrateurs peuvent activer des années scolaires
        return $user->isSuperAdmin();
    }

    /**
     * Determine whether the user can view statistics.
     */
    public function viewStatistics(User $user, AnneeScolaire $anneeScolaire): bool
    {
        // Seuls les super administrateurs peuvent voir les statistiques
        return $user->isSuperAdmin();
    }
}
