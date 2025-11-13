import type { Cantine } from '../types/eleve';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface CantineListResponse {
  data: Cantine[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface CantineResponse {
  data: Cantine;
  message?: string;
}

export interface CantineCreatePayload {
  nom: string;
  capacite: number;
  localisation: string;
}

class CantineService {
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

  async list(params?: { page?: number; per_page?: number; with?: string[] }): Promise<CantineListResponse> {
    const search = new URLSearchParams();
    if (params?.page) search.append('page', String(params.page));
    if (params?.per_page) search.append('per_page', String(params.per_page));
    if (params?.with?.length) search.append('with', params.with.join(','));
    const qs = search.toString();
    const endpoint = qs ? `/cantines?${qs}` : '/cantines';
    return this.request<CantineListResponse>(endpoint);
  }

  async show(id: number, include?: string[]): Promise<CantineResponse> {
    const qs = include && include.length ? `?with=${include.join(',')}` : '';
    return this.request<CantineResponse>(`/cantines/${id}${qs}`);
  }

  async create(payload: CantineCreatePayload): Promise<CantineResponse> {
    return this.request<CantineResponse>('/cantines', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async update(id: number, payload: Partial<CantineCreatePayload>): Promise<CantineResponse> {
    return this.request<CantineResponse>(`/cantines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/cantines/${id}`, {
      method: 'DELETE',
    });
  }

  async inscrireEleve(cantineId: number, eleveId: number): Promise<{ success: boolean; message: string }>{
    return this.request<{ success: boolean; message: string }>(`/cantines/${cantineId}/inscrire-eleve`, {
      method: 'POST',
      body: JSON.stringify({ eleve_id: eleveId }),
    });
  }

  async desinscrireEleve(cantineId: number, eleveId: number): Promise<{ success: boolean; message: string }>{
    return this.request<{ success: boolean; message: string }>(`/cantines/${cantineId}/desinscrire-eleve/${eleveId}`, {
      method: 'DELETE',
    });
  }
}

export const cantineService = new CantineService();
export default cantineService;


