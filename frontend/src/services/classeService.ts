import api from './api';

// Types pour les classes
export interface Classe {
  id: number;
  nom: string;
  niveau: string | Niveau; // Peut être une string ou un objet Niveau
  niveau_id?: number; // ID du niveau si c'est une relation
  section: string;
  annee_scolaire: string;
  annee_scolaire_id?: number;
  capacite: number;
  salle_id?: number;
  professeur_principal_id?: number;
  active: boolean;
  nom_complet: string;
  nom_court: string;
  nombre_eleves: number; // peut être calculé côté frontend si absent
  taux_occupation: number; // idem
  est_complete: boolean; // idem
  created_at: string;
  updated_at: string;
  
  // Relations optionnelles
  annee_scolaire_detail?: AnneeScolaire;
  professeur_principal?: Professeur;
  eleves?: Eleve[];
  professeurs?: Professeur[];
  matieres?: Matiere[];
  emplois_du_temps?: EmploiDuTemps[];
  statistiques?: ClasseStatistiques;
}

export interface Niveau {
  id: number;
  nom: string;
  description?: string;
  bareme?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnneeScolaire {
  id: number;
  nom: string;
  annee_debut: number;
  annee_fin: number;
  date_debut: string;
  date_fin: string;
  active: boolean;
  description?: string;
  nom_formate: string;
  created_at: string;
  updated_at: string;
}

export interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  specialite?: string;
  created_at: string;
  updated_at: string;
}

export interface Eleve {
  id: number;
  nom: string;
  prenom: string;
  nom_fr?: string;
  prenom_fr?: string;
  nom_complet?: string;
  date_naissance: string;
  matricule?: string;
  cne?: string;
  sexe?: string;
  classe_id?: number;
  parent_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Matiere {
  id: number;
  nom: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface EmploiDuTemps {
  id: number;
  classe_id: number;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  matiere_id: number;
  professeur_id: number;
  salle_id: number;
  created_at: string;
  updated_at: string;

  // Convenience fields (when loaded)
  classe_nom?: string;
  matiere_nom?: string;
  professeur_nom?: string;
  salle_nom?: string;
}

export interface ClasseStatistiques {
  nombre_eleves: number;
  capacite: number;
  taux_occupation: number;
  est_complete: boolean;
  nombre_professeurs: number;
  nombre_matieres: number;
  moyenne_generale?: number;
  nombre_absences?: number;
  taux_absentisme?: number;
}

// Types pour les requêtes
export interface ClasseCreatePayload {
  nom: string;
  niveau_id: number;
  annee_scolaire_id: number;
  section: string;
  capacite: number;
  salle_id?: number;
  professeur_principal_id?: number;
  active?: boolean;
}

export interface ClasseUpdatePayload extends Partial<ClasseCreatePayload> {}

export interface ClasseFilters {
  search?: string;
  annee_scolaire_id?: number;
  niveau?: string;
  active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface ClasseResponse {
  success: boolean;
  data: Classe;
  message?: string;
}

export interface ClassesResponse {
  success: boolean;
  data: Classe[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface ClasseStatistiquesResponse {
  success: boolean;
  data: ClasseStatistiques;
}

export interface InscrireElevePayload {
  eleve_id: number;
}

export interface AssignerProfesseurPayload {
  professeur_id: number;
  matiere_id: number;
}

export interface AssignerProfesseurPrincipalPayload {
  professeur_id: number;
}

export interface DupliquerClassesPayload {
  annee_scolaire_destination_id: number;
  niveaux?: string[];
  inclure_eleves?: boolean;
  inclure_professeurs?: boolean;
}

class ClasseService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const method = (options.method || 'GET') as any;
      const headers = options.headers as any;
      let data: any = undefined;
      if (options.body !== undefined) {
        if (typeof options.body === 'string') {
          try { data = JSON.parse(options.body); } catch { data = options.body; }
        } else {
          data = options.body as any;
        }
      }
      const res = await api.request({ url: endpoint, method, headers, data });
      return res.data as T;
    } catch (error: any) {
      // Construire un message exploitable pour les erreurs 422
      if (error?.response?.status === 422) {
        let data = error.response.data;
        if (typeof data === 'string') {
          try {
            // remove BOM if present then parse
            const cleaned = data.replace(/^\uFEFF/, '');
            data = JSON.parse(cleaned);
          } catch {
            // keep as string
          }
        }
        let msg = data?.message || 'Données invalides';
        if (data?.errors && typeof data.errors === 'object') {
          const parts: string[] = [];
          Object.entries(data.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages) && messages.length > 0) {
              parts.push(`${field}: ${messages[0]}`);
            }
          });
          if (parts.length > 0) {
            msg = parts.join(' | ');
          }
        }
        throw new Error(msg);
      }
      // Autres erreurs
      const message = error?.response?.data?.message || error?.message || 'Erreur API';
      throw new Error(message);
    }
  }

  // ============ CRUD DE BASE ============

  async index(filters?: ClasseFilters, include?: string[]): Promise<ClassesResponse> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    if (include && include.length > 0) {
      params.append('with', include.join(','));
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/v1/classes?${queryString}` : '/v1/classes';
    
    return this.request<ClassesResponse>(endpoint);
  }

  async show(id: number, include?: string[]): Promise<ClasseResponse> {
    const params = new URLSearchParams();
    if (include && include.length > 0) {
      params.append('with', include.join(','));
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/v1/classes/${id}?${queryString}` : `/v1/classes/${id}`;
    
    return this.request<ClasseResponse>(endpoint);
  }

  async create(payload: ClasseCreatePayload): Promise<ClasseResponse> {
    return this.request<ClasseResponse>('/v1/classes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  async update(id: number, payload: ClasseUpdatePayload): Promise<ClasseResponse> {
    return this.request<ClasseResponse>(`/v1/classes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/v1/classes/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ GESTION DES ÉLÈVES ============

  async getEleves(classeId: number): Promise<{ success: boolean; data: Eleve[] }> {
    return this.request<{ success: boolean; data: Eleve[] }>(`/v1/classes/${classeId}/eleves`);
  }

  async inscrireEleve(classeId: number, payload: InscrireElevePayload): Promise<{ success: boolean; message: string; data?: Eleve }> {
    return this.request<{ success: boolean; message: string; data?: Eleve }>(`/v1/classes/${classeId}/inscrire-eleve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  async desinscrireEleve(classeId: number, eleveId: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/v1/classes/${classeId}/desinscrire-eleve/${eleveId}`, {
      method: 'DELETE',
    });
  }

  // ============ GESTION DES PROFESSEURS ============

  async getProfesseurs(classeId: number): Promise<{ success: boolean; data: Professeur[] }> {
    return this.request<{ success: boolean; data: Professeur[] }>(`/v1/classes/${classeId}/professeurs`);
  }

  async assignerProfesseur(classeId: number, payload: AssignerProfesseurPayload): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/v1/classes/${classeId}/assigner-professeur`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  async retirerProfesseur(classeId: number, professeurId: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/v1/classes/${classeId}/retirer-professeur/${professeurId}`, {
      method: 'DELETE',
    });
  }

  async assignerProfesseurPrincipal(classeId: number, payload: AssignerProfesseurPrincipalPayload): Promise<ClasseResponse> {
    return this.request<ClasseResponse>(`/v1/classes/${classeId}/professeur-principal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  // Retrait non supporté côté backend pour l'instant; utiliser update classe avec professeur_principal_id: null

  // ============ GESTION DES MATIÈRES ============

  async getMatieres(classeId: number): Promise<{ success: boolean; data: Matiere[] }> {
    return this.request<{ success: boolean; data: Matiere[] }>(`/v1/classes/${classeId}/matieres`);
  }

  // ============ STATISTIQUES ============

  async getStatistiques(classeId: number): Promise<ClasseStatistiquesResponse> {
    return this.request<ClasseStatistiquesResponse>(`/v1/classes/${classeId}/statistiques`);
  }

  async toggleActive(classeId: number): Promise<ClasseResponse> {
    return this.request<ClasseResponse>(`/v1/classes/${classeId}/toggle-active`, {
      method: 'POST',
    });
  }

  // ============ GESTION PAR ANNÉE SCOLAIRE ============

  async getParAnneeScolaire(anneeScolaireId: number, include?: string[]): Promise<{
    success: boolean;
    data: Classe[];
    meta: {
      annee_scolaire: AnneeScolaire;
      total_classes: number;
      total_eleves: number;
    };
  }> {
    const params = new URLSearchParams();
    if (include && include.length > 0) {
      params.append('with', include.join(','));
    }
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `/v1/annees-scolaires/${anneeScolaireId}/classes?${queryString}` 
      : `/v1/annees-scolaires/${anneeScolaireId}/classes`;
    
    return this.request(endpoint);
  }

  async getClassesDetaillees(anneeScolaireId: number, filters?: ClasseFilters): Promise<{
    success: boolean;
    data: Classe[];
    meta: {
      annee_scolaire: AnneeScolaire;
      statistiques: {
        total_classes: number;
        total_eleves: number;
        classes_actives: number;
        classes_completes: number;
        taux_occupation_moyen: number;
        par_niveau: Record<string, any>;
      };
    };
  }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `/v1/annees-scolaires/${anneeScolaireId}/classes-detaillees?${queryString}` 
      : `/v1/annees-scolaires/${anneeScolaireId}/classes-detaillees`;
    
    return this.request(endpoint);
  }

  async createPourAnneeScolaire(anneeScolaireId: number, payload: Omit<ClasseCreatePayload, 'annee_scolaire_id'>): Promise<ClasseResponse> {
    return this.request<ClasseResponse>(`/v1/annees-scolaires/${anneeScolaireId}/classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  async dupliquerClasses(anneeScolaireId: number, payload: DupliquerClassesPayload): Promise<{
    success: boolean;
    message: string;
    data: Classe[];
    meta: {
      annee_source: AnneeScolaire;
      annee_destination: AnneeScolaire;
      nombre_classes_dupliquees: number;
    };
  }> {
    return this.request(`/v1/annees-scolaires/${anneeScolaireId}/classes/dupliquer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  async getStatistiquesAnneeScolaire(anneeScolaireId: number): Promise<{
    success: boolean;
    data: {
      annee_scolaire: AnneeScolaire;
      resume: {
        total_classes: number;
        classes_actives: number;
        total_eleves: number;
        capacite_totale: number;
        taux_occupation_moyen: number;
        classes_completes: number;
      };
      par_niveau: Array<{
        niveau: string;
        nombre_classes: number;
        classes_actives: number;
        total_eleves: number;
        capacite_totale: number;
        taux_occupation_moyen: number;
        classes_completes: number;
      }>;
      par_section: Array<{
        section: string;
        nombre_classes: number;
        total_eleves: number;
        taux_occupation_moyen: number;
      }>;
      professeurs: {
        total_professeurs_uniques: number;
        professeurs_principaux: number;
      };
    };
  }> {
    return this.request(`/v1/annees-scolaires/${anneeScolaireId}/classes/statistiques`);
  }

  async archiverClasses(anneeScolaireId: number): Promise<{
    success: boolean;
    message: string;
    meta: {
      annee_scolaire: AnneeScolaire;
      nombre_classes_archivees: number;
    };
  }> {
    return this.request(`/v1/annees-scolaires/${anneeScolaireId}/classes/archiver`, {
      method: 'POST',
    });
  }

  async reactiverClasses(anneeScolaireId: number): Promise<{
    success: boolean;
    message: string;
    meta: {
      annee_scolaire: AnneeScolaire;
      nombre_classes_reactives: number;
    };
  }> {
    return this.request(`/v1/annees-scolaires/${anneeScolaireId}/classes/reactiver`, {
      method: 'POST',
    });
  }
}

export const classeService = new ClasseService();

