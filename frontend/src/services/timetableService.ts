// Use relative base to work with Vite proxy and preserve cookies
const API_BASE_URL = '/api';

export interface TimetableItem {
  id: number;
  classe_id: number;
  professeur_id: number;
  matiere_id: number;
  discipline_id?: number;
  salle_id: number;
  jour: 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';
  heure_debut: string; // HH:mm
  heure_fin: string;   // HH:mm
  couleur?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;

  // Convenience fields when backend loads relations
  classe_nom?: string;
  matiere_nom?: string;
  matiere_couleur?: string;
  discipline_nom?: string;
  professeur_nom?: string;
  salle_nom?: string;
  
  // Status fields for checking if elements are active
  matiere_active?: boolean;
  discipline_active?: boolean;
  professeur_active?: boolean;
  salle_active?: boolean;
  classe_active?: boolean;
}

export interface TimetableListResponse {
  success: boolean;
  data: TimetableItem[];
  meta?: any;
}

class TimetableService {
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

  async list(params?: { page?: number; per_page?: number; jour?: TimetableItem['jour']; classe_id?: number; professeur_id?: number }): Promise<TimetableListResponse> {
    const qp = new URLSearchParams();
    if (params?.page) qp.set('page', String(params.page));
    if (params?.per_page) qp.set('per_page', String(params.per_page));
    if (params?.jour) qp.set('jour', params.jour);
    if (params?.classe_id) qp.set('classe_id', String(params.classe_id));
    if (params?.professeur_id) qp.set('professeur_id', String(params.professeur_id));
    return this.request(`/emplois-du-temps?${qp.toString()}`);
  }

  async byClasse(classeId: number, params?: { annee_scolaire_id?: number }): Promise<{ success: boolean; data: TimetableItem[] }> {
    const qp = new URLSearchParams();
    if (params?.annee_scolaire_id) {
      qp.set('annee_scolaire_id', String(params.annee_scolaire_id));
    }
    const queryString = qp.toString();
    return this.request(`/classes/${classeId}/emplois-du-temps${queryString ? `?${queryString}` : ''}`);
  }

  async removeByClasse(classeId: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/classes/${classeId}/emplois-du-temps`, { method: 'DELETE' });
  }

  async byProfesseur(professeurId: number): Promise<{ success: boolean; data: TimetableItem[] }> {
    return this.request(`/professeurs/${professeurId}/emplois-du-temps`);
  }

  async create(payload: Omit<TimetableItem, 'id' | 'created_at' | 'updated_at' | 'active'>): Promise<{ success: boolean; message: string; data: TimetableItem }> {
    return this.request('/emplois-du-temps', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async update(id: number, payload: Partial<Omit<TimetableItem, 'id' | 'created_at' | 'updated_at'>>): Promise<{ success: boolean; message: string; data: TimetableItem }> {
    return this.request(`/emplois-du-temps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/emplois-du-temps/${id}`, { method: 'DELETE' });
  }

  async restore(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/emplois-du-temps/${id}/restore`, { method: 'POST' });
  }
}

export const timetableService = new TimetableService();