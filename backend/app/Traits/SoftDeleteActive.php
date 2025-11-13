<?php

namespace App\Traits;

use Illuminate\Support\Facades\Schema;

trait SoftDeleteActive
{
    protected function hasActiveColumn(): bool
    {
        return Schema::hasColumn($this->getTable(), 'active');
    }

    /**
     * Scope pour récupérer seulement les enregistrements actifs
     */
    public function scopeActive($query)
    {
        if (!Schema::hasColumn($query->getModel()->getTable(), 'active')) {
            return $query;
        }

        return $query->where('active', true);
    }

    /**
     * Scope pour récupérer seulement les enregistrements inactifs (supprimés)
     */
    public function scopeInactive($query)
    {
        if (!Schema::hasColumn($query->getModel()->getTable(), 'active')) {
            return $query;
        }

        return $query->where('active', false);
    }

    /**
     * Scope pour récupérer tous les enregistrements (actifs et inactifs)
     * Utile pour les super admins
     */
    public function scopeWithInactive($query)
    {
        return $query; // Pas de filtre, retourne tout
    }

    /**
     * Marquer un enregistrement comme supprimé (soft delete)
     */
    public function softDelete()
    {
        if ($this->hasActiveColumn()) {
            $this->update(['active' => false]);
        } else {
            $this->delete();
        }
    }

    /**
     * Restaurer un enregistrement supprimé
     */
    public function restore()
    {
        if ($this->hasActiveColumn()) {
            $this->update(['active' => true]);
        }
    }

    /**
     * Vérifier si l'enregistrement est actif
     */
    public function isActive(): bool
    {
        if (!$this->hasActiveColumn()) {
            return true;
        }

        return $this->active === true;
    }

    /**
     * Vérifier si l'enregistrement est supprimé
     */
    public function isDeleted(): bool
    {
        if (!$this->hasActiveColumn()) {
            return false;
        }

        return $this->active === false;
    }
}
