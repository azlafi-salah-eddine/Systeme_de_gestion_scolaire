import type { 
  PaiementEleve,
  PaiementEleveFormData, 
  PaiementEleveResponse, 
  PaiementsEleveResponse, 
  StatistiquesPaiementsResponse 
} from '../types/paiements';
import api from './api';

class PaiementEleveService {
  private baseUrl = '/v1/paiements-eleves';

  async getPaiementsEleves(params?: {
    eleve_id?: number;
    mois?: string;
    statut?: string;
    type_frais?: string;
    classe_id?: number;
    niveau_id?: number;
    niveau?: string;
    frais_scolaire_id?: number;
    annee_scolaire_id?: number;
    search?: string;
    per_page?: number;
    page?: number;
  }): Promise<PaiementEleveResponse> {
    const response = await api.get(this.baseUrl, { params });
    return response.data;
  }

  async getPaiementEleve(id: number): Promise<{ success: boolean; data: PaiementEleve }> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async enregistrerPaiement(id: number, data: PaiementEleveFormData): Promise<{ success: boolean; data: PaiementEleve; message: string }> {
    const response = await api.post(`${this.baseUrl}/${id}/enregistrer-paiement`, data);
    return response.data;
  }

  async getPaiementsEleve(eleveId: number, params?: {
    mois?: string;
    type_frais?: string;
  }): Promise<PaiementsEleveResponse> {
    const response = await api.get(`/v1/eleves/${eleveId}/paiements`, { params });
    return response.data;
  }

  async getStatistiques(params?: {
    annee_scolaire_id?: number;
    mois?: string;
  }): Promise<StatistiquesPaiementsResponse> {
    const response = await api.get(`${this.baseUrl}/statistiques`, { params });
    return response.data;
  }

  // Méthodes utilitaires
  getStatutLabel(statut: string): string {
    const statuts: Record<string, string> = {
      'en_attente': 'En Attente',
      'partiel': 'Paiement Partiel',
      'regle': 'Réglé',
      'en_retard': 'En Retard'
    };
    return statuts[statut] || statut;
  }

  getStatutColor(statut: string): string {
    const colors: Record<string, string> = {
      'en_attente': 'bg-yellow-100 text-yellow-800',
      'partiel': 'bg-blue-100 text-blue-800',
      'regle': 'bg-blue-100 text-blue-800',
      'en_retard': 'bg-red-100 text-red-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  }

  getModePaiementLabel(mode: string): string {
    const modes: Record<string, string> = {
      'especes': 'Espèces',
      'virement': 'Virement',
      'cheque': 'Chèque'
    };
    return modes[mode] || mode;
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(montant);
  }

  formatMois(mois?: string | null): string {
    if (!mois) {
      return '—';
    }

    const parts = mois.split('-');
    if (parts.length !== 2) {
      return mois;
    }

    const [annee, moisNum] = parts;
    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const index = parseInt(moisNum, 10) - 1;
    if (Number.isNaN(index) || index < 0 || index >= moisNoms.length) {
      return `${moisNum}/${annee}`;
    }

    return `${moisNoms[index]} ${annee}`;
  }
}

export const paiementEleveService = new PaiementEleveService();
