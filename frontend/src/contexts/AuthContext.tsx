import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, sessionUtils } from '../services/api';

// Types définis directement
interface User {
  id: number;
  name?: string;
  nom?: string;
  prenom?: string;
  email: string;
  phone?: string;
  roles: string[];
  role?: {
    id: number;
    type: string;
  };
  professeur_id?: number;
  eleve_id?: number;
  classe_id?: number;
  created_at: string;
  updated_at: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isProfesseur: () => boolean;
  isEleve: () => boolean;
  canDelete: () => boolean;
  canRestore: () => boolean;
  isBackendOffline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // En mode développement, cela peut arriver lors du hot-reload
    // Retourner un contexte par défaut temporaire pour éviter l'erreur
    if (process.env.NODE_ENV === 'development') {
      console.warn('useAuth is being called outside of AuthProvider. This may happen during hot-reload.');
      return {
        user: null,
        token: null,
        login: async () => {},
        logout: () => {},
        isLoading: true,
        isAuthenticated: false,
      hasRole: () => false,
      hasAnyRole: () => false,
      isAdmin: () => false,
      isSuperAdmin: () => false,
      isProfesseur: () => false,
      isEleve: () => false,
      canDelete: () => false,
      canRestore: () => false,
      isBackendOffline: false,
      } as AuthContextType;
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOffline, setIsBackendOffline] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = sessionUtils.getUser();

      if (storedUser && sessionUtils.hasSession()) {
        try {
          setUser(storedUser);
          setToken('session'); // Indicateur que nous utilisons une session
          
          // Vérifier si la session est encore valide et rafraîchir l'utilisateur (roles, nom, etc.)
          const me = await authApi.me();
          if (me?.user) {
            setUser(me.user as any);
            sessionUtils.setUser(me.user as any);
          }
          setIsBackendOffline(false);
        } catch (error) {
          // Si le backend est down (réseau/5xx), rester en mode hors-ligne sans déconnecter
          const message = (error as any)?.message || '';
          const isNetwork = message.includes('Network') || message.includes('timeout');
          const status = (error as any)?.response?.status;
          const isServer = status >= 500;
          
          if (isNetwork || isServer) {
            setIsBackendOffline(true);
          } else {
            // Session invalide, nettoyer le localStorage
            sessionUtils.clearSession();
            setToken(null);
            setUser(null);
            setIsBackendOffline(false);
            // Rediriger vers la page de login
            window.location.href = '/login';
          }
        }
      } else {
        // Pas de session, nettoyer
        sessionUtils.clearSession();
        setToken(null);
        setUser(null);
        setIsBackendOffline(false);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      
      // Vérifier que la réponse contient les données attendues
      if (!response || !response.user) {
        throw new Error('Réponse du serveur invalide');
      }
      
      // Vérifier que l'utilisateur a les propriétés requises
      if (!response.user.name || !response.user.email) {
        throw new Error('Données utilisateur incomplètes');
      }
      
      // Mettre à jour l'état immédiatement
      setToken('session'); // Indicateur de session
      setUser(response.user);
      
      // Stocker l'utilisateur (session gérée automatiquement)
      sessionUtils.setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authApi.logout();
    } catch (error) {
    } finally {
      setToken(null);
      setUser(null);
      sessionUtils.clearSession();
      setIsLoading(false);
      setIsBackendOffline(false);
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return user?.roles?.some(role => roles.includes(role)) || false;
  };

  const isAdmin = (): boolean => {
    return hasAnyRole(['admin', 'super_admin']);
  };

  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin');
  };

  const isProfesseur = (): boolean => {
    return hasRole('professeur') || user?.role?.type === 'professeur';
  };

  const isEleve = (): boolean => {
    return hasRole('eleve') || user?.role?.type === 'eleve';
  };

  const canDelete = (): boolean => {
    return isAdmin(); // Les admins et super admins peuvent supprimer
  };

  const canRestore = (): boolean => {
    return isSuperAdmin(); // Seuls les super admins peuvent restaurer
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isProfesseur,
    isEleve,
    canDelete,
    canRestore,
    isBackendOffline,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
