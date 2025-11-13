import api from './api';

export interface Salle {
  id: number;
  nom: string;
  capacite: number;
  type: 'classe' | 'laboratoire' | 'bibliotheque' | 'salle_informatique' | 'salle_art' | 'gymnase' | 'cantine' | 'bureau';
  localisation?: string;
  equipements?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const salleService = {
  async list(params?: { active?: boolean; type?: Salle['type'] }): Promise<{ success: boolean; data: Salle[] }> {
    const res = await api.get('/v1/salles', { params });
    return res.data;
  },
  async create(payload: Omit<Salle, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data: Salle }> {
    const res = await api.post('/v1/salles', payload);
    return res.data;
  },
  async show(id: number): Promise<{ success: boolean; data: Salle }> {
    const res = await api.get(`/v1/salles/${id}`);
    return res.data;
  },
  async update(id: number, payload: Partial<Omit<Salle, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; data: Salle }> {
    const res = await api.put(`/v1/salles/${id}`, payload);
    return res.data;
  },
  async remove(id: number): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/v1/salles/${id}`);
    return res.data;
  },
  async restore(id: number): Promise<{ success: boolean; message: string }> {
    const res = await api.post(`/v1/salles/${id}/restore`);
    return res.data;
  },
};


