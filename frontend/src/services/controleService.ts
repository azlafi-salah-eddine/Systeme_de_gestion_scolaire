import api from './api';

export interface Controle {
  id: number;
  libelle: string;
  debut_controle: string;
  fin_controle: string;
  matiere_id: number;
  professeur_id: number;
  periode_id: number;
  instructions?: string;
  active: boolean;
  matiere?: {
    id: number;
    nom: string;
    code: string;
    niveau?: {
      id: number;
      nom: string;
    };
  };
  professeur?: {
    id: number;
    nom: string;
    prenom: string;
    diplome?: string;
    anciennete?: number;
    telephone?: string;
    email?: string;
    adresse?: string;
    date_embauche?: string;
    salaire?: string;
    active: boolean;
    created_at: string;
    updated_at: string;
  };
  periode?: {
    id: number;
    nom: string;
    date_debut: string;
    date_fin: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateControleData {
  libelle: string;
  debut_controle: string;
  fin_controle: string;
  matiere_id: number;
  professeur_id: number;
  periode_id: number;
  annee_scolaire_id?: number;
  instructions?: string;
  active?: boolean;
}

export interface UpdateControleData extends Partial<CreateControleData> {
  id: number;
}

class ControleService {
  async getControles(): Promise<{ success: boolean; data: Controle[]; message?: string }> {
    return this.request('/v1/controles');
  }

  async getControlesForClasse(classeId: number): Promise<{ success: boolean; data: Controle[]; message?: string }> {
    return this.request(`/v1/classes/${classeId}/controles`);
  }

  async getControle(id: number): Promise<{ success: boolean; data: Controle; message?: string }> {
    return this.request(`/v1/controles/${id}`);
  }

  async createControle(data: CreateControleData): Promise<{ success: boolean; data: Controle; message?: string }> {
    return this.request('/v1/controles', {
      method: 'POST',
      data
    });
  }

  async updateControle(id: number, data: Partial<CreateControleData>): Promise<{ success: boolean; data: Controle; message?: string }> {
    return this.request(`/v1/controles/${id}`, {
      method: 'PUT',
      data
    });
  }

  async deleteControle(id: number): Promise<{ success: boolean; message?: string }> {
    return this.request(`/v1/controles/${id}`, {
      method: 'DELETE'
    });
  }

  private async request(url: string, options: any = {}): Promise<any> {
    try {
      const response = await api.request({
        url,
        ...options
      });
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || error.message || 'Une erreur est survenue'
      };
    }
  }
}

export const controleService = new ControleService();
