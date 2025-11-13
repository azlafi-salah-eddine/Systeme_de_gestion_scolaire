import api from './api';

export interface AnneeScolaire {
  id: number;
  nom: string;
  date_debut: string;
  date_fin: string;
  active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
  // Accessors pour compatibilité (calculés depuis nom ou date_debut/date_fin)
  annee_debut?: number;
  annee_fin?: number;
}

export interface AnneeScolaireCreateData {
  nom: string;
  date_debut: string;
  date_fin: string;
  description?: string;
}

export interface AnneeScolaireUpdateData {
  nom: string;
  date_debut: string;
  date_fin: string;
  description?: string;
}

export interface AnneeScolaireStatistics {
  id: number;
  nom: string;
  active: boolean;
  classes_count: number;
  eleves_count: number;
  paiements_count: number;
  notes_count: number;
  created_at: string;
  updated_at: string;
}

export const anneeScolaireService = {
  // Récupérer toutes les années scolaires
  async getAll(): Promise<AnneeScolaire[]> {
    const response = await api.get('/v1/annees-scolaires');
    return response.data.data;
  },

  // Récupérer l'année scolaire active
  async getActive(): Promise<AnneeScolaire | null> {
    try {
      const response = await api.get('/v1/annees-scolaires/active');
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Récupérer les années scolaires avec statut = 1 (accessible à tous les utilisateurs authentifiés)
  async getWithStatut(): Promise<AnneeScolaire[]> {
    const response = await api.get('/v1/annees-scolaires/with-statut');
    return response.data.data;
  },

  // Récupérer une année scolaire par ID
  async getById(id: number): Promise<AnneeScolaire> {
    const response = await api.get(`/v1/annees-scolaires/${id}`);
    return response.data.data;
  },

  // Créer une nouvelle année scolaire
  async create(data: AnneeScolaireCreateData): Promise<AnneeScolaire> {
    const response = await api.post('/v1/annees-scolaires', data);
    return response.data.data;
  },

  // Mettre à jour une année scolaire
  async update(id: number, data: AnneeScolaireUpdateData): Promise<AnneeScolaire> {
    const response = await api.put(`/v1/annees-scolaires/${id}`, data);
    return response.data.data;
  },

  // Supprimer une année scolaire
  async delete(id: number): Promise<void> {
    await api.delete(`/v1/annees-scolaires/${id}`);
  },

  // Activer une année scolaire
  async activate(id: number): Promise<AnneeScolaire> {
    const response = await api.put(`/v1/annees-scolaires/${id}/activer`);
    return response.data.data;
  },

  // Récupérer les statistiques d'une année scolaire
  async getStatistics(id: number): Promise<AnneeScolaireStatistics> {
    const response = await api.get(`/v1/annees-scolaires/${id}/statistics`);
    return response.data.data;
  },
};
