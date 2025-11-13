import axios from 'axios';

// Fonction utilitaire pour nettoyer les réponses JSON
export const cleanJsonResponse = (text: string): string => {
  return text.replace(/^[\xEF\xBB\xBF\x00-\x1F\x7F]+/, '').trim();
};

// Types définis directement pour éviter les problèmes d'import
interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  roles: string[];
  created_at: string;
  updated_at: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  message: string;
  session_id: string;
}

// type ApiError réservé pour usage futur
// interface ApiError {
//   message: string;
//   errors?: Record<string, string[]>;
// }

// Base URL dynamique: utilise VITE_API_URL si défini, sinon même origine (proxy Vite en dev)
const resolveApiBaseUrl = (): string => {
  const envApiUrl = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
  if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.trim().length > 0) {
    return envApiUrl.replace(/\/$/, '');
  }
  // Always use relative URLs to work with Vite proxy
  return '/api';
};

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 secondes timeout pour éviter les timeouts
  withCredentials: true, // Important pour les sessions
});

// Flag pour éviter les boucles infinies lors du refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Intercepteur pour les sessions (plus besoin de token)
api.interceptors.request.use(
  (config) => {
    // Les sessions sont gérées automatiquement par les cookies
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse et parser les données
api.interceptors.response.use(
  (response) => {
    // Parse JSON strings only when Content-Type is JSON or payload looks like JSON
    try {
      const contentType = (response.headers?.['content-type'] || '').toString().toLowerCase();
      const isJsonContentType = contentType.includes('application/json');
      if (typeof response.data === 'string') {
        const cleaned = response.data.replace(/^\uFEFF/, '').trim();
        const looksLikeJson = cleaned.startsWith('{') || cleaned.startsWith('[');
        if (isJsonContentType || looksLikeJson) {
          response.data = JSON.parse(cleaned);
        }
      }
    } catch (parseError) {
      // Leave response.data as-is for non-JSON responses
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Retry léger pour erreurs réseau transitoires (ex: backend redémarre)
    const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
    if (isNetworkError && originalRequest && !originalRequest.__isRetried) {
      originalRequest.__isRetried = true;
      return new Promise((resolve) => setTimeout(resolve, 500)).then(() => api.request(originalRequest));
    }

    // Gérer les erreurs 401 (Unauthorized)
    if (error.response?.status === 401 && originalRequest && !originalRequest.__isRetry && !originalRequest.__skipAuthRetry) {
      // Éviter les boucles infinies - ne pas retry les endpoints d'auth ou les requêtes marquées
      if (originalRequest.url?.includes('/auth/') || originalRequest.__skipAuthRetry) {
        // Pour les endpoints d'auth, nettoyer la session et rediriger
        sessionUtils.clearSession();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Si on est déjà en train de rafraîchir, mettre en queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api.request(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      // Vérifier si on a une session stockée
      const hasSession = sessionUtils.hasSession();
      if (!hasSession) {
        // Pas de session, rediriger vers login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Essayer de rafraîchir la session
      isRefreshing = true;
      originalRequest.__isRetry = true;

      try {
        // Essayer de vérifier la session avec /auth/me
        // Utiliser axios directement avec la même config de base pour éviter les boucles
        // Créer une instance axios sans intercepteurs pour éviter les boucles infinies
        const refreshAxios = axios.create({
          baseURL: API_BASE_URL,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          withCredentials: true,
          timeout: 30000,
        });
        const meResponse = await refreshAxios.get('/auth/me');
        // Parser la réponse si nécessaire (comme dans l'interceptor principal)
        let userData = meResponse.data;
        if (typeof userData === 'string') {
          try {
            const cleaned = userData.replace(/^\uFEFF/, '').trim();
            if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
              userData = JSON.parse(cleaned);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        if (userData?.user) {
          // Session valide, mettre à jour l'utilisateur
          sessionUtils.setUser(userData.user);
          processQueue(null, null);
          isRefreshing = false;
          // Retry la requête originale
          return api.request(originalRequest);
        } else {
          throw new Error('Session invalide');
        }
      } catch (refreshError: any) {
        // Refresh échoué, nettoyer et rediriger
        processQueue(refreshError, null);
        isRefreshing = false;
        sessionUtils.clearSession();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Response data is now automatically parsed by the interceptor
      const responseData = response.data;
      
      // Validate response structure
      if (!responseData || typeof responseData !== 'object') {
        throw new Error('Réponse du serveur invalide - format incorrect');
      }
      
      const { user, session_id } = responseData;
      
      // Stocker les données utilisateur (plus de token)
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('session_id', session_id);
      
      return responseData;
    } catch (error: any) {
      
      // Gestion spécifique des erreurs 422 (validation)
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        
        if (errors?.email) {
          throw new Error(errors.email[0] || 'Email invalide');
        }
        if (errors?.password) {
          throw new Error(errors.password[0] || 'Mot de passe invalide');
        }
        
        // Si c'est une erreur d'authentification (email/password incorrect)
        if (error.response.data.message && error.response.data.message.includes('auth.failed')) {
          throw new Error('Email ou mot de passe incorrect');
        }
        
        throw new Error('Données de connexion invalides');
      }
      
      // Gestion des erreurs 401 (non autorisé)
      if (error.response?.status === 401) {
        throw new Error('Email ou mot de passe incorrect');
      }
      
      // Gestion des erreurs de réseau
      if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion.');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Erreur de connexion');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error: any) {
      // Même en cas d'erreur, on nettoie le localStorage
    } finally {
      // Always clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('session_id');
    }
  },

  me: async (): Promise<{ user: User }> => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des données utilisateur');
    }
  },

  refreshSession: async (): Promise<LoginResponse> => {
    try {
      const response = await api.post('/auth/refresh');
      const { user, session_id } = response.data;
      
      // Mettre à jour les données utilisateur
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('session_id', session_id);
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors du renouvellement de la session');
    }
  },
};

// Utilitaires pour la gestion des sessions
export const sessionUtils = {
  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  clearSession: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('session_id');
  },

  hasSession: (): boolean => {
    return localStorage.getItem('user') !== null;
  },
};

export default api;
