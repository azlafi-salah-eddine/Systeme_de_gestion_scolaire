import React from 'react';
import { useAnneeScolaire } from '../contexts/AnneeScolaireContext';
import { useAuth } from '../contexts/AuthContext';

interface AnneeScolaireFilterProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  className?: string;
}

const AnneeScolaireFilter: React.FC<AnneeScolaireFilterProps> = ({ value, onChange, className = '' }) => {
  const { anneeActive, anneesScolaires } = useAnneeScolaire();
  const { user } = useAuth();
  
  const isSuperAdmin = user?.roles?.includes('super_admin') || user?.role?.type === 'super_admin';

  // Pour Admin/Prof: utiliser toujours l'année active
  // Pour Super Admin: permettre le choix
  const availableAnnees = isSuperAdmin 
    ? anneesScolaires.filter(a => a.active) // Toutes les années visibles (non supprimées)
    : anneeActive 
      ? [anneeActive] 
      : [];

  // Pour Admin/Prof: forcer l'année active
  React.useEffect(() => {
    if (!isSuperAdmin && anneeActive && value !== anneeActive.id) {
      onChange(anneeActive.id);
    }
  }, [isSuperAdmin, anneeActive, value, onChange]);

  return (
    <div className={className}>
      <label htmlFor="annee_scolaire_filter" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Année scolaire
      </label>
      <select
        id="annee_scolaire_filter"
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : undefined)}
        disabled={!isSuperAdmin && !!anneeActive}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {availableAnnees.length === 0 ? (
          <option value="">Aucune année disponible</option>
        ) : (
          availableAnnees.map(annee => (
            <option key={annee.id} value={annee.id}>
              {annee.nom}
            </option>
          ))
        )}
      </select>
    </div>
  );
};

export default AnneeScolaireFilter;

