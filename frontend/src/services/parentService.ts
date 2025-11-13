// Use relative base to work with Vite proxy and preserve cookies
const API_BASE_URL = '/api';

export interface ParentEleve {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  profession?: string;
  type: 'pere' | 'mere' | 'tuteur';
  created_at?: string;
  updated_at?: string;
}

export interface ParentPayload {
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  profession?: string;
  type: 'pere' | 'mere' | 'tuteur';
}

class ParentService {
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

  async list(params?: { page?: number; per_page?: number; q?: string }): Promise<{ data: ParentEleve[]; meta?: any }> {
    const qp = new URLSearchParams();
    if (params?.page) qp.set('page', String(params.page));
    if (params?.per_page) qp.set('per_page', String(params.per_page));
    if (params?.q) qp.set('q', params.q);
    // Backend returns resource collection with data/meta or directly wraps
    return this.request(`/parents?${qp.toString()}`);
  }

  async show(id: number): Promise<{ parent: ParentEleve }> {
    return this.request(`/parents/${id}`);
  }

  async create(payload: ParentPayload): Promise<{ message: string; parent: ParentEleve }> {
    return this.request('/parents', { method: 'POST', body: JSON.stringify(payload) });
  }

  async update(id: number, payload: Partial<ParentPayload>): Promise<{ message: string; parent: ParentEleve }> {
    return this.request(`/parents/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async remove(id: number): Promise<{ message: string }> {
    return this.request(`/parents/${id}`, { method: 'DELETE' });
  }

  async restore(id: number): Promise<{ message: string }> {
    return this.request(`/parents/${id}/restore`, { method: 'POST' });
  }

  async eleves(id: number): Promise<{ eleves: Array<any> }> {
    return this.request(`/parents/${id}/eleves`);
  }
}

export const parentService = new ParentService();
