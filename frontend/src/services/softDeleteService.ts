import api from './api';

export interface SoftDeleteResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface DeletedRecord {
  id: number;
  model: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface DeletedRecordsResponse {
  success: boolean;
  model: string;
  data: DeletedRecord[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface DeletedStatsResponse {
  success: boolean;
  stats: Record<string, number>;
  total: number;
}

class SoftDeleteService {
  /**
   * Lister les enregistrements supprimés par modèle
   */
  async getDeletedRecords(model: string, page: number = 1, perPage: number = 15): Promise<DeletedRecordsResponse> {
    const response = await api.get(`/deleted?model=${model}&per_page=${perPage}&page=${page}`);
    return response.data;
  }

  /**
   * Obtenir les statistiques des enregistrements supprimés
   */
  async getDeletedStats(): Promise<DeletedStatsResponse> {
    const response = await api.get('/deleted/stats');
    return response.data;
  }

  async showDeleted(model: string, id: number): Promise<any> {
    const response = await api.get(`/deleted/show`, { params: { model, id } });
    return response.data?.data;
  }

  /**
   * Restaurer un enregistrement supprimé
   */
  async restoreRecord(model: string, id: number): Promise<SoftDeleteResponse> {
    const response = await api.post('/deleted/restore', { model, id });
    return response.data;
  }

  /**
   * Supprimer définitivement un enregistrement
   */
  async forceDeleteRecord(model: string, id: number): Promise<SoftDeleteResponse> {
    const response = await api.delete('/deleted/force-delete', { 
      data: { model, id } 
    });
    return response.data;
  }

  /**
   * Restaurer un utilisateur spécifique
   */
  async restoreUser(userId: number): Promise<SoftDeleteResponse> {
    const response = await api.post(`/users/${userId}/restore`);
    return response.data;
  }

  /**
   * Soft delete d'un enregistrement (via les services existants)
   */
  async softDelete(model: string, id: number): Promise<SoftDeleteResponse> {
    // Cette méthode sera utilisée par les services existants
    // qui appelleront les endpoints de suppression normaux
    // Le backend se chargera de faire le soft delete
    const response = await api.delete(`/${model}/${id}`);
    return response.data;
  }
}

export const softDeleteService = new SoftDeleteService();
export default softDeleteService;
