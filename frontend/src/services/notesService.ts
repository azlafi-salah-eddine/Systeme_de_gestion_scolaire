import api from './api';

export interface Note {
  id: number;
  eleve_id: number;
  matiere_id: number;
  discipline_id?: number;
  periode_id?: number;
  controle_id?: number;
  professeur_id: number;
  note: number;
  bareme: number;
  type_controle?: string;
  annee_scolaire_id?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  eleve?: {
    id: number;
    nom_fr: string;
    prenom_fr: string;
    nom_complet: string;
  };
  matiere?: {
    id: number;
    nom: string;
    code: string;
    coefficient: number;
  };
  discipline?: {
    id: number;
    nom: string;
    code: string;
  };
  periode?: {
    id: number;
    nom: string;
  };
  controle?: {
    id: number;
    libelle: string;
    debut_controle?: string;
    fin_controle?: string;
  };
  professeur?: {
    id: number;
    nom: string;
    prenom: string;
    nom_complet: string;
  };
  annee_scolaire?: {
    id: number;
    nom: string;
    annee_debut: number;
    annee_fin: number;
    active: boolean;
  };
}

export interface NoteFilters {
  niveau_id?: number;
  classe_id?: number;
  professeur_id?: number;
  matiere_id?: number;
  discipline_id?: number;
  eleve_id?: number;
  annee_scolaire_id?: number;
  periode_id?: number;
  controle_id?: number;
  type_controle?: string;
  per_page?: number;
  with?: string;
}

export interface NoteStatistics {
  total: number;
  moyenne: number;
  excellentes: number;
  bonnes: number;
  passables: number;
  insuffisantes: number;
  meilleure_note: number;
  pire_note: number;
}

export interface CreateNoteData {
  eleve_id: number;
  matiere_id: number;
  discipline_id?: number;
  controle_id?: number;
  professeur_id: number;
  note: number;
  bareme?: number;
  type_controle?: string;
  periode_id?: number;
  annee_scolaire_id?: number;
}

class NotesService {
  async getNotes(filters: NoteFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/v1/notes?${params.toString()}`);
    return response.data;
  }

  async createNote(data: CreateNoteData) {
    const response = await api.post('/v1/notes', data);
    return response.data;
  }

  async updateNote(id: number, data: Partial<CreateNoteData>) {
    const response = await api.put(`/v1/notes/${id}`, data);
    return response.data;
  }

  async deleteNote(id: number) {
    const response = await api.delete(`/v1/notes/${id}`);
    return response.data;
  }

  async getStatistics(filters: NoteFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/v1/notes/statistics?${params.toString()}`);
    return response.data;
  }
}

export default new NotesService();
