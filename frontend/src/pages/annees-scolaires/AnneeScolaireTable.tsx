import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnneeScolaire } from '../../contexts/AnneeScolaireContext';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../../components/Icon';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

interface AnneeScolaireTableProps {
  anneesScolaires: any[];
  onEdit: (annee: any) => void;
  isAdmin: boolean;
}

const AnneeScolaireTable: React.FC<AnneeScolaireTableProps> = ({
  anneesScolaires,
  onEdit,
  isAdmin,
}) => {
  const { deleteAnneeScolaire, refreshAnneesScolaires } = useAnneeScolaire();
  const { user } = useAuth();
  const isSuperAdmin = !!user?.roles?.includes('super_admin');
  const navigate = useNavigate();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    anneeId: number | null;
    anneeNom: string;
  }>({
    isOpen: false,
    anneeId: null,
    anneeNom: '',
  });
  
  // Déterminer quelle année est actuelle (basée sur la date système)
  // Utiliser la même logique que Backend: Carbon::today() = date seulement (sans heure)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Réinitialiser l'heure à 00:00:00 pour comparer seulement la date
  
  const isAnneeActuelle = (annee: any) => {
    if (!annee.date_debut || !annee.date_fin) return false;
    const dateDebut = new Date(annee.date_debut);
    dateDebut.setHours(0, 0, 0, 0);
    const dateFin = new Date(annee.date_fin);
    dateFin.setHours(0, 0, 0, 0);
    return today >= dateDebut && today <= dateFin;
  };

  // Recherche et pagination (client-side)
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Helper function to extract year from nom or date_debut
  const getAnneeDebut = (annee: any): string => {
    if (annee.annee_debut) return String(annee.annee_debut);
    if (annee.nom && annee.nom.match(/^(\d{4})-\d{4}$/)) {
      const matches = annee.nom.match(/^(\d{4})-\d{4}$/);
      return matches ? matches[1] : '';
    }
    if (annee.date_debut) {
      return String(new Date(annee.date_debut).getFullYear());
    }
    return '';
  };

  const getAnneeFin = (annee: any): string => {
    if (annee.annee_fin) return String(annee.annee_fin);
    if (annee.nom && annee.nom.match(/^\d{4}-(\d{4})$/)) {
      const matches = annee.nom.match(/^\d{4}-(\d{4})$/);
      return matches ? matches[1] : '';
    }
    if (annee.date_fin) {
      return String(new Date(annee.date_fin).getFullYear());
    }
    return '';
  };

  const filteredAnnees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return anneesScolaires;
    return anneesScolaires.filter((annee) => {
      const nom = String(annee.nom ?? '').toLowerCase();
      const debut = getAnneeDebut(annee).toLowerCase();
      const fin = getAnneeFin(annee).toLowerCase();
      const desc = String(annee.description ?? '').toLowerCase();
      return (
        nom.includes(query) ||
        debut.includes(query) ||
        fin.includes(query) ||
        desc.includes(query)
      );
    });
  }, [anneesScolaires, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredAnnees.length / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredAnnees, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredAnnees.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAnnees = filteredAnnees.slice(startIndex, endIndex);


  const handleDelete = (id: number, nom: string) => {
    setConfirmationModal({
      isOpen: true,
      anneeId: id,
      anneeNom: nom,
    });
  };

  const confirmDelete = async () => {
    if (!confirmationModal.anneeId) return;
    
    setLoading(prev => ({ ...prev, [`delete-${confirmationModal.anneeId}`]: true }));
    try {
      const success = await deleteAnneeScolaire(confirmationModal.anneeId);
      if (success) {
        setConfirmationModal({ isOpen: false, anneeId: null, anneeNom: '' });
        await refreshAnneesScolaires();
      }
      } catch (e) {
      } finally {
      setLoading(prev => ({ ...prev, [`delete-${confirmationModal.anneeId}`]: false }));
    }
  };

  const cancelDelete = () => {
    setConfirmationModal({ isOpen: false, anneeId: null, anneeNom: '' });
  };

  if (anneesScolaires.length === 0) {
    return (
      <div className="py-12 text-center">
        <Icon name="calendar" className="w-12 h-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Aucune année scolaire
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Commencez par créer une nouvelle année scolaire.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <div className="flex items-center justify-between gap-4 p-4 mb-4">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Icon name="search" className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, année ou description..."
                className="block w-full py-2 pr-3 text-sm placeholder-gray-400 border border-gray-300 rounded-md pl-9 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
              <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Nom
            </th>
              <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Année Début
            </th>
              <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Année Fin
            </th>
              <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Date Début
            </th>
              <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Date Fin
            </th>
              <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">
              Description
            </th>
              <th className="px-3 py-2.5 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300">
              Actions
            </th>
          </tr>
        </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
          {paginatedAnnees.map((annee) => (
            <tr key={annee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-xs font-medium text-gray-900 dark:text-white">
                  {annee.nom}
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-xs text-gray-900 dark:text-white">
                  {getAnneeDebut(annee) || '-'}
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-xs text-gray-900 dark:text-white">
                  {getAnneeFin(annee) || '-'}
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-xs text-gray-900 dark:text-white">
                  {annee.date_debut ? new Date(annee.date_debut).toLocaleDateString('fr-FR') : '-'}
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-xs text-gray-900 dark:text-white">
                  {annee.date_fin ? new Date(annee.date_fin).toLocaleDateString('fr-FR') : '-'}
                </div>
              </td>
              <td className="px-3 py-2">
                  <div className="max-w-[200px] text-xs text-gray-900 truncate dark:text-white" title={annee.description}>
                  {annee.description || '-'}
                </div>
              </td>
              <td className="px-3 py-2 text-right">
                <div className="inline-flex items-center gap-2">
                  {isAnneeActuelle(annee) && (
                    <span 
                      className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      title="Année actuelle (basée sur la date système)"
                    >
                      Actuelle
                    </span>
                  )}
                  <button
                      className="p-2 text-blue-600 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800"
                    title="Voir"
                    aria-label="Voir"
                    onClick={() => navigate(`/annees-scolaires/${annee.id}`)}
                  >
                    <Icon name="eye" size="sm" />
                  </button>
                  {isAdmin && (
                    <>
                      <button
                          className="p-2 text-green-600 rounded-full hover:bg-green-50 dark:hover:bg-gray-800"
                        title="Modifier"
                        aria-label="Modifier"
                        onClick={() => navigate(`/annees-scolaires/${annee.id}/edit`)}
                      >
                        <Icon name="edit" size="sm" />
                      </button>
                      {!isAnneeActuelle(annee) && (
                        <button
                            className="p-2 text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-gray-800"
                          title="Supprimer (soft delete)"
                          aria-label="Supprimer"
                            onClick={() => handleDelete(annee.id, annee.nom)}
                          disabled={loading[`delete-${annee.id}`]}
                        >
                          {loading[`delete-${annee.id}`] ? (
                              <div className="w-4 h-4 border-b-2 border-red-600 rounded-full animate-spin"></div>
                          ) : (
                            <Icon name="trash" size="sm" />
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {paginatedAnnees.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500 dark:text-gray-400" colSpan={7}>
                {searchQuery ? 'Aucune année scolaire trouvée pour cette recherche' : 'Aucune année scolaire'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

        {(() => {
          const total = filteredAnnees.length;
          const totalPages = Math.max(1, Math.ceil(total / pageSize));
          const start = total === 0 ? 0 : (Math.min(currentPage, totalPages) - 1) * pageSize + 1;
          const end = Math.min(total, Math.min(currentPage, totalPages) * pageSize);
          return (
            <div className="flex items-center justify-between px-4 pb-4 mt-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Affichage {total === 0 ? 0 : start}-{end} sur {total}</div>
              <div className="inline-flex items-center gap-2">
                <button
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">Page {Math.min(currentPage, totalPages)} / {totalPages}</span>
                <button
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Suivant
                </button>
              </div>
            </div>
          );
        })()}

      {/* Modal de confirmation */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Supprimer l'année scolaire"
        message={`Êtes-vous sûr de vouloir supprimer l'année scolaire "${confirmationModal.anneeNom}"?
`}
        confirmText="Oui, supprimer"
        cancelText="Annuler"
        type="danger"
        loading={confirmationModal.anneeId ? loading[`delete-${confirmationModal.anneeId}`] : false}
      />
    </>
  );
};

export default AnneeScolaireTable;