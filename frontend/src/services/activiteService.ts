// Use relative base to work with Vite proxy and preserve cookies
const API_BASE_URL = '/api';

export interface Activite {
  id: number
  nom: string
  description: string
  capacite: number
  places_disponibles: number
  est_complet: boolean
  date_debut: string
  date_fin?: string
  heure_debut?: string
  heure_fin?: string
  lieu: string
  prix: number
  type: string
  type_label: string
  responsable_id?: number
  responsable?: {
    id: number
    nom: string
    prenom: string
    nom_complet: string
  }
  active: boolean
  est_en_cours: boolean
  est_terminee: boolean
  eleves_count: number
  eleves?: Array<{
    id: number
    nom: string
    prenom: string
    nom_complet: string
    pivot: {
      date_inscription: string
      statut: 'inscrit' | 'present' | 'absent' | 'exclu'
      notes?: string
    }
  }>
  created_at: string
  updated_at: string
}

export interface ActiviteFormData {
  nom: string
  description?: string
  capacite: number
  date_debut: string
  date_fin?: string
  heure_debut?: string
  heure_fin?: string
  lieu: string
  prix: number
  type: string
  responsable_id?: number
  active?: boolean
}

export interface ActiviteFilters {
  search?: string
  type?: string
  responsable_id?: number
  status?: 'upcoming' | 'current' | 'completed'
  active?: boolean
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface ActiviteOptions {
  types: Array<{ value: string; label: string }>
  responsables: Array<{ value: number; label: string }>
}

export interface ActiviteStats {
  total_inscrits: number
  places_disponibles: number
  capacite: number
  taux_occupation: number
  par_statut: {
    inscrits: number
    presents: number
    absents: number
    exclus: number
  }
  est_complet: boolean
  est_en_cours: boolean
  est_terminee: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  meta?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

class ActiviteService {
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

  async getAll(queryParams: string = ''): Promise<ApiResponse<Activite[]>> {
    return this.request<ApiResponse<Activite[]>>(`/activites?${queryParams}`);
  }

  async getById(id: number): Promise<ApiResponse<Activite>> {
    return this.request<ApiResponse<Activite>>(`/activites/${id}`);
  }

  async create(data: ActiviteFormData): Promise<ApiResponse<Activite>> {
    return this.request<ApiResponse<Activite>>('/activites', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: number, data: Partial<ActiviteFormData>): Promise<ApiResponse<Activite>> {
    return this.request<ApiResponse<Activite>>(`/activites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/activites/${id}`, {
      method: 'DELETE',
    });
  }

  async restore(id: number): Promise<ApiResponse<Activite>> {
    return this.request<ApiResponse<Activite>>(`/activites/${id}/restore`, {
      method: 'POST',
    });
  }

  async inscrireEleve(activiteId: number, eleveId: number, notes?: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/activites/${activiteId}/inscrire-eleve`, {
      method: 'POST',
      body: JSON.stringify({
        eleve_id: eleveId,
        notes
      }),
    });
  }

  async desinscrireEleve(activiteId: number, eleveId: number): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/activites/${activiteId}/desinscrire-eleve/${eleveId}`, {
      method: 'DELETE',
    });
  }

  async marquerPresence(
    activiteId: number, 
    eleveId: number, 
    statut: 'present' | 'absent' | 'exclu', 
    notes?: string
  ): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/activites/${activiteId}/eleves/${eleveId}/presence`, {
      method: 'POST',
      body: JSON.stringify({
        statut,
        notes
      }),
    });
  }

  async getEleves(activiteId: number): Promise<ApiResponse<Activite['eleves']>> {
    return this.request<ApiResponse<Activite['eleves']>>(`/activites/${activiteId}/eleves`);
  }

  async getStatistiques(activiteId: number): Promise<ApiResponse<ActiviteStats>> {
    return this.request<ApiResponse<ActiviteStats>>(`/activites/${activiteId}/statistiques`);
  }

  async getOptions(): Promise<ApiResponse<ActiviteOptions>> {
    return this.request<ApiResponse<ActiviteOptions>>('/activites-options');
  }
}

export const activiteService = new ActiviteService()
