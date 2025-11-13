import api from './api';

export interface Periode {
  id: number;
  nom: string;
  description?: string;
  date_debut: string;
  date_fin: string;
  annee_scolaire_id: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  annee_scolaire?: {
    id: number;
    nom: string;
    annee_debut: number;
    annee_fin: number;
    active: boolean;
  };
}

export interface CreatePeriodeData {
  nom: string;
  description?: string;
  date_debut: string;
  date_fin: string;
  annee_scolaire_id: number;
  active?: boolean;
}

class PeriodService {
  async getPeriodes(filters: any = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/v1/periodes?${params.toString()}`);
    return response.data;
  }

  async getActivePeriode() {
    const response = await api.get('/v1/periodes/active');
    return response.data;
  }

  async getPeriodesByAnneeScolaire(anneeScolaireId: number) {
    const response = await api.get(`/v1/annees-scolaires/${anneeScolaireId}/periodes`);
    return response.data;
  }

  async createPeriode(data: CreatePeriodeData) {
    const response = await api.post('/v1/periodes', data);
    return response.data;
  }

  async updatePeriode(id: number, data: Partial<CreatePeriodeData>) {
    const response = await api.put(`/v1/periodes/${id}`, data);
    return response.data;
  }

  async deletePeriode(id: number) {
    const response = await api.delete(`/v1/periodes/${id}`);
    return response.data;
  }
}

export default new PeriodService();
