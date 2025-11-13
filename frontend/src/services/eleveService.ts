import type { 
  Eleve, 
  EleveListResponse, 
  EleveResponse, 
  EleveCreateResponse, 
  EleveUpdateResponse, 
  EleveDeleteResponse,
  EleveFormData,
  Classe,
  ParentEleve,
  Note,
  Paiement,
  Transport,
  Cantine
} from '../types/eleve';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class EleveService {
  private isBackendAvailable = true;

  // Check if backend is available
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      this.isBackendAvailable = response.ok;
      return response.ok;
    } catch (error) {
      this.isBackendAvailable = false;
      return false;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/v1${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include', // Pour les cookies de session
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });

      // Check if response is ok
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const rawText = await response.text();
          const cleanText = rawText.replace(/^\uFEFF/, '').trim();
          if (cleanText) {
            try {
              const errorData = JSON.parse(cleanText);
              if (response.status === 422 && (errorData.errors || errorData.message)) {
                const fields = errorData.errors ? (Object.values(errorData.errors).flat() as string[]) : [];
                errorMessage = fields.length ? `Validation: ${fields.join(' | ')}` : (errorData.message || errorMessage);
              } else {
                errorMessage = errorData.message || errorData.error || errorMessage;
              }
            } catch {
              errorMessage = `${errorMessage} · ${cleanText.substring(0, 300)}`;
            }
          }
        } catch {
          errorMessage = `HTTP error! status: ${response.status} - Unable to parse error response`;
        }
        throw new Error(errorMessage);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textContent = await response.text();
        throw new Error(`Expected JSON response but got: ${contentType || 'unknown content type'}. Content: ${textContent.substring(0, 200)}...`);
      }

      // Parse JSON response
      const text = await response.text();
      // Remove BOM if present
      const cleanText = text.replace(/^\uFEFF/, '');
      if (!cleanText.trim()) {
        throw new Error('Empty response from server');
      }
      try {
        return JSON.parse(cleanText);
      } catch (jsonError) {
        throw new Error(`Invalid JSON response: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}. Content: ${cleanText.substring(0, 200)}...`);
      }

    } catch (error) {
      if (error instanceof Error) {
        // Re-throw our custom errors
        throw error;
      } else {
        // Handle network errors
        throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown network error'}`);
      }
    }
  }

  // CRUD Operations
  async getEleves(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    classe_id?: number;
    niveau?: string;
    active?: string;
    annee_scolaire_id?: number;
    has_classe?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<EleveListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.classe_id) searchParams.append('classe_id', params.classe_id.toString());
    if (params?.niveau) searchParams.append('niveau', params.niveau);
    if (params?.active) searchParams.append('active', params.active);
    if (params?.annee_scolaire_id) searchParams.append('annee_scolaire_id', params.annee_scolaire_id.toString());
    if (params?.has_classe) searchParams.append('has_classe', params.has_classe);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/eleves?${queryString}` : '/eleves';
    
    return this.request<EleveListResponse>(endpoint);
  }

  // Get filter options for students listing
  async getFilterOptions(params?: { annee_scolaire_id?: number }): Promise<{
    success: boolean;
    data: {
      niveaux: string[];
      classes: Array<{
        id: number;
        nom: string;
        niveau: string;
        nom_complet: string;
      }>;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.annee_scolaire_id) {
      searchParams.append('annee_scolaire_id', params.annee_scolaire_id.toString());
    }
    const queryString = searchParams.toString();
    return this.request<{
      success: boolean;
      data: {
        niveaux: string[];
        classes: Array<{
          id: number;
          nom: string;
          niveau: string;
          nom_complet: string;
        }>;
      };
    }>(`/eleves/filter-options${queryString ? `?${queryString}` : ''}`);
  }

  async getEleve(id: number): Promise<EleveResponse> {
    return this.request<EleveResponse>(`/eleves/${id}`);
  }

  async createEleve(data: EleveFormData): Promise<EleveCreateResponse> {
    return this.request<EleveCreateResponse>('/eleves', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEleve(id: number, data: Partial<EleveFormData>): Promise<EleveUpdateResponse> {
    return this.request<EleveUpdateResponse>(`/eleves/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEleve(id: number): Promise<EleveDeleteResponse> {
    return this.request<EleveDeleteResponse>(`/eleves/${id}`, {
      method: 'DELETE',
    });
  }

  // Related data
  async getEleveParents(id: number): Promise<{ parents: ParentEleve[] }> {
    return this.request<{ parents: ParentEleve[] }>(`/eleves/${id}/parents`);
  }

  async linkParentToEleve(eleveId: number, payload: {
    parent_id: number;
    relation?: string;
    contact_principal?: boolean;
  }): Promise<{ message: string; parents: ParentEleve[] }> {
    return this.request<{ message: string; parents: ParentEleve[] }>(`/eleves/${eleveId}/parents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Nouvelle méthode pour l'inscription étape 2 avec parents existants
  async createEleveWithExistingParents(payload: {
    // Student data
    nom_fr: string;
    prenom_fr: string;
    nom_ar?: string;
    prenom_ar?: string;
    date_naissance: string;
    lieu_naissance_fr?: string;
    lieu_naissance_ar?: string;
    sexe: 'M' | 'F';
    cne?: string;
    cin?: string;
    photo?: string;
    adresse?: string;
    nationalite?: string;
    
    // Medical info
    groupe_sanguin?: string;
    allergies?: string;
    maladies_chroniques?: string;
    medicaments?: string;
    infos_sante?: string;
    personne_urgence?: string;
    telephone_urgence?: string;
    
    // Parent associations (existing parents)
    pere_id?: number;
    mere_id?: number;
    tuteur_id?: number;
    
    // Assignments
    classe_id?: number;
    cantine_id?: number;
    transport_id?: number;
  }): Promise<{ success: boolean; message: string; eleve: Eleve }> {
    return this.request<{ success: boolean; message: string; eleve: Eleve }>('/enrollment/step2', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getEleveNotes(id: number): Promise<{ notes: Note[] }> {
    return this.request<{ notes: Note[] }>(`/eleves/${id}/notes`);
  }


  async getElevePaiements(id: number): Promise<{ paiements: Paiement[] }> {
    return this.request<{ paiements: Paiement[] }>(`/eleves/${id}/paiements`);
  }

  // Classes for dropdowns - Utilise maintenant le classeService
  async getClasses(): Promise<{ data: Classe[] }> {
    // Import dynamique pour éviter les dépendances circulaires
    const { classeService } = await import('./classeService');
    const response = await classeService.index();
    return { data: response.data };
  }

  async assignEleveToClasse(classeId: number, eleveId: number): Promise<{ success: boolean; message: string; }>{
    // Import dynamique pour éviter les dépendances circulaires
    const { classeService } = await import('./classeService');
    return await classeService.inscrireEleve(classeId, { eleve_id: eleveId });
  }

  async searchParents(q: string, page = 1): Promise<{ data: ParentEleve[]; current_page: number; last_page: number; per_page: number; total: number; }>{
    const params = new URLSearchParams({ q, page: String(page) });
    return this.request<{ data: ParentEleve[]; current_page: number; last_page: number; per_page: number; total: number; }>(`/parents?${params.toString()}`);
  }

  // Parents CRUD (create new parent)
  async createParent(payload: Partial<ParentEleve> & { nom: string; prenom: string; telephone: string; email: string; adresse: string; }): Promise<{ message: string; parent: ParentEleve }>{
    return this.request<{ message: string; parent: ParentEleve }>(`/parents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Transport & Cantine listings
  async getTransports(): Promise<{ data: Transport[] }>{
    return this.request<{ data: Transport[] }>(`/transports`);
  }

  async getCantines(): Promise<{ data: Cantine[] }>{
    return this.request<{ data: Cantine[] }>(`/cantines`);
  }

  // Enrollment in services
  async inscrireTransport(transportId: number, eleveId: number): Promise<{ success: boolean; message: string }>{
    return this.request<{ success: boolean; message: string }>(`/transports/${transportId}/inscrire-eleve`, {
      method: 'POST',
      body: JSON.stringify({ eleve_id: eleveId })
    });
  }

  async inscrireCantine(cantineId: number, eleveId: number): Promise<{ success: boolean; message: string }>{
    return this.request<{ success: boolean; message: string }>(`/cantines/${cantineId}/inscrire-eleve`, {
      method: 'POST',
      body: JSON.stringify({ eleve_id: eleveId })
    });
  }

  // Search and filter
  async searchEleves(query: string): Promise<EleveListResponse> {
    return this.request<EleveListResponse>(`/eleves?search=${encodeURIComponent(query)}`);
  }

  async getElevesByClasse(classeId: number, params?: { annee_scolaire_id?: number; has_classe?: string }): Promise<EleveListResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('classe_id', classeId.toString());
    if (params?.annee_scolaire_id) {
      searchParams.append('annee_scolaire_id', params.annee_scolaire_id.toString());
    }
    if (params?.has_classe) {
      searchParams.append('has_classe', params.has_classe);
    }
    return this.request<EleveListResponse>(`/eleves?${searchParams.toString()}`);
  }

  async getActiveEleves(): Promise<EleveListResponse> {
    return this.request<EleveListResponse>('/eleves?active=true');
  }

  // Statistics
  async getEleveStats(id: number): Promise<{
    total_notes: number;
    total_absences: number;
    total_paiements: number;
    moyenne_generale?: number;
  }> {
    return this.request<{
      total_notes: number;
      total_absences: number;
      total_paiements: number;
      moyenne_generale?: number;
    }>(`/eleves/${id}/stats`);
  }

  // Bulk operations
  async bulkUpdateEleves(ids: number[], data: Partial<EleveFormData>): Promise<{
    message: string;
    updated_count: number;
  }> {
    return this.request<{
      message: string;
      updated_count: number;
    }>('/eleves/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids, data }),
    });
  }

  async bulkDeleteEleves(ids: number[]): Promise<{
    message: string;
    deleted_count: number;
  }> {
    return this.request<{
      message: string;
      deleted_count: number;
    }>('/eleves/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // Export
  async exportEleves(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/v1/eleves/export?format=${format}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }
}

export const eleveService = new EleveService();
export default eleveService;
