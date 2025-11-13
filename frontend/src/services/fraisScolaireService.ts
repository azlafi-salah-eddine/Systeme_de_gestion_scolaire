import type { 
  FraisScolaire, 
  FraisScolaireFormData, 
  FraisScolaireResponse, 
  StatistiquesFraisResponse 
} from '../types/paiements';
import api from './api';

class FraisScolaireService {
  private baseUrl = '/v1/frais-scolaires';

  async getFraisScolaires(params?: {
    type?: string;
    niveau_id?: number;
    per_page?: number;
    page?: number;
  }): Promise<FraisScolaireResponse> {
    const response = await api.get(this.baseUrl, { params });
    return response.data;
  }

  async getFraisScolaire(id: number): Promise<{ success: boolean; data: FraisScolaire }> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createFraisScolaire(data: FraisScolaireFormData): Promise<{ success: boolean; data: FraisScolaire; message: string }> {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating frais scolaire:', error.response?.data);
      throw error;
    }
  }

  async updateFraisScolaire(id: number, data: Partial<FraisScolaireFormData>): Promise<{ success: boolean; data: FraisScolaire; message: string }> {
    const response = await api.put(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteFraisScolaire(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async genererPaiementsMensuels(mois: string, annee_scolaire_id?: number): Promise<{ success: boolean; message: string; data: { paiements_crees: number; mois: string } }> {
    const response = await api.post(`${this.baseUrl}/generer-paiements`, { mois, annee_scolaire_id });
    return response.data;
  }

  async getStatistiques(params?: {
    annee_scolaire_id?: number;
    mois?: string;
  }): Promise<StatistiquesFraisResponse> {
    const response = await api.get(`${this.baseUrl}/statistiques`, { params });
    return response.data;
  }

  // Méthodes utilitaires
  getTypeLabel(type: string): string {
    const types: Record<string, string> = {
      'scolarite': 'Frais de Scolarité',
      'cantine': 'Cantine',
      'transport': 'Transport'
    };
    return types[type] || type;
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'scolarite': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      'cantine': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      'transport': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
    };
    return colors[type] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(montant);
  }
}

export const fraisScolaireService = new FraisScolaireService();
