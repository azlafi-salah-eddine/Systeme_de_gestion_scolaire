import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import softDeleteService from '../../services/softDeleteService';
import { useNotification } from '../../contexts/NotificationContext';

interface DeletedRecord {
  id: number;
  model: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

interface DeletedRecordsResponse {
  success: boolean;
  model: string;
  data: DeletedRecord[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

interface DeletedStatsResponse {
  success: boolean;
  stats: Record<string, number>;
  total: number;
}
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PermissionGate from '../../components/PermissionGate';
import Icon from '../../components/Icon';
import PageHead from '../../components/ui/PageHead';

const MODELS = [
  { key: 'users', label: 'Utilisateurs', icon: 'users' },
  { key: 'eleves', label: 'Élèves', icon: 'graduation-cap' },
  { key: 'classes', label: 'Classes', icon: 'book' },
  { key: 'professeurs', label: 'Professeurs', icon: 'user' },
  { key: 'matieres', label: 'Matières', icon: 'book' },
  { key: 'niveaux', label: 'Niveaux', icon: 'levels' },
  { key: 'annees_scolaires', label: 'Années Scolaires', icon: 'calendar' },
  { key: 'notes', label: 'Notes', icon: 'file-text' },
  { key: 'absences', label: 'Absences', icon: 'x-circle' },
  { key: 'salles', label: 'Salles', icon: 'home' },
  { key: 'emplois_du_temps', label: 'Emplois du temps', icon: 'calendar' },
  { key: 'roles', label: 'Rôles', icon: 'shield' },
  { key: 'parents', label: 'Parents', icon: 'users' },
  { key: 'paiements', label: 'Paiements', icon: 'credit-card' },
  { key: 'transports', label: 'Transports', icon: 'truck' },
  { key: 'cantines', label: 'Cantines', icon: 'utensils' },
  { key: 'menus', label: 'Menus', icon: 'utensils' },
  { key: 'chauffeurs', label: 'Chauffeurs', icon: 'user' },
  { key: 'accompagnateurs', label: 'Accompagnateurs', icon: 'user' },
  { key: 'activites', label: 'Activités Parascolaires', icon: 'star' },
];

// Champs techniques à masquer dans le modal
const HIDE_FIELDS = new Set(['id', 'model', 'created_at', 'updated_at', 'matiere', 'niveau', 'eleve_id', 'professeur_id', 'matiere_id', 'eleve', 'professeur', 'matiere', 'responsable_id', 'active']);

const FIELD_ORDER: Record<string, string[]> = {
  annees_scolaires: ['nom', 'date_debut', 'date_fin', 'description', 'active'],
  classes: ['nom', 'niveau', 'section', 'capacite', 'annee_scolaire_id', 'description', 'active'],
  eleves: ['nom_fr', 'prenom_fr', 'nom_ar', 'prenom_ar', 'cne', 'cin'],
  professeurs: ['nom', 'prenom', 'email', 'telephone', 'date_embauche', 'salaire', 'active'],
  matieres: ['nom', 'code', 'description', 'active'],
  disciplines: ['nom', 'coefficient', 'matiere_nom', 'niveau_nom', 'description', 'active'],
  niveaux: ['nom', 'description', 'active'],
  notes: ['eleve_id', 'professeur_id', 'discipline_id', 'note', 'coefficient', 'date_evaluation', 'active'],
  absences: ['eleve_nom', 'professeur_nom', 'matiere_nom', 'date', 'heure_debut', 'heure_fin', 'motif', 'justifie', 'justification', 'piece_jointe', 'active'],
  roles: ['type', 'active'],
  parents: ['nom', 'prenom', 'telephone', 'email', 'adresse', 'type', 'active'],
  salles: ['nom', 'type', 'capacite', 'localisation', 'active'],
  emplois_du_temps: ['classe_nom', 'sessions'],
  transports: ['ligne', 'matricule', 'capacite', 'chauffeur_id', 'accompagnateur_id', 'active'],
  paiements: ['eleve_id', 'montant', 'date', 'mode', 'active'],
  users: ['nom_complet', 'email', 'telephone', 'role_id', 'active'],
  cantines: ['nom', 'localisation', 'capacite', 'active'],
  activites: ['nom', 'type', 'description', 'lieu', 'capacite', 'prix', 'date_debut', 'date_fin', 'heure_debut', 'heure_fin', 'responsable_nom'],
};

const LABEL_MAP: Record<string, string> = {
  nom: 'Nom',
  nom_fr: 'Nom (FR)',
  nom_ar: 'Nom (AR)',
  nom_complet: 'Nom complet',
  date_debut: 'Date début',
  date_fin: 'Date fin',
  description: 'Description',
  active: 'Visible',
  niveau: 'Niveau',
  section: 'Section',
  capacite: 'Capacité',
  annee_scolaire_id: 'Année scolaire',
  prenom: 'Prénom',
  prenom_fr: 'Prénom (FR)',
  prenom_ar: 'Prénom (AR)',
  cne: 'CNE',
  cin: 'CIN',
  date_naissance: 'Date naissance',
  lieu_naissance_fr: 'Lieu naissance (FR)',
  lieu_naissance_ar: 'Lieu naissance (AR)',
  sexe: 'Sexe',
  classe_id: 'Classe',
  email: 'Email',
  telephone: 'Téléphone',
  date_embauche: "Date d'embauche",
  salaire: 'Salaire',
  code: 'Code',
  eleve_id: 'Élève',
  professeur_id: 'Professeur',
  discipline_id: 'Discipline',
  note: 'Note',
  coefficient: 'Coefficient',
  date_evaluation: 'Date évaluation',
  matiere_nom: 'Matière',
  niveau_nom: 'Niveau',
  justifiee: 'Justifiée',
  justifie: 'Justifiée',
  justification: 'Justification',
  piece_jointe: 'Pièce jointe',
  heure_debut: 'Heure début',
  heure_fin: 'Heure fin',
  matiere_id: 'Matière',
  eleve: 'Élève',
  professeur: 'Professeur',
  matiere: 'Matière',
  eleve_nom: 'Élève',
  professeur_nom: 'Professeur',
  motif: 'Motif',
  type: 'Type',
  adresse: 'Adresse',
  localisation: 'Localisation',
  ligne: 'Ligne',
  matricule: 'Matricule',
  ancienne_ecole: 'Ancienne école',
  type_ecole: 'Type école',
  statut_ecole: 'Statut école',
  nationalite: 'Nationalité',
  langues: 'Langues',
  infos_sante: 'Infos santé',
  groupe_sanguin: 'Groupe sanguin',
  allergies: 'Allergies',
  maladies_chroniques: 'Maladies chroniques',
  medicaments: 'Médicaments',
  personne_urgence: 'Personne urgence',
  telephone_urgence: 'Téléphone urgence',
  cantine_id: 'Cantine',
  transport_id: 'Transport',
  date_inscription: 'Date inscription',
  chauffeur_id: 'Chauffeur',
  accompagnateur_id: 'Accompagnateur',
  montant: 'Montant',
  mode: 'Mode',
  role_id: 'Rôle',
  classe_nom: 'Classe',
  sessions: 'Séances',
  // Activités
  activity_description: 'Description',
  activity_type: 'Type',
  activity_capacite: 'Capacité',
  lieu: 'Lieu',
  prix: 'Prix',
  activity_date_debut: 'Date début',
  activity_date_fin: 'Date fin',
  activity_heure_debut: 'Heure début',
  activity_heure_fin: 'Heure fin',
  responsable_id: 'Responsable',
  responsable_nom: 'Responsable',
};

const DeletedRecordsIndex: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [selectedModel, setSelectedModel] = useState<string>('users');
  const [records, setRecords] = useState<DeletedRecordsResponse | null>(null);
  const [stats, setStats] = useState<DeletedStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (isSuperAdmin()) {
      loadStats();
      loadRecords();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (selectedModel && isSuperAdmin()) {
      loadRecords();
    }
  }, [selectedModel, currentPage]);

  const loadStats = async () => {
    try {
      const response = await softDeleteService.getDeletedStats();
      setStats(response);
    } catch (error: any) {
      // Ne pas afficher d'erreur pour les 401 - l'interceptor gère la redirection
      if (error?.response?.status !== 401) {
        // silent pour les autres erreurs
      }
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await softDeleteService.getDeletedRecords(selectedModel, currentPage, 5);
      setRecords(response);
    } catch (error: any) {
      // Ne pas afficher d'erreur pour les 401 - l'interceptor gère la redirection
      if (error?.response?.status !== 401) {
        showError('Erreur', 'Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const response = await softDeleteService.restoreRecord(selectedModel, id);
      showSuccess('Restauration réussie', response.message || 'Enregistrement restauré avec succès');
      loadRecords();
      loadStats();
    } catch (error) {
      showError('Erreur lors de la restauration', error instanceof Error ? error.message : 'Erreur lors de la restauration');
    }
  };

  const handleView = async (id: number) => {
    try {
      const data = await softDeleteService.showDeleted(selectedModel, id);
      setDetails(data);
      setDetailsOpen(true);
    } catch (e) {
      showError('Erreur', 'Erreur lors du chargement des détails');
    }
  };

  const handleForceDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet enregistrement ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      const response = await softDeleteService.forceDeleteRecord(selectedModel, id);
      showSuccess('Suppression définitive réussie', response.message || 'Enregistrement supprimé définitivement');
      loadRecords();
      loadStats();
    } catch (error) {
      showError('Erreur lors de la suppression définitive', error instanceof Error ? error.message : 'Erreur lors de la suppression définitive');
    }
  };

  const filteredData = useMemo(() => {
    if (!records) return [];
    if (!search.trim()) return records.data;
    const q = search.trim().toLowerCase();
    return records.data.filter(item => {
      const name = String(item.name ?? '').toLowerCase();
      const idStr = String(item.id);
      const model = String(item.model ?? '').toLowerCase();
      const deletedAt = item.updated_at ? new Date(item.updated_at).toLocaleString('fr-FR').toLowerCase() : '';
      const deletedRaw = String(item.updated_at || '').toLowerCase();
      return name.includes(q) || idStr.includes(q) || model.includes(q) || deletedAt.includes(q) || deletedRaw.includes(q);
    });
  }, [records, search]);

  if (!isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Accès Refusé</h1>
          <p className="text-gray-600 dark:text-gray-400">Vous n'avez pas les permissions pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  const totalForSelected = stats?.stats?.[selectedModel] ?? 0;
  const currentModelMeta = MODELS.find(m => m.key === selectedModel);
  const totalPages = records?.meta?.last_page || 1;
  const pageNumber = records?.meta?.current_page || currentPage;

  return (
    <div className="space-y-6">
      <PageHead
        title="Corbeille"
        subtitle="Gérez les éléments supprimés (restaurer)"
      >
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Icon name="file-text" size="sm" className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total: <span className="font-bold text-blue-600 dark:text-blue-400">{stats?.total || 0}</span> enregistrements
            </span>
          </div>
        </div>
      </PageHead>

      {/* Filtres pill avec compte */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          {MODELS.map((model) => {
            const count = stats?.stats?.[model.key] ?? 0;
            const active = selectedModel === model.key;
            return (
              <button
                key={model.key}
                onClick={() => { setSelectedModel(model.key); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-full text-sm border inline-flex items-center gap-2 transition-colors ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <Icon name={model.icon} size="sm" />
                <span>{model.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-white text-blue-700' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Barre de recherche collée au tableau */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Modèle: <span className="font-semibold uppercase">{selectedModel}</span> — Total: <span className="font-semibold">{totalForSelected}</span>
        </div>
        <div className="relative">
          <Icon name="search" className="absolute text-gray-400 dark:text-gray-500 -translate-y-1/2 left-3 top-1/2" />
          <input
            className="py-2 pr-3 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md pl-9 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500"
            placeholder="Rechercher (Nom, ID, Date suppression)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Tableau simple avec colonne Item enrichie + Nom */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Item</th>
                <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Nom</th>
                <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Supprimé le</th>
                <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    <div className="inline-flex items-center gap-3">
                      <div className="w-5 h-5 border-b-2 border-gray-400 rounded-full animate-spin"></div>
                      <span>Chargement…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((record) => {
                  const label = currentModelMeta?.label || record.model;
                  const icon = currentModelMeta?.icon || 'file-text';
                  const title = record.name && record.name.trim().length > 0 ? record.name : `${label} #${record.id}`;
                  const deletedAt = new Date(record.updated_at).toLocaleString('fr-FR');
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Icon name={icon} className="text-gray-500 dark:text-gray-400" />
                          <div>
                            <div className="text-xs font-medium text-gray-900 dark:text-white">{label} • #{record.id}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{record.model}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-900 dark:text-white">
                          {record.name && record.name.trim().length > 0 ? record.name : '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs text-gray-600 dark:text-gray-400">{deletedAt}</div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            className="p-2 text-blue-600 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800"
                            title="Voir"
                            aria-label="Voir"
                            onClick={() => handleView(record.id)}
                          >
                            <Icon name="eye" size="sm" />
                          </button>
                          <PermissionGate permission="restore">
                            <button
                              className="p-2 text-green-600 rounded-full hover:bg-green-50 dark:hover:bg-gray-800"
                              title="Restaurer"
                              aria-label="Restaurer"
                              onClick={() => handleRestore(record.id)}
                            >
                              <Icon name="refresh" size="sm" />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="force-delete">
                            <button
                              className="p-2 text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-gray-800"
                              title="Supprimer définitivement"
                              aria-label="Supprimer définitivement"
                              onClick={() => handleForceDelete(record.id)}
                            >
                              <Icon name="trash" size="sm" />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Icon name="trash" className="text-gray-400 dark:text-gray-500" />
                      <span>Aucun enregistrement supprimé pour ce modèle.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {records && records.meta && (
          <div className="flex items-center justify-between px-4 pb-4 mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Affichage {records.meta.total === 0 ? 0 : ((pageNumber - 1) * 5) + 1}-{Math.min(pageNumber * 5, records.meta.total)} sur {records.meta.total}
            </div>
            <div className="inline-flex items-center gap-2">
              <button
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
              >
                Précédent
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">Page {pageNumber} / {totalPages}</span>
              <button
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageNumber >= totalPages}
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal détails simple */}
      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50">
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-md shadow-lg flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <Icon name={currentModelMeta?.icon || 'file-text'} className="text-gray-600 dark:text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {currentModelMeta?.label || selectedModel} • #{details?.id}
                  </h3>
                </div>
                <button onClick={() => setDetailsOpen(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Icon name="close" className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900">
              {/* Formulaire statique compact */}
              <div className="grid grid-cols-1 gap-3">
                {(() => {
                  const keys = Object.keys(details || {});
                  const order = FIELD_ORDER[selectedModel] || [];
                  // Pour les élèves, ne montrer QUE les champs spécifiés dans l'ordre
                  const finalOrder = selectedModel === 'eleves' 
                    ? order.filter(k => keys.includes(k))
                    : order.filter(k => keys.includes(k)).concat(
                        keys.filter(k => !HIDE_FIELDS.has(k) && !order.includes(k))
                      );
                  return finalOrder.map((key) => {
                    const raw = (details as any)[key];
                    const label = LABEL_MAP[key] || key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

                    // Gestion spéciale pour les sessions des emplois du temps
                    if (key === 'sessions' && Array.isArray(raw)) {
                      const sessionsText = raw.map((session: any) => 
                        `${session.jour} ${session.heure_debut}-${session.heure_fin} • ${session.matiere_nom}`
                      ).join('\n');
                      
                      return (
                        <div key={key} className="grid items-start grid-cols-3 gap-3">
                          <label className="col-span-1 text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
                          <div className="col-span-2">
                            <textarea
                              value={sessionsText}
                              disabled
                              rows={Math.min(raw.length, 6)}
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                            />
                          </div>
                        </div>
                      );
                    }


                    let type: 'text' | 'date' | 'datetime' | 'checkbox' = 'text';
                    let valueDisplay: any = raw;

                    if (typeof raw === 'boolean') {
                      type = 'checkbox';
                    } else if (key.includes('date') && !key.includes('heure')) {
                      // Pour les champs date (sans heure), formater uniquement la date
                      type = 'date';
                      try {
                        const dateObj = new Date(raw);
                        // Si c'est une date valide, formater uniquement la date
                        if (!isNaN(dateObj.getTime())) {
                          valueDisplay = dateObj.toLocaleDateString('fr-FR');
                        }
                      } catch {}
                    } else if (key.includes('heure')) {
                      // Pour les heures, formater uniquement l'heure
                      try {
                        const dateObj = new Date(raw);
                        if (!isNaN(dateObj.getTime())) {
                          valueDisplay = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                        }
                      } catch {}
                    } else if (typeof raw === 'string' && /T\d{2}:\d{2}:\d{2}/.test(raw)) {
                      type = 'datetime';
                      try { valueDisplay = new Date(raw).toLocaleString('fr-FR'); } catch {}
                    }

                    return (
                      <div key={key} className="grid items-center grid-cols-3 gap-3">
                        <label className="col-span-1 text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
                        <div className="col-span-2">
                          {type === 'checkbox' ? (
                            <input type="checkbox" checked={!!raw} disabled className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                          ) : (
                            <input
                              type="text"
                              value={String(valueDisplay ?? '-')}
                              disabled
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            <div className="flex justify-end px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
              <Button variant="secondary" size="sm" onClick={() => setDetailsOpen(false)} className="inline-flex items-center gap-2">
                <Icon name="close" size="sm" />
                <span>Fermer</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletedRecordsIndex;
