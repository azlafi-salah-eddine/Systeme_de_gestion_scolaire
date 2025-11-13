// Use relative base to work with Vite proxy and preserve cookies
const API_BASE_URL = '/api';

export interface EnrollmentData {
  // Identity
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
  
  // Parents
  pere_id?: number;
  mere_id?: number;
  tuteur_id?: number;
  
  // Medical
  medical?: {
    groupe_sanguin?: string;
    allergies?: string;
    maladies_chroniques?: string;
    medicaments?: string;
    contact_urgence?: string;
    telephone_urgence?: string;
  };
  
  // Class & Services
  classe_id: number;
  cantine_id?: number;
  transport_id?: number;
}

export interface EnrollmentOptions {
  classes: Array<{
    id: number;
    nom: string;
    niveau?: string;
    annee_scolaire?: string;
    places_disponibles: number;
  }>;
  cantines: Array<{
    id: number;
    nom: string;
    prix?: number;
  }>;
  transports: Array<{
    id: number;
    nom: string;
    prix?: number;
  }>;
  parents: Array<{
    id: number;
    nom: string;
    prenom: string;
    type: string;
    telephone?: string;
    email?: string;
  }>;
}

export interface EnrollmentStatistics {
  total_eleves: number;
  eleves_actifs: number;
  eleves_par_classe: Array<{
    classe: string;
    count: number;
  }>;
  inscriptions_ce_mois: number;
  cantines_utilisees: Array<{
    cantine: string;
    count: number;
  }>;
  transports_utilises: Array<{
    transport: string;
    count: number;
  }>;
}

class EnrollmentService {
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

  async enroll(data: EnrollmentData): Promise<{ success: boolean; message: string; eleve: any }> {
    return this.request('/enrollment', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    });
  }

  async getOptions(): Promise<{ success: boolean; data: EnrollmentOptions }> {
    return this.request('/enrollment/options');
  }

  async getStatistics(): Promise<{ success: boolean; data: EnrollmentStatistics }> {
    return this.request('/enrollment/statistics');
  }

  async searchParents(query: string): Promise<{ success: boolean; data: any[] }> {
    return this.request(`/enrollment/search-parents?q=${encodeURIComponent(query)}`);
  }
}

export const enrollmentService = new EnrollmentService();
