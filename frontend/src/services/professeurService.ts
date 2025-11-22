export interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  nom_complet?: string;
  diplome?: string;
  anciennete?: number;
  telephone?: string;
  email?: string;
  adresse?: string;
  date_embauche?: string;
  salaire?: number;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Optional relations when requested
  classes?: Array<{ id: number; nom?: string; nom_complet?: string }>;
}

export interface ProfesseurPayload {
  nom: string;
  prenom: string;
  diplome?: string;
  anciennete?: number;
  telephone?: string;
  email?: string;
  adresse?: string;
  date_embauche?: string;
  salaire?: number;
  active?: boolean;
}

// Use relative base to work with Vite proxy and preserve cookies
const API_BASE_URL = '/api';

class ProfesseurService {
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

  async list(params?: { page?: number; per_page?: number; search?: string; active?: boolean; with?: string[] }): Promise<{ success: boolean; data: Professeur[]; meta?: any }> {
    const qp = new URLSearchParams();
    if (params?.page) qp.set('page', String(params.page));
    if (params?.per_page) qp.set('per_page', String(params.per_page));
    if (params?.search) qp.set('search', params.search);
    if (params?.active !== undefined) qp.set('active', String(params.active));
    if (params?.with && params.with.length) qp.set('with', params.with.join(','));
    return this.request(`/professeurs?${qp.toString()}`);
  }

  async listForTimetable(): Promise<{ success: boolean; data: Professeur[] }> {
    return this.request('/professeurs-list');
  }

  async show(id: number): Promise<{ success: boolean; data: Professeur }> {
    return this.request(`/professeurs/${id}`);
  }

  async create(payload: ProfesseurPayload): Promise<{ success: boolean; data: Professeur; message?: string }> {
    return this.request('/professeurs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async update(id: number, payload: Partial<ProfesseurPayload>): Promise<{ success: boolean; data: Professeur; message?: string }> {
    return this.request(`/professeurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/professeurs/${id}`, { method: 'DELETE' });
  }

  async restore(id: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/professeurs/${id}/restore`, { method: 'POST' });
  }
};
export const professeurService = new ProfesseurService();

