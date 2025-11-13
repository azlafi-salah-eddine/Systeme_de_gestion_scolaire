import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

export interface AnneeScolaire {
  id: number;
  nom: string;
  date_debut: string;
  date_fin: string;
  active: boolean; // soft delete visibility
  description?: string;
  created_at: string;
  updated_at: string;
  // Accessors pour compatibilité (calculés depuis nom ou date_debut/date_fin)
  annee_debut?: number;
  annee_fin?: number;
}

interface AnneeScolaireContextType {
  anneeActive: AnneeScolaire | null;
  anneesScolaires: AnneeScolaire[];
  loading: boolean;
  error: string | null;
  refreshAnneeActive: () => Promise<void>;
  refreshAnneesScolaires: () => Promise<void>;
  activerAnneeScolaire: (id: number) => Promise<boolean>;
  createAnneeScolaire: (data: { annee_debut: number; annee_fin: number }) => Promise<boolean>;
  updateAnneeScolaire: (id: number, data: { annee_debut: number; annee_fin: number }) => Promise<boolean>;
  deleteAnneeScolaire: (id: number) => Promise<boolean>;
}

const AnneeScolaireContext = createContext<AnneeScolaireContextType | undefined>(undefined);

interface AnneeScolaireProviderProps {
  children: ReactNode;
}

export const AnneeScolaireProvider: React.FC<AnneeScolaireProviderProps> = ({ children }) => {
  const [anneeActive, setAnneeActive] = useState<AnneeScolaire | null>(null);
  const [anneesScolaires, setAnneesScolaires] = useState<AnneeScolaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // Safely get notification functions with fallback
  let showSuccess = () => {};
  let showError = () => {};
  let showWarning = () => {};
  
  try {
    const notificationContext = useNotification();
    showSuccess = notificationContext.showSuccess;
    showError = notificationContext.showError;
    showWarning = notificationContext.showWarning;
  } catch (error) {
    // Notification context not available, use no-op functions
  }

  // Charger l'année scolaire active
  const refreshAnneeActive = async () => {
    try {
      setError(null);
      const response = await api.get('/v1/annees-scolaires/active');
      
      if (response.data.success) {
        setAnneeActive(response.data.data);
      } else {
        setAnneeActive(null);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setAnneeActive(null);
        setError(null);
        return;
      }
      if (err?.response?.status === 401) {
        setAnneeActive(null);
        setError(null);
        return;
      }
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'année active');
      setAnneeActive(null);
    }
  };

  // Charger les années scolaires accessibles selon les relations de l'utilisateur
  const refreshAnneesScolaires = async () => {
    try {
      setError(null);
      // Utiliser with-statut pour obtenir les années selon les relations (admin/prof voient leur année active + années où ils ont des relations)
      const response = await api.get('/v1/annees-scolaires/with-statut');
      if (response.data.success) {
        setAnneesScolaires(response.data.data);
      }
    } catch (err: any) {
      // Ignorer les erreurs 401 (non authentifié) et 403 (accès refusé)
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setAnneesScolaires([]);
        setError(null);
        return;
      }
      setError(err.response?.data?.message || 'Erreur lors du chargement des années scolaires');
    }
  };

  // Activer une année scolaire (méthode désactivée)
  // L'année actuelle est déterminée automatiquement par la date système
  // active = true/false est utilisé SEULEMENT pour soft delete
  const activerAnneeScolaire = async (id: number): Promise<boolean> => {
    // Cette méthode n'est plus utilisée
    // L'année actuelle est déterminée automatiquement par getCurrent() basée sur la date système
    showError('Information', 'L\'année scolaire actuelle est déterminée automatiquement par la date système. Utilisez les dates (date_debut, date_fin) pour définir la période de l\'année scolaire.');
    return false;
  };

  const createAnneeScolaire = async (data: { nom: string; date_debut: string; date_fin: string; description?: string }): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.post('/v1/annees-scolaires', data);
      if (response.data.success) {
        await refreshAnneesScolaires();
        showSuccess('Création réussie','L\'année scolaire a été créée avec succès.');
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.response?.status === 422) {
        const errors = err.response?.data?.errors;
        if (errors) {
          const errorMessages = Object.values(errors).flat().join(', ');
          showError('Erreur de validation', errorMessages);
        } else {
          showError('Erreur de validation', err.response?.data?.message || 'Les données fournies ne sont pas valides.');
        }
      } else {
        showError('Erreur de création', err.response?.data?.message || 'Une erreur est survenue lors de la création de l\'année scolaire.');
      }
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'année scolaire');
      return false;
    }
  };

  const updateAnneeScolaire = async (id: number, data: { nom: string; date_debut: string; date_fin: string; description?: string }): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.put(`/v1/annees-scolaires/${id}`, data);
      if (response.data.success) {
        await Promise.all([refreshAnneeActive(), refreshAnneesScolaires()]);
        showSuccess('Mise à jour réussie','L\'année scolaire a été mise à jour avec succès.');
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.response?.status === 422) {
        const errors = err.response?.data?.errors;
        if (errors) {
          const errorMessages = Object.values(errors).flat().join(', ');
          showError('Erreur de validation', errorMessages);
        } else {
          showError('Erreur de validation', err.response?.data?.message || 'Les données fournies ne sont pas valides.');
        }
      } else {
        showError('Erreur de mise à jour', err.response?.data?.message || 'Une erreur est survenue lors de la mise à jour de l\'année scolaire.');
      }
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour de l\'année scolaire');
      return false;
    }
  };

  const deleteAnneeScolaire = async (id: number): Promise<boolean> => {
    try {
      setError(null);
      const response = await api.delete(`/v1/annees-scolaires/${id}`);
      if (response.data.success) {
        await refreshAnneesScolaires();
        showSuccess('Suppression réussie','L\'année scolaire a été supprimée avec succès.');
        return true;
      }
      return false;
    } catch (err: any) {
      if (err.response?.status === 422) {
        const errorMessage = err.response?.data?.message || 'Impossible de supprimer cette année scolaire';
        if (errorMessage.includes('active') || errorMessage.includes('actif')) {
          showError('Suppression impossible','Impossible de supprimer l\'année scolaire active. Veuillez d\'abord activer une autre année.');
        } else {
          showError('Suppression impossible', errorMessage);
        }
      } else if (err.response?.status === 404) {
        showError('Année scolaire introuvable','L\'année scolaire que vous essayez de supprimer n\'existe pas.');
      } else if (err.response?.status === 403) {
        showError('Accès refusé','Vous n\'avez pas les permissions nécessaires pour supprimer cette année scolaire.');
      } else {
        showError('Erreur de suppression', err.response?.data?.message || 'Une erreur est survenue lors de la suppression de l\'année scolaire.');
      }
      setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'année scolaire');
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (isAuthLoading) {
        return;
      }
      
      setLoading(true);
      if (isAuthenticated) {
        await Promise.all([refreshAnneeActive(), refreshAnneesScolaires()]);
      } else {
        setAnneeActive(null);
        setAnneesScolaires([]);
        setError(null);
      }
      setLoading(false);
    };

    loadData();
  }, [isAuthenticated, isAuthLoading]);

  const value: AnneeScolaireContextType = {
    anneeActive,
    anneesScolaires,
    loading,
    error,
    refreshAnneeActive,
    refreshAnneesScolaires,
    activerAnneeScolaire,
    createAnneeScolaire,
    updateAnneeScolaire,
    deleteAnneeScolaire,
  };

  return (
    <AnneeScolaireContext.Provider value={value}>
      {children}
    </AnneeScolaireContext.Provider>
  );
};

export const useAnneeScolaire = (): AnneeScolaireContextType => {
  const context = useContext(AnneeScolaireContext);
  if (context === undefined) {
    throw new Error('useAnneeScolaire must be used within an AnneeScolaireProvider');
  }
  return context;
};