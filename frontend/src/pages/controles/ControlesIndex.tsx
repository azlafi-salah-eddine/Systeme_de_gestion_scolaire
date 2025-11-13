import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import PageHead from '../../components/ui/PageHead';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useNotification } from '../../contexts/NotificationContext';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import { useAuth } from '../../contexts/AuthContext';
import AnneeScolaireFilter from '../../components/AnneeScolaireFilter';
import api from '../../services/api';

interface Controle {
  id: number;
  libelle: string;
  debut_controle: string;
  fin_controle: string;
  matiere_id: number;
  professeur_id: number;
  periode_id: number;
  instructions?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  matiere?: {
    id: number;
    nom: string;
  };
  professeur?: {
    id: number;
    nom: string;
    prenom: string;
  };
  periode?: {
    id: number;
    nom: string;
    date_debut: string;
    date_fin: string;
  };
}

const ControlesIndex: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { anneeActive } = useAnneeScolaire();
  const { user, isEleve } = useAuth();
  
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.role?.type === 'super_admin';
  const isEleveUser = isEleve();
  
  const [controles, setControles] = useState<Controle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnneeScolaire, setSelectedAnneeScolaire] = useState<number | undefined>(undefined);
  const pageSize = 10;
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    controle: Controle | null;
    loading: boolean;
  }>({
    isOpen: false,
    controle: null,
    loading: false,
  });

  // Mettre à jour le filtre avec l'année active quand elle est disponible (pour Admin/Prof)
  useEffect(() => {
    if (anneeActive) {
      // Pour Admin/Prof: toujours utiliser l'année active
      // Pour Super Admin: utiliser l'année active par défaut si aucune n'est sélectionnée
      if (!isSuperAdmin || !selectedAnneeScolaire) {
        setSelectedAnneeScolaire(anneeActive.id);
      }
    }
  }, [anneeActive, isSuperAdmin]);

  useEffect(() => {
    loadControles();
  }, [selectedAnneeScolaire]);

  const loadControles = async () => {
    try {
      setLoading(true);
      const params: any = {};
      // Ajouter le filtre d'année scolaire
      if (selectedAnneeScolaire) {
        params.annee_scolaire_id = selectedAnneeScolaire;
      }
      const response = await api.get('/v1/controles', { params });
      setControles(response.data?.data || []);
    } catch (error: any) {
      showError('Erreur', 'Erreur lors du chargement des contrôles');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (controle: Controle) => {
    setConfirmationModal({
      isOpen: true,
      controle,
      loading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmationModal.controle) return;

    setConfirmationModal(prev => ({ ...prev, loading: true }));

    try {
      const response = await api.delete(`/v1/controles/${confirmationModal.controle.id}`);
      if (response.data?.success) {
        showSuccess('Succès', 'Contrôle supprimé');
        loadControles();
        setConfirmationModal({
          isOpen: false,
          controle: null,
          loading: false,
        });
      } else {
        showError('Erreur', response.data?.message || 'Erreur lors de la suppression');
        setConfirmationModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error: any) {
      showError('Erreur', error.response?.data?.message || 'Erreur lors de la suppression');
      setConfirmationModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setConfirmationModal({
      isOpen: false,
      controle: null,
      loading: false,
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return dayNames[date.getDay()];
  };

  const formatDateWithDay = (dateString: string) => {
    const date = new Date(dateString);
    const dayName = formatDayOfWeek(dateString);
    const dateStr = date.toLocaleDateString('fr-FR');
    return `${dayName} ${dateStr}`;
  };

  const calculateDuration = (debut: string, fin: string) => {
    const start = new Date(debut);
    const end = new Date(fin);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 0) return '—';
    
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${mins}min`;
  };

  return (
    <div className="space-y-6">
      <PageHead
        title="Gestion des Contrôles"
        subtitle="Consultez et gérez tous vos contrôles"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Contrôles', link: '#' }
        ]}
      />

      {/* Actions */}
      {!isEleveUser && (
        <div className="flex items-center justify-end">
          <Link to="/controles/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Icon name="plus" size="sm" className="mr-2" />
              Nouveau contrôle
            </Button>
          </Link>
        </div>
      )}

      {/* Liste des contrôles */}
      <Card>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <div className="flex items-center justify-between gap-4 p-4 mb-4">
              <div className="flex-1 max-w-sm">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Icon name="search" className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Rechercher par libellé, matière, professeur ou période..."
                    className="block w-full py-2 pr-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-600 rounded-md pl-9 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="min-w-[200px]">
                <AnneeScolaireFilter
                  value={selectedAnneeScolaire}
                  onChange={(value) => setSelectedAnneeScolaire(value)}
                />
              </div>
            </div>
            <table className="w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Devoir</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Jour</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Heure</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Durée</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Niveau</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Matière</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Professeur</th>
                  <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Période</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                {(() => {
                  const q = searchQuery.trim().toLowerCase();
                  const filtered = q ? controles.filter((c) => 
                    (c.libelle || '').toLowerCase().includes(q) || 
                    (c.matiere?.nom || '').toLowerCase().includes(q) ||
                    (c.professeur?.nom || '').toLowerCase().includes(q) ||
                    (c.professeur?.prenom || '').toLowerCase().includes(q) ||
                    (c.periode?.nom || '').toLowerCase().includes(q)
                  ) : controles;
                  const total = filtered.length;
                  const totalPages = Math.max(1, Math.ceil(total / pageSize));
                  const safePage = Math.min(currentPage, totalPages);
                  const start = (safePage - 1) * pageSize;
                  const end = start + pageSize;
                  const pageItems = filtered.slice(start, end);
                  
                  if (total === 0) {
                    return (
                      <tr>
                        <td className="px-4 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={8}>
                          {controles.length === 0 ? (
                            <div className="py-12 text-center">
                              <Icon name="file-text" size="lg" className="mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                              <h3 className="text-lg font-medium text-gray-500 dark:text-white mb-2">
                                {isEleveUser ? 'Aucun contrôle disponible' : 'Aucun contrôle créé'}
                              </h3>
                              <p className="text-sm text-gray-400 dark:text-gray-400 mb-6">
                                {isEleveUser ? 'Aucun contrôle n\'a été programmé pour votre classe' : 'Commencez par créer votre premier contrôle'}
                              </p>
                              {!isEleveUser && (
                                <Link to="/controles/new">
                                  <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white">
                                    <Icon name="plus" size="sm" className="mr-2" />
                                    Créer mon premier contrôle
                                  </Button>
                                </Link>
                              )}
                            </div>
                          ) : (
                            <span className="dark:text-gray-400">Aucun résultat trouvé</span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                  
                  return pageItems.map((controle) => (
                    <tr key={controle.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
                      <td className="px-3 py-2 font-medium text-slate-800 dark:text-white">
                        {controle.libelle}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-gray-400">
                        <div className="font-medium">
                          {formatDateWithDay(controle.debut_controle)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-gray-400">
                        <div>
                          <div className="font-medium">
                            {new Date(controle.debut_controle).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} - {new Date(controle.fin_controle).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-gray-400">
                        <div className="font-medium text-blue-600 dark:text-blue-400">
                          {calculateDuration(controle.debut_controle, controle.fin_controle)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-gray-400">
                        {controle.matiere?.niveau?.nom || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-gray-400">
                        {controle.matiere?.nom || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-gray-400">
                        {controle.professeur ? `${controle.professeur.prenom} ${controle.professeur.nom}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-gray-400">
                        <div>
                          <div className="font-medium text-blue-600 dark:text-blue-400">
                            {controle.periode?.nom || '—'}
                          </div>
                          {controle.periode && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(controle.periode.date_debut).toLocaleDateString('fr-FR')} - {new Date(controle.periode.date_fin).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {!isEleveUser && (
                          <div className="inline-flex items-center gap-2">
                            <Link
                              to={`/controles/${controle.id}`}
                              className="p-2 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                              title="Voir"
                            >
                              <Icon name="eye" size="sm" />
                            </Link>
                            <Link
                              to={`/controles/${controle.id}/edit`}
                              className="p-2 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title="Modifier"
                            >
                              <Icon name="edit" size="sm" />
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(controle)}
                              className="p-2 text-red-600 dark:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              title="Supprimer"
                            >
                              <Icon name="trash" size="sm" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
            {(() => {
              const q = searchQuery.trim().toLowerCase();
              const filtered = q ? controles.filter((c) => 
                (c.libelle || '').toLowerCase().includes(q) || 
                (c.matiere?.nom || '').toLowerCase().includes(q) ||
                (c.professeur?.nom || '').toLowerCase().includes(q) ||
                (c.professeur?.prenom || '').toLowerCase().includes(q)
              ) : controles;
              const total = filtered.length;
              const totalPages = Math.max(1, Math.ceil(total / pageSize));
              const start = total === 0 ? 0 : (Math.min(currentPage, totalPages) - 1) * pageSize + 1;
              const end = Math.min(total, Math.min(currentPage, totalPages) * pageSize);
              
              if (total === 0) return null;
              
              return (
                <div className="flex items-center justify-between px-4 pb-4 mt-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Affichage {start}-{end} sur {total}
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <button 
                      className="px-3 py-1 text-sm text-gray-700 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" 
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
                      disabled={currentPage <= 1}
                    >
                      Précédent
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {Math.min(currentPage, totalPages)} / {totalPages}
                    </span>
                    <button 
                      className="px-3 py-1 text-sm text-gray-700 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700" 
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} 
                      disabled={currentPage >= totalPages}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Card>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le contrôle"
        message={
          confirmationModal.controle
            ? `Êtes-vous sûr de vouloir supprimer le contrôle "${confirmationModal.controle.libelle}" ?\n\nCette action est irréversible.`
            : ''
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        loading={confirmationModal.loading}
      />
    </div>
  );
};

export default ControlesIndex;
