// Use relative base to work with Vite proxy and preserve cookies
const API_BASE_URL = '/api';

export interface MatiereFormInput {
  nom: string;
  code: string;
  coleur?: string;
  description?: string;
  coefficient?: number;
  niveau_id?: number;
  active?: boolean;
}

class MatiereService {
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

  async getAll(): Promise<any[]> {
    const response = await this.request('/matieres');
    return (response as any).data ?? response;
  }

  async getActive(): Promise<any | null> {
    try {
      const response = await this.request('/matieres-list');
      return (response as any).data ?? response;
    } catch (error: any) {
      if (String(error?.message || '').includes('404')) return null;
      throw error;
    }
  }


  async create(payload: MatiereFormInput): Promise<any> {
    return this.request('/matieres', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listMatieres(params?: { page?: number; per_page?: number; search?: string }): Promise<any> {
    const qp = new URLSearchParams();
    if (params?.page) qp.set('page', String(params.page));
    if (params?.per_page) qp.set('per_page', String(params.per_page));
    if (params?.search) qp.set('search', params.search);
    return this.request(`/matieres?${qp.toString()}`);
  }

  async remove(id: number): Promise<any> {
    return this.request(`/matieres/${id}`, { method: 'DELETE' });
  }

  async show(id: number): Promise<any> {
    return this.request(`/matieres/${id}`);
  }

  async update(id: number, payload: Partial<MatiereFormInput>): Promise<any> {
    return this.request(`/matieres/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }
}

export default new MatiereService();


