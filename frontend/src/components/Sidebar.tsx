import React, { Fragment, useState } from 'react';
import { NavLink } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../contexts/AuthContext';

// Menu data adapted for school management system based on backend API endpoints
const menuData = [
    { heading: "Tableau de Bord" },
    { icon: "home", text: "Accueil", link: "/dashboard" },
    
    { heading: "Gestion Académique" },
    { 
        icon: "users", 
        text: "Élèves", 
        link: "#",
        sub: [
            { text: "Nouveau élève", link: "/eleves/new" },
            { text: "Liste des élèves", link: "/eleves" },
        ]
    },
    { 
        icon: "notes", 
        text: "Notes", 
        link: "#",
        sub: [
            { text: "Gérer les notes", link: "/notes" },
        ]
    },
    { 
        icon: "file-text", 
        text: "Contrôles", 
        link: "#",
        sub: [
            { text: "Nouveau contrôle", link: "/controles/new" },
            { text: "Liste des contrôles", link: "/controles" },
        ]
    },
    { 
        icon: "calendar-times", 
        text: "Absences", 
        link: "#",
        sub: [
            { text: "Nouvelle absence", link: "/absences/new" },
            { text: "Liste des absences", link: "/absences" },
        ],
        forProfesseur: "direct" // Pour les professeurs, c'est un lien direct vers la liste des absences
    },
    { 
        icon: "users", 
        text: "Parents", 
        link: "#",
        sub: [
            { text: "Liste des parents", link: "/parents" }
        ]
    },
    { 
        icon: "users", 
        text: "Professeurs", 
        link: "#",
        sub: [
            { text: "Nouveau professeur", link: "/professeurs/new" },
            { text: "Liste des professeurs", link: "/professeurs" },
            { text: "Classes assignées", link: "/professeurs/classes" },
            { text: "Matières assignées", link: "/professeurs/matieres" },
        ]
    },
    { 
        icon: "graduation-cap", 
        text: "Classes", 
        link: "#",
        sub: [
            { text: "Nouveau classe", link: "/classes/new" },
            { text: "Liste des classes", link: "/classes" },
        ],
        forProfesseur: "direct" // Pour les professeurs, c'est un lien direct vers la liste des classes
    },
    { 
        icon: "calendar", 
        text: "Emplois du temps", 
        link: "/emplois-du-temps",
        sub: [
            { text: "Emplois du temps", link: "/emplois-du-temps" },
            { text: "Salles", link: "/salles" },
        ],
        forProfesseur: "direct" // Pour les professeurs, c'est un lien direct vers leur emploi du temps
    },
    { 
        icon: "book", 
        text: "Matières", 
        link: "#",
        sub: [
            { text: "Nouvelle matière", link: "/matieres/new" },
            { text: "Liste des matières", link: "/matieres" },
        ]
    },
    { 
        icon: "levels", 
        text: "Niveaux", 
        link: "#",
        sub: [
            { text: "Nouveau niveau", link: "/niveaux/new" },
            { text: "Liste des niveaux", link: "/niveaux" }
        ]
    },
    { 
        icon: "star", 
        text: "Activités Parascolaires", 
        link: "#",
        sub: [
            { text: "Nouvelle activité", link: "/activites/new" },
            { text: "Liste des activités", link: "/activites" },
        ]
    },
    { heading: "Finances" },
    { 
        icon: "credit-card", 
        text: "Paiements", 
        link: "#",
        sub: [
            { text: "Frais Scolaires", link: "/frais-scolaires" },
            { text: "Paiements Élèves", link: "/paiements-eleves" },
        ]
    },
    { heading: "Services" },
    { 
        icon: "utensils", 
        text: "Cantine", 
        link: "#",
        sub: [
            { text: "Gestion cantine", link: "/cantines" },
            { text: "Menus", link: "/menus" }
        ]
    },
    { 
        icon: "truck", 
        text: "Transport", 
        link: "#",
        sub: [
            { text: "Gestion transport", link: "/transports" },
            { text: "Chauffeurs", link: "/chauffeurs" },
            { text: "Accompagnateurs", link: "/accompagnateurs" }
        ]
    },
    
    
 
    
    { heading: "Canaux de communication" },
    { 
        icon: "mail", 
        text: "Notifications par SMS", 
        link: "#",
        sub: [
            { text: "Envoi de SMS", link: "/sms/send" },
            { text: "Historique des messages", link: "/sms/history" }
        ]
    },

    
    

    { heading: "Paramètres" },
    { icon: "trash", text: "Corbeille", link: "/admin/deleted-records" },
    { icon: "calendar", text: "Années Scolaires", link: "/annees-scolaires" },
    { icon: "users", text: "Administrateurs", link: "/settings/admins" },
    { icon: "user", text: "Mon Compte", link: "/account" },
];

// Pour professeurs : commencer par Emplois du temps, puis Classes, Absences, Notes, Contrôles
const professeurDirectItems = ['Emplois du temps', 'Classes', 'Absences', 'Notes', 'Contrôles'];

interface SidebarProps {
    setSidebarVisibility: (visible: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ setSidebarVisibility }) => {
    const { isSuperAdmin, user, isEleve } = useAuth();
    const isProfesseur = user?.role?.type === 'professeur' || (user?.roles || []).includes('professeur');
    const [openGroups, setOpenGroups] = useState<{ [key: number]: boolean }>({});

    // Menu toggle function like in template
    const menuToggle = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        setOpenGroups(prev => {
            const newState = {
                ...prev,
                [index]: !prev[index]
            };
            return newState;
        });
    };

    // Close siblings function like in template
    const closeSiblings = (index: number) => {
        setOpenGroups(prev => {
            const newState = { ...prev };
            Object.keys(newState).forEach(key => {
                if (parseInt(key) !== index) {
                    newState[parseInt(key)] = false;
                }
            });
            return newState;
        });
    };

    // Fonction pour filtrer les sous-menus (définie avant isItemAccessible)
    const filterSubItems = (subItems: any[]): any[] => {
        if (!isProfesseur) {
            // Pour les non-professeurs, filtrer les items réservés aux professeurs
            return subItems.filter((sub: any) => !sub.forProfesseur);
        }
        
        // Pour les professeurs, filtrer les sous-menus
        return subItems.filter((sub: any) => {
            // Montrer les items réservés aux professeurs
            if (sub.forProfesseur) {
                return true;
            }
            
            // Ne pas montrer les routes de création/modification pour les professeurs
            if (sub.link?.includes('/new') || sub.link?.includes('/edit')) {
                return false;
            }
            // Ne pas montrer la liste complète des professeurs pour les professeurs
            if (sub.link === '/professeurs' && (sub.text === 'Liste des professeurs' || sub.text?.includes('Liste'))) {
                return false;
            }
            // Ne pas montrer "Nouveau professeur"
            if (sub.link === '/professeurs/new') {
                return false;
            }
            // Ne pas montrer "Nouveau élève"
            if (sub.link === '/eleves/new') {
                return false;
            }
            // Ne pas montrer "Nouvelle absence"
            if (sub.link === '/absences/new') {
                return false;
            }
            // Ne pas montrer "Nouveau contrôle"
            if (sub.link === '/controles/new') {
                return false;
            }
            // Ne pas montrer "Nouvelle classe"
            if (sub.link === '/classes/new') {
                return false;
            }
            // Ne pas montrer "Nouvelle matière"
            if (sub.link === '/matieres/new') {
                return false;
            }
            // Ne pas montrer "Nouveau niveau"
            if (sub.link === '/niveaux/new') {
                return false;
            }
            // Ne pas montrer "Nouvelle activité"
            if (sub.link === '/activites/new') {
                return false;
            }
            // Ne pas montrer "Salles" pour les professeurs (ils ne gèrent pas les salles)
            if (sub.link === '/salles') {
                return false;
            }
            
            return true;
        });
    };

    // Fonction pour vérifier si un item de menu est accessible
    const isItemAccessible = (item: any): boolean => {
        // Si c'est un professeur, filtrer strictement
        if (isProfesseur) {
            // Les professeurs peuvent voir :
            // - Dashboard
            if (item.text === 'Accueil') return true;
            // - Professeurs : complètement caché pour les professeurs (réservé aux admins et super admins)
            if (item.text === 'Professeurs') {
                return false;
            }
            // - Classes (lecture seulement - lien direct vers la liste)
            if (item.text === 'Classes') {
                return true; // Pour les professeurs, c'est un lien direct vers leurs classes
            }
            // - Emplois du temps (lien direct vers leur emploi du temps)
            if (item.text === 'Emplois du temps') {
                return true; // Pour les professeurs, c'est un lien direct
            }
            // - Notes (pour leurs classes)
            if (item.text === 'Notes') return true;
            // - Absences (pour leurs classes - lien direct vers la liste)
            if (item.text === 'Absences') {
                return true; // Pour les professeurs, c'est un lien direct vers leurs absences
            }
            // - Contrôles (pour leurs classes)
            if (item.text === 'Contrôles' && item.sub) {
                return item.sub.some((sub: any) => sub.link === '/controles');
            }
            // - Mon Compte
            if (item.text === 'Mon Compte') return true;
            
            // Tout le reste est interdit pour les professeurs
            return false;
        }
        
        // Pour les admins et super_admins (et autres)
        // Seuls les super_admin peuvent voir "Administrateurs", "Corbeille" et "Années Scolaires"
        if (item.text === 'Administrateurs' && !isSuperAdmin()) {
            return false;
        }
        if (item.text === 'Corbeille' && !isSuperAdmin()) {
            return false;
        }
        if (item.text === 'Enregistrements Supprimés' && !isSuperAdmin()) {
            return false;
        }
        if (item.text === 'Années Scolaires' && !isSuperAdmin()) {
            return false;
        }
        
        // Mon Compte: accessible à tous les rôles authentifiés
        if (item.text === 'Mon Compte') return true;

        return true;
    };

    // Menu Élève minimal
    if (isEleve()) {
        const eleveId = user?.eleve_id;
        const classeId = user?.classe_id;
        const menuConfig = [
            {
                icon: 'calendar', text: 'Emploi du temps',
                to: classeId ? `/classes/${classeId}/emplois-du-temps/preview` : '#',
                disabled: !classeId,
            },
            {
                icon: 'file-text', text: 'Contrôles',
                to: '/controles', // Route qui filtre automatiquement les contrôles de l'élève
                disabled: false,
            },
            {
                icon: 'notes', text: 'Notes',
                to: eleveId ? `/eleves/${eleveId}/notes` : '#',
                disabled: !eleveId,
            },
            {
                icon: 'user', text: 'Mon Compte', to: '/account', disabled: false,
            },
        ].map(it => ({ ...it, to: typeof it.to === 'string' ? it.to : '#' }));
        return (
            <ul className="nk-menu">
                {menuConfig.map((it, idx) => (
                    <li key={idx} className="nk-menu-item py-0.5 group/item">
                        {it.disabled ? (
                            <span
                                className="nk-menu-link nk-route-toggle flex relative items-center align-middle py-2.5 ps-6 pe-10 font-heading font-bold tracking-snug group cursor-not-allowed text-gray-300 dark:text-gray-500"
                                title="Non disponible"
                            >
                                <span className="inline-flex flex-grow-0 flex-shrink-0 font-normal tracking-normal w-9 text-slate-300 group-hover:text-slate-400">
                                    <Icon name={it.icon as any} size="sm" />
                                </span>
                                <span className="inline-block transition-all duration-300 flex-grow-1 whitespace-nowrap">
                                    {it.text}
                                </span>
                            </span>
                        ) : (
                            <NavLink
                                onClick={() => setSidebarVisibility(false)}
                                className="nk-menu-link nk-route-toggle flex relative items-center align-middle py-2.5 ps-6 pe-10 font-heading font-bold tracking-snug group"
                                to={it.to as string}
                                end
                            >
                                <span className="font-normal tracking-normal w-9 inline-flex flex-grow-0 flex-shrink-0 text-slate-400 group-[.active]/item:text-primary-500 group-hover:text-primary-500">
                                    <Icon name={it.icon as any} size="sm" />
                                </span>
                                <span className="group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0 flex-grow-1 inline-block whitespace-nowrap transition-all duration-300 text-slate-600 dark:text-slate-500 group-[.active]/item:text-primary-500 group-hover:text-primary-500">
                                    {it.text}
                                </span>
                            </NavLink>
                        )}
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <ul className="nk-menu">
            {menuData.map((item, index) => {
                // Vérifier si l'item est accessible
                if (!isItemAccessible(item)) {
                    return null;
                }

                // Pour les professeurs : forcer ces liens en principal sans sous-menu
                if (isProfesseur && professeurDirectItems.includes(item.text)) {
                    let directLink = '/';
                    if (item.text === 'Classes') directLink = '/classes';
                    else if (item.text === 'Absences') directLink = '/absences';
                    else if (item.text === 'Emplois du temps') {
                        const professeurId = (user as any)?.professeur_id;
                        directLink = professeurId ? `/professeurs/${professeurId}/timetable` : '/emplois-du-temps';
                    }
                    else if (item.text === 'Notes') directLink = '/notes';
                    else if (item.text === 'Contrôles') directLink = '/controles';
                    else directLink = typeof item.link === 'string' ? item.link : '#';
                    return (
                        <li className="nk-menu-item py-0.5 group/item" key={index}>
                            <NavLink 
                                onClick={() => setSidebarVisibility(false)} 
                                className="nk-menu-link nk-route-toggle flex relative items-center align-middle py-2.5 ps-6 pe-10 font-heading font-bold tracking-snug group" 
                                to={{ pathname: directLink }} 
                                end
                            >
                                {item.icon && (
                                    <span className="font-normal tracking-normal w-9 inline-flex flex-grow-0 flex-shrink-0 text-slate-400 group-[.active]/item:text-primary-500 group-hover:text-primary-500">
                                        <Icon name={item.icon} size="sm" />
                                    </span>
                                )}
                                {item.text && (
                                    <span className="group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0 flex-grow-1 inline-block whitespace-nowrap transition-all duration-300 text-slate-600 dark:text-slate-500 group-[.active]/item:text-primary-500 group-hover:text-primary-500">
                                        {item.text}
                                    </span>
                                )}
                            </NavLink>
                        </li>
                    );
                }
                // SINON : logique actuelle pour admin/super_admin
                
                // Pour les professeurs, si c'est "Emplois du temps", le transformer en lien direct
                if (isProfesseur && item.text === 'Emplois du temps' && (item as any).forProfesseur === 'direct') {
                    // Récupérer l'ID du professeur et créer un lien direct
                    const professeurId = (user as any)?.professeur_id;
                    if (professeurId) {
                        item = { ...item, link: `/professeurs/${professeurId}/timetable`, sub: undefined, icon: item.icon, text: item.text } as any;
                    } else {
                        // Si pas d'ID, ne pas afficher le menu
                        return null;
                    }
                }
                
                // Pour les professeurs, si c'est "Classes", le transformer en lien direct vers la liste
                if (isProfesseur && item.text === 'Classes' && (item as any).forProfesseur === 'direct') {
                    item = { ...item, link: '/classes', sub: undefined, icon: item.icon, text: item.text } as any;
                }
                
                // Pour les professeurs, si c'est "Absences", le transformer en lien direct vers la liste
                if (isProfesseur && item.text === 'Absences' && (item as any).forProfesseur === 'direct') {
                    item = { ...item, link: '/absences', sub: undefined, icon: item.icon, text: item.text } as any;
                }
                
                // Si c'est un item avec sous-menu, filtrer les sous-items
                if (item.sub && isProfesseur && item.text !== 'Emplois du temps' && item.text !== 'Classes' && item.text !== 'Absences') {
                    const filteredSub = filterSubItems(item.sub);
                    if (filteredSub.length === 0) {
                        return null; // Ne pas afficher le menu si aucun sous-item n'est accessible
                    }
                    // Créer une copie avec les sous-items filtrés
                    item = { ...item, sub: filteredSub, icon: item.icon, text: item.text } as any;
                }
                
                // Pour les professeurs : NE PAS AFFICHER "Accueil"
                if (isProfesseur && item.text === 'Accueil') {
                    return null;
                }

                return (
                <Fragment key={index}>
                    {!item.heading ? (
                        !item.sub ? (
                            // Simple menu item without submenu
                            <li className="nk-menu-item py-0.5 group/item">
                                <NavLink 
                                    onClick={() => setSidebarVisibility(false)} 
                                    className="nk-menu-link nk-route-toggle flex relative items-center align-middle py-2.5 ps-6 pe-10 font-heading font-bold tracking-snug group" 
                                    to={`${item.link ?? '#'}`} 
                                    end
                                >
                                    {item.icon && (
                                        <span className="font-normal tracking-normal w-9 inline-flex flex-grow-0 flex-shrink-0 text-slate-400 group-[.active]/item:text-primary-500 group-hover:text-primary-500">
                                            <Icon name={item.icon} size="sm" />
                                        </span>
                                    )}
                                    {item.text && (
                                        <span className="group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0 flex-grow-1 inline-block whitespace-nowrap transition-all duration-300 text-slate-600 dark:text-slate-500 group-[.active]/item:text-primary-500 group-hover:text-primary-500">
                                            {item.text}
                                        </span>
                                    )}
                                </NavLink>
                            </li>
                        ) : (
                            // Menu item with submenu
                            <li className="nk-menu-item py-0.5 group/item has-sub">
                                <a 
                                    className="nk-menu-link nk-menu-toggle flex relative items-center align-middle py-2.5 ps-6 pe-10 font-heading font-bold tracking-snug group" 
                                    onClick={(e) => {
                                        menuToggle(e, index);
                                        closeSiblings(index);
                                    }} 
                                    href="#expand"
                                >
                                    {item.icon && (
                                        <span className="font-normal tracking-normal w-9 inline-flex flex-grow-0 flex-shrink-0 text-slate-400 group-[.active]/item:text-primary-500 group-hover:text-primary-500">
                                            <Icon name={item.icon} size="sm" />
                                        </span>
                                    )}
                                    {item.text && (
                                        <span className="group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0 flex-grow-1 inline-block whitespace-nowrap transition-all duration-300 text-slate-600 dark:text-slate-500 group-[.active]/item:text-primary-500 group-hover:text-primary-500">
                                            {item.text}
                                        </span>
                                    )}
                                    <span className="group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0 text-base leading-none text-slate-400 group-[.active]/item:text-primary-500 absolute end-5 top-1/2 -translate-y-1/2 rtl:-scale-x-100 group-[.active]/item:rotate-90 group-[.active]/item:rtl:-rotate-90 transition-all duration-300">
                                        <Icon 
                                            name="chevron-right" 
                                            size="sm" 
                                            className={`transition-transform duration-200 ${openGroups[index] ? 'rotate-90' : ''}`}
                                        />
                                    </span>
                                </a>
                                
                                {/* Submenu */}
                                {openGroups[index] && (
                                    <ul className="nk-menu-sub mb-1 block group-[&.is-compact:not(.has-hover)]/sidebar:!hidden">
                                        {item.sub.map((subItem, subIndex) => {
                                            // Si c'est un lien spécial pour professeur, résoudre l'ID dynamiquement
                                            let linkTo = subItem.link;
                                            if (subItem.link === '/professeurs/my-profile' && isProfesseur && user) {
                                                // Récupérer l'ID du professeur depuis le user
                                                const professeurId = (user as any).professeur_id;
                                                if (professeurId) {
                                                    linkTo = `/professeurs/${professeurId}`;
                                                } else {
                                                    // Si pas d'ID, essayer de le récupérer depuis l'API
                                                    // Pour l'instant, on cache le lien
                                                    return null;
                                                }
                                            }
                                            
                                            return (
                                            <Fragment key={subIndex}>
                                                {!(subItem as any).sub ? (
                                                    <li className="py-px nk-menu-item group/sub1">
                                                        <NavLink 
                                                            onClick={() => setSidebarVisibility(false)} 
                                                            to={`${linkTo ?? '#'}`} 
                                                            className="nk-menu-link nk-route-toggle flex relative items-center align-middle py-1.5 pe-10 ps-[calc(theme(spacing.6)+theme(spacing.9))] font-normal leading-5 text-sm tracking-normal normal-case" 
                                                            end
                                                        >
                                                            <span className="text-slate-600 dark:text-slate-500 group-[.active]/sub1:text-primary-500 hover:text-primary-500 whitespace-nowrap flex-grow inline-block">
                                                                {subItem.text}
                                                            </span>
                                                        </NavLink>
                                                    </li>
                                                ) : (
                                                    <li className="py-px nk-menu-item group/sub1 has-sub">
                                                        <a 
                                                            className="nk-menu-link nk-menu-toggle flex relative items-center align-middle py-1.5 pe-10 ps-[calc(theme(spacing.6)+theme(spacing.9))] font-normal leading-5 text-sm tracking-normal normal-case" 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                // Handle nested submenu if needed
                                                            }} 
                                                            href="#expand"
                                                        >
                                                            <span className="text-slate-600 dark:text-slate-500 group-[.active]/sub1:text-primary-500 hover:text-primary-500 whitespace-nowrap flex-grow inline-block">
                                                                {subItem.text}
                                                            </span>
                                                            <span className="text-base leading-none text-slate-400 group-[.active]/sub1:text-primary-500 absolute end-5 top-1/2 -translate-y-1/2 rtl:-scale-x-100 group-[.active]/sub1:rotate-90 group-[.active]/sub1:rtl:-rotate-90 transition-all duration-300">
                                                                <Icon name="chevron-right" size="sm" />
                                                            </span>
                                                        </a>
                                                    </li>
                                                )}
                                            </Fragment>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        )
                    ) : (
                        // Heading
                        <li className="relative first:pt-1 pt-10 pb-2 px-6 before:absolute before:h-px before:w-full before:start-0 before:top-1/2 before:bg-gray-200 dark:before:bg-gray-900 first:before:hidden before:opacity-0 group-[&.is-compact:not(.has-hover)]/sidebar:before:opacity-100">
                            <h6 className="group-[&.is-compact:not(.has-hover)]/sidebar:opacity-0 text-slate-400 dark:text-slate-300 whitespace-nowrap uppercase font-bold text-xs tracking-relaxed leading-tight">
                                {item.heading}
                            </h6>
                        </li>
                    )}
                </Fragment>
                );
            })}
        </ul>
    );
};

export default Sidebar;