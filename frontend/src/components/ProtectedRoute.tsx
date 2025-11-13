import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Error404 from '../pages/errors/Error404';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [], 
  adminOnly = false 
}) => {
  const { isAuthenticated, isLoading, user, hasAnyRole, isAdmin, isBackendOffline, isEleve } = useAuth();
  const location = useLocation();

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-b-2 rounded-full animate-spin border-primary-600"></div>
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated && !isBackendOffline) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si c'est un élève, vérifier qu'il accède uniquement aux routes autorisées
  if (isEleve() && user) {
    const currentPath = location.pathname;
    // Routes autorisées pour les élèves :
    // - /classes/:id/emplois-du-temps/preview
    // - /controles
    // - /eleves/:id/notes
    // - /account
    const isAllowed = 
      currentPath === '/account' ||
      currentPath === '/controles' ||
      currentPath.startsWith('/classes/') && currentPath.includes('/emplois-du-temps/preview') ||
      currentPath.match(/^\/eleves\/\d+\/notes$/);
    
    if (!isAllowed) {
      // Rediriger vers la page par défaut de l'élève
      if (user.classe_id) {
        return <Navigate to={`/classes/${user.classe_id}/emplois-du-temps/preview`} replace />;
      }
      return <Error404 />;
    }
  }

  // Détecter si c'est un professeur
  const isProfesseur = user && ((user as any).role?.type === 'professeur' || ((user as any).roles || []).includes('professeur'));

  // Vérifier si l'utilisateur est admin (si requis)
  if (adminOnly && !isAdmin()) {
    // Si c'est un professeur qui essaie d'accéder à une page admin, rediriger vers 404
    if (isProfesseur) {
      return <Error404 />;
    }
    return <Error404 />;
  }

  // Vérifier les rôles requis
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    // Si c'est un admin (mais pas super_admin) qui essaie d'accéder à une page super_admin, rediriger vers 404
    if (user && isAdmin() && requiredRoles.includes('super_admin')) {
      const userRoles = (user as any).roles || [];
      const isSuperAdmin = userRoles.includes('super_admin') || (user as any).role?.type === 'super_admin';
      if (!isSuperAdmin) {
        return <Error404 />;
      }
    }
    // Si c'est un professeur qui essaie d'accéder à une page admin/super_admin, rediriger vers 404
    if (isProfesseur) {
      return <Error404 />;
    }
    return <Error404 />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;