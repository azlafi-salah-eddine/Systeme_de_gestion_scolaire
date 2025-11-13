import api from './api';

export type NiveauItem = {
  id: number;
  nom: string;
  description?: string | null;
  bareme?: number;
  active?: boolean;
}

class NiveauService {
  async getNiveaux(): Promise<{ data: NiveauItem[] }> {
    const response = await api.get('/v1/niveaux');
    return response.data;
  }

  async getNiveau(id: number): Promise<{ data: NiveauItem }> {
    const response = await api.get(`/v1/niveaux/${id}`);
    return response.data;
  }

  async createNiveau(payload: Partial<NiveauItem>): Promise<{ data: NiveauItem }> {
    const response = await api.post('/v1/niveaux', payload);
    return response.data;
  }

  async updateNiveau(id: number, payload: Partial<NiveauItem>): Promise<{ data: NiveauItem }> {
    const response = await api.put(`/v1/niveaux/${id}`, payload);
    return response.data;
  }

  async deleteNiveau(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/v1/niveaux/${id}`);
    return response.data;
  }

  // Méthodes de compatibilité avec l'ancien code
  async list(): Promise<NiveauItem[]> {
    const res = await this.getNiveaux();
    return res.data;
  }

  async show(id: number): Promise<NiveauItem> {
    const res = await this.getNiveau(id);
    return res.data;
  }

  async create(payload: Partial<NiveauItem>): Promise<NiveauItem> {
    const res = await this.createNiveau(payload);
    return res.data;
  }

  async update(id: number, payload: Partial<NiveauItem>): Promise<NiveauItem> {
    const res = await this.updateNiveau(id, payload);
    return res.data;
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    return this.deleteNiveau(id);
  }
}

export default new NiveauService();