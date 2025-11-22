import { cleanJsonResponse } from './api';

export interface Absence {
  id: number;
  eleve_id: number;
  date: string;
  motif: string;
  justifie: boolean;
  created_at: string;
  updated_at: string;
  professeur_id?: number;
  heure_debut?: string;
  heure_fin?: string;
  justification?: string;
  piece_jointe?: string;
  matiere_id?: number;
  active: boolean;
  // Relations optionnelles
  eleve?: {
    id: number;
    nom: string;
    prenom: string;
    nom_fr?: string;
    prenom_fr?: string;
    matricule?: string;
    date_naissance?: string;
    sexe?: string;
    nationalite?: string;
    telephone_urgence?: string;
    personne_urgence?: string;
    classe?: {
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
  };
  matiere?: {
    id: number;
    nom: string;
    code?: string;
    description?: string;
  };
}

export interface ConsecutiveAbsenceGroup {
  dates: string[];
  count: number;
  start_date: string;
  end_date: string;
  absences: Absence[];
}

export interface AbsencePayload {
  eleve_id: number;
  date: string;
  motif: string;
  justifie?: boolean;
  professeur_id?: number;
  heure_debut?: string;
  heure_fin?: string;
  justification?: string;
  piece_jointe?: string;
  matiere_id?: number;
  active?: boolean;
}

// Use relative base to work with Vite proxy and preserve cookies
const API_BASE_URL = '/api';

class AbsenceService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/v1${endpoint}`;
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
    };
    const response = await fetch(url, { ...defaultOptions, ...options });
    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const text = await response.text();
        const clean = text.replace(/^\uFEFF/, '');
        if (clean) {
          try {
            const json = JSON.parse(clean);
            message = json.message || json.error || message;
            if (response.status === 422 && json.errors) {
              const fields = Object.values(json.errors).flat() as string[];
              message = fields.join(' | ') || message;
            }
          } catch {
            message = `${message} · ${clean.substring(0, 200)}...`;
          }
        }
      } catch {}
      throw new Error(message);
    }
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Expected JSON but got ${contentType || 'unknown'} · ${text.substring(0, 200)}...`);
    }
    const bodyText = await response.text();
    const cleanText = bodyText.replace(/^\uFEFF/, '');
    if (!cleanText.trim()) throw new Error('Empty response');
    return JSON.parse(cleanText);
  }

  async list(params?: { page?: number; per_page?: number; search?: string; justifie?: boolean; with?: string[] }): Promise<{ success: boolean; data: Absence[]; meta?: any }> {
    const qp = new URLSearchParams();
    if (params?.page) qp.set('page', String(params.page));
    if (params?.per_page) qp.set('per_page', String(params.per_page));
    if (params?.search) qp.set('search', params.search);
    if (params?.justifie !== undefined) qp.set('justifie', String(params.justifie));
    if (params?.with && params.with.length) qp.set('with', params.with.join(','));
    return this.request(`/absences?${qp.toString()}`);
  }

  async show(id: number): Promise<{ success: boolean; data: Absence }> {
    return this.request(`/absences/${id}`);
  }

  async create(payload: AbsencePayload): Promise<{ success: boolean; data: Absence; message?: string }> {
    return this.request('/absences', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async update(id: number, payload: Partial<AbsencePayload>): Promise<{ success: boolean; data: Absence; message?: string }> {
    return this.request(`/absences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/absences/${id}`, { method: 'DELETE' });
  }

  async justify(id: number, justification: string, pieceJointe?: File, justifyConsecutive: boolean = false): Promise<{ success: boolean; data: Absence | Absence[]; message?: string }> {
    const formData = new FormData();
    formData.append('justification', justification);
    formData.append('justifie', 'true');
    
    // N'envoyer justify_consecutive que si c'est true
    if (justifyConsecutive) {
      formData.append('justify_consecutive', '1');
    }
    
    if (pieceJointe) {
      formData.append('piece_jointe', pieceJointe);
    }

    const url = `${API_BASE_URL}/v1/absences/${id}/justify`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Nettoyer la réponse JSON avant de la parser
    const text = await response.text();
    const cleanText = cleanJsonResponse(text);
    
    try {
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('Erreur de parsing JSON:', error);
      console.error('Contenu reçu:', cleanText);
      throw new Error('Réponse JSON invalide du serveur');
    }
  }

  async getConsecutiveAbsences(id: number): Promise<{ success: boolean; data: Absence[]; message?: string }> {
    return this.request(`/absences/${id}/consecutive`);
  }

  async detectConsecutiveAbsences(eleveId: number): Promise<{ success: boolean; data: ConsecutiveAbsenceGroup[]; message?: string }> {
    const qp = new URLSearchParams();
    qp.set('eleve_id', String(eleveId));
    return this.request(`/absences/consecutive-detection?${qp.toString()}`);
  }

  async unjustify(id: number): Promise<{ success: boolean; data: Absence; message?: string }> {
    return this.request(`/absences/${id}/unjustify`, { method: 'POST' });
  }

  async export(filters?: { justifie?: boolean; dateFrom?: string; dateTo?: string }, format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    const qp = new URLSearchParams();
    if (filters?.justifie !== undefined) qp.set('justifie', String(filters.justifie));
    if (filters?.dateFrom) qp.set('dateFrom', filters.dateFrom);
    if (filters?.dateTo) qp.set('dateTo', filters.dateTo);
    qp.set('format', format);

    const url = `${API_BASE_URL}/v1/absences/export?${qp.toString()}`;
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.blob();
  }

  async stats(period?: 'week' | 'month' | 'year'): Promise<{ success: boolean; data: any }> {
    const qp = new URLSearchParams();
    if (period) qp.set('period', period);
    return this.request(`/absences/stats?${qp.toString()}`);
  }
}

export const absenceService = new AbsenceService();