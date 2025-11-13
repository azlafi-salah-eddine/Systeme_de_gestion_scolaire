import type { Cantine } from '../types/eleve';

export interface MenuItem {
  id: number;
  cantine_id: number;
  jour: 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';
  plat_principal: string;
  entree?: string;
  dessert?: string;
  boisson?: string;
  date_menu?: string;
  cantine?: Cantine;
}

export interface MenuListResponse {
  success?: boolean;
  data: MenuItem[];
  meta?: { current_page: number; per_page: number; total: number; last_page: number };
}

export interface MenuResponse {
  success?: boolean;
  data: MenuItem;
  message?: string;
}

export interface MenuCreatePayload {
  cantine_id: number;
  jour: MenuItem['jour'];
  plat_principal: string;
  entree?: string;
  dessert?: string;
  boisson?: string;
  date_menu?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class MenuService {
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

  async list(params?: { page?: number; per_page?: number; cantine_id?: number; jour?: MenuItem['jour'] }): Promise<MenuListResponse> {
    const search = new URLSearchParams();
    if (params?.page) search.append('page', String(params.page));
    if (params?.per_page) search.append('per_page', String(params.per_page));
    if (params?.cantine_id) search.append('cantine_id', String(params.cantine_id));
    if (params?.jour) search.append('jour', params.jour);
    const qs = search.toString();
    const endpoint = qs ? `/menus?${qs}` : '/menus';
    return this.request<MenuListResponse>(endpoint);
  }

  async show(id: number): Promise<MenuResponse> {
    return this.request<MenuResponse>(`/menus/${id}`);
  }

  async create(payload: MenuCreatePayload): Promise<MenuResponse> {
    return this.request<MenuResponse>('/menus', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async update(id: number, payload: Partial<MenuCreatePayload>): Promise<MenuResponse> {
    return this.request<MenuResponse>(`/menus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    }

  async remove(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/menus/${id}`, {
      method: 'DELETE',
    });
  }
}

export const menuService = new MenuService();
export default menuService;


