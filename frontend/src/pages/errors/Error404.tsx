import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

const Error404: React.FC = () => {
  const { user, isProfesseur, isEleve } = useAuth();
  let defaultLink = '/dashboard';
  if (isProfesseur() && user?.professeur_id) {
    defaultLink = `/professeurs/${user.professeur_id}/timetable`;
  } else if (isEleve() && user?.classe_id) {
    defaultLink = `/classes/${user.classe_id}/emplois-du-temps/preview`;
  }
  return (
    <div className="fixed inset-0 w-screen h-screen text-sm font-normal leading-relaxed bg-white dark:bg-gray-1000 font-body text-slate-600 dark:text-slate-300 z-[9999]">
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center py-8 px-4 max-w-[520px]">
          <div className="mb-15">
            <h1 className="text-[160px] font-heading font-bold leading-tighter -tracking-wider mb-2 text-transparent bg-clip-text bg-gradient-to-b from-primary-600 to-primary-900 opacity-90">404</h1>
          </div>
          <h3 className="font-heading font-bold text-2xl lg:text-3xl leading-tighter tracking-tight text-slate-700 dark:text-white pb-4">
            Oops! Pourquoi êtes-vous ici ?
          </h3>
          <p className="text-base text-slate-600 dark:text-slate-400 mb-6">
            Nous sommes désolés pour le désagrément. Il semble que vous essayez d'accéder à une page qui n'existe pas ou qui a été supprimée.
          </p>
          <Link to={defaultLink}>
            <Button variant="primary" size="lg" className="mt-3 inline-flex items-center gap-2">
              <Icon name="arrow-left" size="sm" />
              Retour à ma page principale
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Error404;

