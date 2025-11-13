import React, { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames';
import { useAuth } from '../contexts/AuthContext';
import { useAnneeScolaire } from '../contexts/AnneeScolaireContext';
import { useLocation } from 'react-router-dom';
import { Icon } from '../components';
import Sidebar from '../components/Sidebar';
import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { logout, isBackendOffline, isEleve } = useAuth();
  const { anneeActive, loading } = useAnneeScolaire();
  const location = useLocation();
  const [sidebarMobile, setSidebarMobile] = useState(false);
  const [sidebarVisibility, setSidebarVisibility] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(false);

  // Mapping des routes aux titres pour le navigateur
  const pageTitle = useMemo(() => {
    const path = location.pathname;
    
    // Routes exactes
    if (path === '/dashboard') return 'Tableau de bord';
    if (path === '/account') return 'Mon compte';
    
    // Routes avec paramètres - doivent être vérifiées avant les routes simples
    if (path.match(/^\/eleves\/\d+\/notes$/)) return 'Notes de l\'élève';
    if (path.match(/^\/eleves\/\d+\/edit$/)) return 'Modifier l\'élève';
    if (path.match(/^\/eleves\/\d+$/)) return 'Détails de l\'élève';
    if (path === '/eleves/new') return 'Nouvel élève';
    if (path === '/eleves') return 'Élèves';
    
    if (path.match(/^\/classes\/\d+\/emplois-du-temps\/new$/)) return 'Nouvel emploi du temps';
    if (path.match(/^\/classes\/\d+\/emplois-du-temps$/)) return 'Emploi du temps';
    if (path.match(/^\/classes\/\d+\/edit$/)) return 'Modifier la classe';
    if (path.match(/^\/classes\/\d+$/)) return 'Détails de la classe';
    if (path === '/classes/new') return 'Nouvelle classe';
    if (path === '/classes') return 'Classes';
    
    if (path.match(/^\/professeurs\/\d+\/timetable$/)) return 'Emploi du temps du professeur';
    if (path.match(/^\/professeurs\/\d+\/edit$/)) return 'Modifier le professeur';
    if (path.match(/^\/professeurs\/\d+$/)) return 'Détails du professeur';
    if (path === '/professeurs/new') return 'Nouveau professeur';
    if (path === '/professeurs/classes') return 'Classes des professeurs';
    if (path === '/professeurs/matieres') return 'Matières des professeurs';
    if (path === '/professeurs') return 'Professeurs';
    
    if (path.match(/^\/parents\/\d+\/edit$/)) return 'Modifier le parent';
    if (path.match(/^\/parents\/\d+$/)) return 'Détails du parent';
    if (path === '/parents') return 'Parents';
    
    if (path.match(/^\/matieres\/\d+\/edit$/)) return 'Modifier la matière';
    if (path.match(/^\/matieres\/\d+$/)) return 'Détails de la matière';
    if (path === '/matieres/new') return 'Nouvelle matière';
    if (path === '/matieres') return 'Matières';
    
    if (path.match(/^\/salles\/\d+\/edit$/)) return 'Modifier la salle';
    if (path.match(/^\/salles\/\d+$/)) return 'Détails de la salle';
    if (path === '/salles/new') return 'Nouvelle salle';
    if (path === '/salles') return 'Salles';
    
    if (path.match(/^\/niveaux\/\d+\/edit$/)) return 'Modifier le niveau';
    if (path.match(/^\/niveaux\/\d+$/)) return 'Détails du niveau';
    if (path === '/niveaux/new') return 'Nouveau niveau';
    if (path === '/niveaux') return 'Niveaux';
    
    if (path.match(/^\/controles\/\d+\/edit$/)) return 'Modifier le contrôle';
    if (path.match(/^\/controles\/\d+$/)) return 'Détails du contrôle';
    if (path === '/controles/new') return 'Nouveau contrôle';
    if (path === '/controles') return 'Contrôles';
    
    if (path.match(/^\/notes\/classe\/\d+\/manage$/)) return 'Gérer les notes';
    if (path.match(/^\/notes\/\d+\/edit$/)) return 'Modifier la note';
    if (path === '/notes/new') return 'Nouvelle note';
    if (path === '/notes') return 'Notes';
    
    if (path.match(/^\/frais-scolaires\/\d+\/edit$/)) return 'Modifier le frais scolaire';
    if (path.match(/^\/frais-scolaires\/\d+$/)) return 'Détails du frais scolaire';
    if (path === '/frais-scolaires/new') return 'Nouveau frais scolaire';
    if (path === '/frais-scolaires') return 'Frais scolaires';
    
    if (path.match(/^\/paiements-eleves\/\d+\/paiement$/)) return 'Paiement';
    if (path.match(/^\/paiements-eleves\/\d+$/)) return 'Détails du paiement';
    if (path === '/paiements-eleves') return 'Paiements élèves';
    
    if (path.match(/^\/transports\/\d+\/edit$/)) return 'Modifier le transport';
    if (path.match(/^\/transports\/\d+$/)) return 'Détails du transport';
    if (path === '/transports/new') return 'Nouveau transport';
    if (path === '/transports') return 'Transports';
    
    if (path.match(/^\/chauffeurs\/\d+\/edit$/)) return 'Modifier le chauffeur';
    if (path.match(/^\/chauffeurs\/\d+$/)) return 'Détails du chauffeur';
    if (path === '/chauffeurs/new') return 'Nouveau chauffeur';
    if (path === '/chauffeurs') return 'Chauffeurs';
    
    if (path.match(/^\/accompagnateurs\/\d+\/edit$/)) return 'Modifier l\'accompagnateur';
    if (path.match(/^\/accompagnateurs\/\d+$/)) return 'Détails de l\'accompagnateur';
    if (path === '/accompagnateurs/new') return 'Nouvel accompagnateur';
    if (path === '/accompagnateurs') return 'Accompagnateurs';
    
    if (path.match(/^\/cantines\/\d+\/edit$/)) return 'Modifier la cantine';
    if (path.match(/^\/cantines\/\d+$/)) return 'Détails de la cantine';
    if (path === '/cantines/new') return 'Nouvelle cantine';
    if (path === '/cantines') return 'Cantines';
    
    if (path.match(/^\/menus\/\d+\/edit$/)) return 'Modifier le menu';
    if (path.match(/^\/menus\/\d+$/)) return 'Détails du menu';
    if (path === '/menus/new') return 'Nouveau menu';
    if (path === '/menus') return 'Menus';
    
    if (path.match(/^\/annees-scolaires\/\d+\/edit$/)) return 'Modifier l\'année scolaire';
    if (path.match(/^\/annees-scolaires\/\d+$/)) return 'Détails de l\'année scolaire';
    if (path === '/annees-scolaires/new') return 'Nouvelle année scolaire';
    if (path === '/annees-scolaires') return 'Années scolaires';
    
    if (path.match(/^\/activites\/\d+\/edit$/)) return 'Modifier l\'activité';
    if (path.match(/^\/activites\/\d+$/)) return 'Détails de l\'activité';
    if (path === '/activites/new') return 'Nouvelle activité';
    if (path === '/activites') return 'Activités';
    
    if (path.match(/^\/eleves\/absences\/\d+\/justify$/)) return 'Justifier l\'absence';
    if (path.match(/^\/eleves\/absences\/\d+\/edit$/)) return 'Modifier l\'absence';
    if (path.match(/^\/eleves\/absences\/\d+$/)) return 'Détails de l\'absence';
    if (path === '/absences/new') return 'Nouvelle absence';
    if (path === '/absences' || path.startsWith('/absences/') || path.startsWith('/eleves/absences/')) return 'Absences';
    
    if (path === '/emplois-du-temps') return 'Emplois du temps';
    
    if (path === '/admin/deleted-records') return 'Enregistrements supprimés';
    if (path.match(/^\/settings\/admins\/\d+\/edit$/)) return 'Modifier l\'administrateur';
    if (path.match(/^\/settings\/admins\/\d+$/)) return 'Détails de l\'administrateur';
    if (path === '/settings/admins/new') return 'Nouvel administrateur';
    if (path === '/settings/admins') return 'Administrateurs';
    
    // Par défaut
    return 'Système De Gestion Ecole';
  }, [location.pathname]);

  // Mettre à jour le titre de la page du navigateur
  useEffect(() => {
    document.title = `${pageTitle} - Système De Gestion Ecole`;
  }, [pageTitle]);

  useEffect(() => {
    sidebarVisibility ? document.body.classList.add('overflow-hidden') : document.body.classList.remove('overflow-hidden');
  }, [sidebarVisibility])

  useEffect(() => {
    const handleMobileSidebar = () => {
      if (window.innerWidth < 1200) {
        setSidebarMobile(true);
      } else {
        setSidebarMobile(false);
        setSidebarVisibility(false)
      }
    }

    handleMobileSidebar();
    window.addEventListener('resize', handleMobileSidebar);
    return () => {
      window.removeEventListener('resize', handleMobileSidebar);
    };
  }, []);

  const sidebarClasses = classNames({
    "nk-sidebar group/sidebar peer fixed w-72 [&.is-compact:not(.has-hover)]:w-[74px] min-h-screen max-h-screen overflow-hidden h-full start-0 top-0 z-[1031] transition-[transform,width] duration-300 -translate-x-full rtl:translate-x-full xl:translate-x-0 xl:rtl:translate-x-0 [&.sidebar-visible]:translate-x-0": true,
    "sidebar-visible": sidebarVisibility,
    "nk-sidebar-mobile": sidebarMobile,
    "is-compact": sidebarCompact,
    "dark": true // Template dark mode
  });

  return (
    <>
      <div className="nk-main">
        {/* Sidebar */}
        <div className={sidebarClasses}>
          {/* Sidebar Header - Template Style */}
          <div className="flex items-center h-16 min-w-full px-6 py-3 overflow-hidden bg-white border-b border-gray-200 w-72 border-e dark:bg-gray-950 dark:border-gray-900">
            <div className="-ms-1 me-4">
              <div className="hidden xl:block">
                <button 
                  onClick={() => setSidebarCompact(!sidebarCompact)}
                  className="sidebar-compact-toggle [&>*]:pointer-events-none inline-flex items-center isolate relative h-9 w-9 px-1.5 before:content-[''] before:absolute before:-z-[1] before:h-5 before:w-5 hover:before:h-10 hover:before:w-10 before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300 before:-translate-x-1/2 before:-translate-y-1/2 before:top-1/2 before:left-1/2 before:bg-gray-200 dark:before:bg-gray-900"
                >
                  <Icon className="text-2xl text-slate-600 dark:text-slate-300" name="menu" />
                </button>
              </div>
              <div className="xl:hidden">
                <button 
                  onClick={() => setSidebarVisibility(!sidebarVisibility)}
                  className="sidebar-toggle [&>*]:pointer-events-none inline-flex items-center isolate relative h-9 w-9 px-1.5 before:content-[''] before:absolute before:-z-[1] before:h-5 before:w-5 hover:before:h-10 hover:before:w-10 before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300 before:-translate-x-1/2 before:-translate-y-1/2 before:top-1/2 before:left-1/2 before:bg-gray-200 dark:before:bg-gray-900"
                >
                  <Icon className="text-2xl text-slate-600 dark:text-slate-300 rtl:-scale-x-100" name="arrow-left" />
                </button>
              </div>
            </div>
            <div className="relative flex flex-shrink-0">
              <div className="relative inline-block transition-opacity duration-300 h-9 group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0">
                {/* School logo with graduation caps */}
                <div className="flex items-center h-full space-x-2">
                  
                  <span className="text-lg font-bold text-slate-800 dark:text-white">Menu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Body - Template Style with Submenus */}
          <div className="relative w-full max-h-full overflow-hidden bg-white border-gray-200 nk-sidebar-body dark:bg-gray-950 border-e dark:border-gray-900">
            <div className="flex flex-col w-full h-[calc(100vh-theme(spacing.16))]">
              <div className="h-full pt-4 pb-10 overflow-y-auto no-scrollbar">
                <Sidebar setSidebarVisibility={setSidebarVisibility} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="nk-wrap xl:ps-72 [&>.nk-header]:xl:start-72 [&>.nk-header]:xl:w-[calc(100%-theme(spacing.72))] peer-[&.is-compact:not(.has-hover)]:xl:ps-[74px] peer-[&.is-compact:not(.has-hover)]:[&>.nk-header]:xl:start-[74px] peer-[&.is-compact:not(.has-hover)]:[&>.nk-header]:xl:w-[calc(100%-74px)] flex flex-col min-h-screen transition-all duration-300">
          {/* Header - Template Style */}
          <div className="nk-header fixed start-0 w-full h-16 top-0 z-[1021] transition-all duration-300 min-w-[320px]">
            <div className="h-16 px-6 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-900">
              <div className="container max-w-none">
                <div className="relative flex items-center justify-between h-full">
                  {/* Mobile menu button */}
                  <div className="xl:hidden">
                    <button 
                      onClick={() => setSidebarVisibility(!sidebarVisibility)}
                      className="sidebar-toggle [&>*]:pointer-events-none inline-flex items-center isolate relative h-9 w-9 px-1.5 before:content-[''] before:absolute before:-z-[1] before:h-5 before:w-5 hover:before:h-10 hover:before:w-10 before:rounded-full before:opacity-0 hover:before:opacity-100 before:transition-all before:duration-300 before:-translate-x-1/2 before:-translate-y-1/2 before:top-1/2 before:left-1/2 before:bg-gray-200 dark:before:bg-gray-900"
                    >
                      <Icon className="text-2xl text-slate-600 dark:text-slate-300" name="menu" />
                    </button>
                  </div>
                  
                  {/* Title - Centered */}
                  <div className="flex justify-center flex-1">
                    <div className="flex items-center space-x-2">
                      <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {isEleve() ? 'Espace Élève' : 'Système De Gestion Ecole'}
                      </h1>
                      {!loading && anneeActive && (
                        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 shadow-sm dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700">
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
                    </div>
                  </div>
                  
                  {/* User actions - Right aligned */}
                  <div className="px-1 py-3.5 ms-auto">
                    <ul className="flex item-center -mx-1.5 sm:-mx-2.5">
                      {isBackendOffline && (
                        <li className="px-1.5 sm:px-2.5">
                          <span className="px-2 py-1 text-xs text-yellow-800 bg-yellow-100 border border-yellow-300 rounded">Hors ligne</span>
                        </li>
                      )}
                      
                      {/* User profile - Template style */}
                      <li className="px-1.5 sm:px-2.5 inline-flex">
                        <UserDropdown />
                      </li>
                      
                      {/* Dark Mode Toggle */}
                      <li className="px-1.5 sm:px-2.5 inline-flex">
                        <DarkModeToggle />
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="nk-content mt-16 px-1.5 sm:px-5 py-6 sm:py-8 bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-theme(spacing.16))]">
            <div className="container max-w-none">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      <div 
        onClick={() => setSidebarVisibility(false)} 
        className="sidebar-toggle fixed inset-0 bg-slate-950 bg-opacity-20 z-[1030] opacity-0 invisible peer-[.sidebar-visible]:opacity-100 peer-[.sidebar-visible]:visible xl:!opacity-0 xl:!invisible"
      />
    </>
  );
};

export default MainLayout;
