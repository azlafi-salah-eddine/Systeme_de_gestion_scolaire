import type { Transport, Chauffeur, Accompagnateur } from '../types/eleve';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_V1 = `${API_BASE_URL}/v1`;

export interface TransportListResponse {
  data: Transport[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface TransportResponse {
  data: Transport;
  message?: string;
}

export interface TransportCreatePayload {
  ligne: string;
  matricule: string;
  capacite: number;
  chauffeur_id?: number;
  accompagnateur_id?: number;
}

export interface ChauffeurListResponse {
  data: Chauffeur[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface ChauffeurResponse {
  data: Chauffeur;
  message?: string;
}

export interface ChauffeurCreatePayload {
  nom: string;
  prenom: string;
  telephone: string;
  permis: string;
}

export interface AccompagnateurListResponse {
  data: Accompagnateur[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface AccompagnateurResponse {
  data: Accompagnateur;
  message?: string;
}

export interface AccompagnateurCreatePayload {
  nom: string;
  prenom: string;
  telephone: string;
}

class TransportService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_V1}${endpoint}`;

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

  // Transport methods
  async list(params?: { page?: number; per_page?: number; with?: string[] }): Promise<TransportListResponse> {
    const search = new URLSearchParams();
    if (params?.page) search.append('page', String(params.page));
    if (params?.per_page) search.append('per_page', String(params.per_page));
    if (params?.with?.length) search.append('with', params.with.join(','));
    const qs = search.toString();
    const endpoint = qs ? `/transports?${qs}` : '/transports';
    return this.request<TransportListResponse>(endpoint);
  }

  async show(id: number, include?: string[]): Promise<TransportResponse> {
    const qs = include && include.length ? `?with=${include.join(',')}` : '';
    return this.request<TransportResponse>(`/transports/${id}${qs}`);
    }

  async create(payload: TransportCreatePayload): Promise<TransportResponse> {
    return this.request<TransportResponse>('/transports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async update(id: number, payload: Partial<TransportCreatePayload>): Promise<TransportResponse> {
    return this.request<TransportResponse>(`/transports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/transports/${id}`, {
      method: 'DELETE',
    });
  }

  async inscrireEleve(transportId: number, eleveId: number): Promise<{ success: boolean; message: string }>{
    return this.request<{ success: boolean; message: string }>(`/transports/${transportId}/inscrire-eleve`, {
      method: 'POST',
      body: JSON.stringify({ eleve_id: eleveId }),
    });
  }

  async desinscrireEleve(transportId: number, eleveId: number): Promise<{ success: boolean; message: string }>{
    return this.request<{ success: boolean; message: string }>(`/transports/${transportId}/desinscrire-eleve/${eleveId}`, {
      method: 'DELETE',
    });
  }

  // Chauffeur methods
  async listChauffeurs(params?: { page?: number; per_page?: number }): Promise<ChauffeurListResponse> {
    const search = new URLSearchParams();
    if (params?.page) search.append('page', String(params.page));
    if (params?.per_page) search.append('per_page', String(params.per_page));
    const qs = search.toString();
    const endpoint = qs ? `/chauffeurs?${qs}` : '/chauffeurs';
    return this.request<ChauffeurListResponse>(endpoint);
  }

  async showChauffeur(id: number): Promise<ChauffeurResponse> {
    return this.request<ChauffeurResponse>(`/chauffeurs/${id}`);
  }

  async createChauffeur(payload: ChauffeurCreatePayload): Promise<ChauffeurResponse> {
    return this.request<ChauffeurResponse>('/chauffeurs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateChauffeur(id: number, payload: Partial<ChauffeurCreatePayload>): Promise<ChauffeurResponse> {
    return this.request<ChauffeurResponse>(`/chauffeurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async removeChauffeur(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/chauffeurs/${id}`, {
      method: 'DELETE',
    });
  }

  // Accompagnateur methods
  async listAccompagnateurs(params?: { page?: number; per_page?: number }): Promise<AccompagnateurListResponse> {
    const search = new URLSearchParams();
    if (params?.page) search.append('page', String(params.page));
    if (params?.per_page) search.append('per_page', String(params.per_page));
    const qs = search.toString();
    const endpoint = qs ? `/accompagnateurs?${qs}` : '/accompagnateurs';
    return this.request<AccompagnateurListResponse>(endpoint);
  }

  async showAccompagnateur(id: number): Promise<AccompagnateurResponse> {
    return this.request<AccompagnateurResponse>(`/accompagnateurs/${id}`);
  }

  async createAccompagnateur(payload: AccompagnateurCreatePayload): Promise<AccompagnateurResponse> {
    return this.request<AccompagnateurResponse>('/accompagnateurs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateAccompagnateur(id: number, payload: Partial<AccompagnateurCreatePayload>): Promise<AccompagnateurResponse> {
    return this.request<AccompagnateurResponse>(`/accompagnateurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async removeAccompagnateur(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/accompagnateurs/${id}`, {
      method: 'DELETE',
    });
  }
}

export const transportService = new TransportService();
export default transportService;
