import React, { Fragment } from 'react';
import { Menu } from '@headlessui/react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components';
import Avatar from './ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const UserDropdown: React.FC = () => {
  const { user, logout, isSuperAdmin } = useAuth();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();

  const getUserRole = () => {
    const roleType = user?.role?.type || (user?.roles && user.roles[0]);
    if (roleType === 'super_admin') return 'Super Administrateur';
    if (roleType === 'admin') return 'Administrateur';
    if (roleType === 'professeur') return 'Professeur';
    if (roleType === 'eleve') return 'Élève';
    return 'Utilisateur';
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Déconnexion réussie', 'Vous avez été déconnecté avec succès');
      navigate('/auth/login');
    } catch (error) {
      // En cas d'erreur, rediriger quand même vers la page de login
      navigate('/auth/login');
    }
  };

  const getUserInitials = () => {
    if (user?.nom && user?.prenom) {
      return `${user.nom[0]}${user.prenom[0]}`.toUpperCase();
    }
    if (user?.nom) return user.nom[0].toUpperCase();
    if (user?.prenom) return user.prenom[0].toUpperCase();
    if (user?.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.name[0].toUpperCase();
    }
    return 'A';
  };

  const getUserDisplayName = () => {
    if (user?.nom && user?.prenom) {
      return `${user.nom} ${user.prenom}`;
    }
    return user?.nom || user?.prenom || user?.name || 'Admin';
  };

  const isSuper = isSuperAdmin();

  return (
    <Menu as="div" className="relative dropdown">
      {() => (
        <>
          <Menu.Button className={`dropdown-toggle [&>*]:pointer-events-none peer inline-flex items-center group`}>
            <div className="flex items-center">
              <Avatar text={getUserInitials()} size="sm" variant="primary" />
              <div className="hidden md:block ms-4 text-start">
                <div className="text-xs font-medium leading-none pt-0.5 pb-1.5 text-primary-500 dark:text-primary-400 group-hover:text-primary-600 dark:group-hover:text-primary-500">
                  {getUserRole()}
                </div>
                <div className="flex items-center text-xs font-bold text-slate-600 dark:text-white">
                  {getUserDisplayName()}
                  <Icon name="chevron-down" className="text-sm leading-none ms-1 text-slate-400 dark:text-slate-300" />
                </div>
              </div>
            </div>
          </Menu.Button>
          
          <Menu.Items modal={false} className="dropdown-menu absolute end-0 top-full mt-2.5 max-xs:min-w-[200px] max-xs:max-w-[200px] min-w-[220px] max-w-[220px] border border-t-3 border-gray-200 dark:border-gray-700 border-t-primary-600 dark:border-t-primary-500 bg-white dark:bg-gray-800 rounded shadow z-[1000]">
            {/* User Info Header */}
            <div className="hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700 sm:block bg-slate-50 dark:bg-gray-900/50">
              <div className="flex items-center">
                <Avatar text={getUserInitials()} size="sm" variant="primary" />
                <div className="flex flex-col ms-3 text-start">
                  <span className="text-xs font-bold text-slate-700 dark:text-white">
                    {getUserDisplayName()}
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-400 dark:text-gray-400">
                    {user?.email || 'admin@school.com'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Menu Items */}
            <ul className="py-2">
              {/* Lien compte / profil selon rôle */}
              <li>
                <Menu.Item as={Fragment}>
                  <Link 
                    className="relative px-4 py-1.5 flex items-center rounded-[inherit] text-xs leading-4 font-medium text-slate-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300" 
                    to="/account"
                  >
                    <Icon className="w-2 text-sm leading-none" name="user" />
                    <span className="ms-2">Mon Compte</span>
                  </Link>
                </Menu.Item>
              </li>
              
             
              
              {/* Separator */}
              {isSuper && (
                <li className="block my-1.5 border-t border-gray-200 dark:border-gray-700"></li>
              )}
              
              {/* Années Scolaires - Super Admin seulement */}
              {isSuper && (
                <li>
                  <Menu.Item as={Fragment}>
                    <Link 
                      className="relative px-4 py-1.5 flex items-center rounded-[inherit] text-xs leading-4 font-medium text-slate-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300" 
                      to="/annees-scolaires"
                    >
                      <Icon className="w-2 text-sm leading-none" name="calendar" />
                      <span className="ms-2">Années Scolaires</span>
                    </Link>
                  </Menu.Item>
                </li>
              )}
              
              {/* Administrateurs - Super Admin seulement */}
              {isSuper && (
                <li>
                  <Menu.Item as={Fragment}>
                    <Link 
                      className="relative px-4 py-1.5 flex items-center rounded-[inherit] text-xs leading-4 font-medium text-slate-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300" 
                      to="/settings/admins"
                    >
                      <Icon className="w-2 text-sm leading-none" name="users" />
                      <span className="ms-2">Administrateurs</span>
                    </Link>
                  </Menu.Item>
                </li>
              )}
              
              {/* Corbeille - Super Admin seulement */}
              {isSuper && (
                <li>
                  <Menu.Item as={Fragment}>
                    <Link 
                      className="relative px-4 py-1.5 flex items-center rounded-[inherit] text-xs leading-4 font-medium text-slate-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300" 
                      to="/admin/deleted-records"
                    >
                      <Icon className="w-2 text-sm leading-none" name="trash" />
                      <span className="ms-2">Corbeille</span>
                    </Link>
                  </Menu.Item>
                </li>
              )}
              
              {/* Separator */}
              <li className="block my-1.5 border-t border-gray-200 dark:border-gray-700"></li>
              
              {/* Logout */}
              <li>
                <Menu.Item as={Fragment}>
                  <button 
                    onClick={handleLogout}
                    className="w-full relative px-4 py-1.5 flex items-center rounded-[inherit] text-xs leading-4 font-medium text-slate-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300"
                  >
                    <Icon className="w-2 text-sm leading-none" name="log-out" />
                    <span className="ms-2">Se déconnecter</span>
                  </button>
                </Menu.Item>
              </li>
            </ul>
          </Menu.Items>
        </>
      )}
    </Menu>
  );
};

export default UserDropdown;
