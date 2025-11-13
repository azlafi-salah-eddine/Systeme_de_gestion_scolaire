import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import Icon from './Icon';
import { useTheme } from '../contexts/ThemeContext';
import AnneeScolaireSelector from './AnneeScolaireSelector';
import { useAnneeScolaire } from '../contexts/AnneeScolaireContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout, isEleve } = useAuth();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { anneeActive, loading } = useAnneeScolaire();

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Déconnexion réussie', 'Vous avez été déconnecté avec succès');
      setShowUserMenu(false);
      navigate('/auth/login');
    } catch (error) {
      // En cas d'erreur, rediriger quand même vers la page de login
      setShowUserMenu(false);
      navigate('/auth/login');
    }
  };

  return (
    <header className="px-6 py-4 bg-white border-b border-gray-200 dark:bg-gray-950 dark:border-gray-900">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button and title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden sidebar-toggle [&>*]:pointer-events-none inline-flex items-center isolate relative h-9 w-9 px-1.5 before:content-[''] before:absolute before:-z-[1] before:h-5 before:w-5 hover:before:h-10 hover:before:w-10 before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300 before:-translate-x-1/2 before:-translate-y-1/2 before:top-1/2 before:left-1/2 before:bg-gray-200 dark:before:bg-gray-900"
          >
            <Icon className="text-2xl text-slate-600 dark:text-slate-300" name="menu" />
          </button>
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEleve() ? 'Espace Élève' : 'Système De Gestion Ecole'}
            </h1>
            {!loading && anneeActive && (
              <div className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-full shadow-sm dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700">
                {anneeActive.nom}
              </div>
            )}
            {!loading && !anneeActive && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-yellow-300 bg-yellow-50 text-yellow-800">
                <Icon name="alert" className="text-yellow-600" />
                <span className="text-[11px] sm:text-xs font-medium">Aucune année active</span>
                <a
                  href="/annees-scolaires"
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold text-yellow-900 bg-yellow-200 hover:bg-yellow-300"
                >
                  Gérer
                </a>
              </div>
            )}
            <AnneeScolaireSelector />
          </div>
        </div>

        {/* Right side - Profile */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-full w-9 h-9 hover:bg-gray-100 dark:hover:bg-gray-800 text-slate-600 dark:text-slate-300"
            aria-label="Toggle theme"
          >
            <Icon name={isDark ? 'moon' : 'sun'} className="text-lg leading-none" />
          </button>
          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 text-left"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-400 rounded-full">
                <Icon name="user" className="text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-medium leading-tight text-indigo-500">
                  {(() => {
                    const roleType = user?.role?.type || (user?.roles && user.roles[0]);
                    if (roleType === 'super_admin') return 'Super Administrateur';
                    if (roleType === 'admin') return 'Administrateur';
                    if (roleType === 'professeur') return 'Professeur';
                    if (roleType === 'eleve') return 'Élève';
                    return roleType || 'Utilisateur';
                  })()}
                </div>
                <div className="flex items-center text-sm font-semibold text-slate-800 dark:text-white">
                  {user?.nom && user?.prenom ? `${user.nom} ${user.prenom}` : user?.nom || user?.prenom || user?.name || 'Admin'}
                  <Icon name="chevron-down" className="ml-1 text-slate-500 dark:text-slate-300" />
                </div>
              </div>
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-52">
                <div className="py-1">
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/account'); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Icon name="user" size="sm" className="mr-2" />
                    Mon profil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Icon name="log-out" size="sm" className="mr-2" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
