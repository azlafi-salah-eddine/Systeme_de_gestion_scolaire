import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import Head from '../../components/Head';
import Icon from '../../components/Icon';

// Types définis directement
interface LoginRequest {
  email: string;
  password: string;
}


const Login: React.FC = () => {
  const [passwordState, setPasswordState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const { showSuccess } = useNotification();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<Partial<LoginRequest>>({});

  const validateForm = () => {
    const newErrors: Partial<LoginRequest> = {};
    
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      await login(formData);
      
      // Utiliser le système de notification
      showSuccess('Connexion réussie', 'Bienvenue dans le système de gestion scolaire');
      
      // Redirection immédiate
      const from = location.state?.from?.pathname || '/'; // <-- correction
      navigate(from, { replace: true });
      
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head title="Connexion" />
      <div className="bg-white dark:bg-gray-1000 font-body text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-normal min-w-[320px] h-screen overflow-hidden">
        <div className="h-full nk-app-root">
          <div className="h-full nk-main">
            <div className="flex flex-col h-screen nk-wrap">
              <div className="relative flex h-screen">
                {/* Left Column - Login Form */}
                <div className="relative flex flex-col h-full bg-white dark:bg-gray-950 w-full lg:w-[45%] flex-shrink-0">
                  <div className="flex flex-col justify-center h-full w-full max-w-[420px] p-5 2xl:me-[90px] mx-auto">
                    {/* Logo */}
                    <div className="relative flex flex-shrink-0 pb-8">
                      <Link to="/" className="relative inline-block h-10 transition-opacity duration-300">
                  <div className="flex items-center h-full">
                          <span className="text-2xl font-bold text-primary-600 dark:text-primary-500">École ANONYME</span>
                  </div>
                </Link>
              </div>
              
                    {/* Form Header */}
                    <div className="pb-4">
                      <h5 className="mb-2 text-xl font-bold font-heading -tracking-snug text-slate-700 dark:text-white leading-tighter">
                    Connexion
                  </h5>
                      <p className="text-sm leading-6 text-slate-400">
                    Accédez au système de gestion de l'école avec votre email et mot de passe.
                  </p>
                </div>

                    {/* Error Messages */}
                    {error && (
                      <div className="p-3 mb-4 border border-red-200 rounded-md bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={onSubmit}>
                      <div className="relative mb-4 last:mb-0">
                        <label className="flex items-center justify-between mb-2 text-sm font-medium text-slate-700 dark:text-white" htmlFor="email">
                          <span>Email</span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                      id="email"
                            className="block w-full box-border text-sm leading-4.5 px-4 py-2.5 h-11 text-slate-700 dark:text-white placeholder-slate-300 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 outline-none focus:border-primary-500 focus:dark:border-primary-600 focus:outline-offset-0 focus:outline-primary-200 focus:dark:outline-primary-950 disabled:bg-slate-50 disabled:dark:bg-slate-950 disabled:cursor-not-allowed rounded-md transition-all"
                      placeholder="Entrez votre adresse email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                            autoComplete="off"
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>
                        )}
                      </div>

                      <div className="relative mb-4 last:mb-0">
                        <label className="flex items-center justify-between mb-2 text-sm font-medium text-slate-700 dark:text-white" htmlFor="password">
                          <span>Mot de passe</span>
                        </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setPasswordState(!passwordState)}
                            className="absolute top-0 flex items-center justify-center transition-colors duration-200 h-11 w-11 end-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                      >
                        {passwordState ? (
                              <Icon name="eye-off" size="sm" className="text-slate-400" />
                            ) : (
                              <Icon name="eye" size="sm" className="text-slate-400" />
                            )}
                          </button>
                          <input
                            type={passwordState ? 'text' : 'password'}
                            id="password"
                            className="block w-full box-border text-sm leading-4.5 px-4 py-2.5 h-11 text-slate-700 dark:text-white placeholder-slate-300 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 outline-none focus:border-primary-500 focus:dark:border-primary-600 focus:outline-offset-0 focus:outline-primary-200 focus:dark:outline-primary-950 disabled:bg-slate-50 disabled:dark:bg-slate-950 disabled:cursor-not-allowed rounded-md transition-all pr-11"
                            placeholder="Entrez votre mot de passe"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            autoComplete="off"
                          />
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
                        )}
                      </div>

                      <div className="relative mb-4 last:mb-0">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="relative w-full flex items-center justify-center text-center align-middle text-base font-bold leading-4.5 rounded-md px-6 py-3 tracking-wide border border-primary-600 text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                          ) : (
                            'Se connecter'
                        )}
                      </button>
                      </div>
                    </form>

                    <div className="pt-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Seuls les administrateurs peuvent créer des comptes utilisateurs.
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mx-auto w-full max-w-[420px] px-5 pt-4 pb-6 2xl:me-[90px]">
                    
                    <div className="mt-4.5">
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        &copy; 2025 Gestion Ecole. Tous droits réservés.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Back to School Image */}
                <div className="hidden lg:flex min-w-[260px] max-w-[calc(100%-2.5rem)] flex-col w-full h-screen bg-gray-50 dark:bg-gray-900 flex-shrink flex-grow">
                  <div className="flex flex-col justify-center h-full w-full max-w-[550px] p-4 sm:p-11 mx-auto">
                    <div className="relative overflow-hidden">
                      <div className="text-center">
                        <div className="mb-6">
                          <img 
                            src="/images/carousel/backtoschool.png" 
                            alt="Retour à l'école"
                            className="w-full h-auto max-w-xs mx-auto "
                          />
                        </div>
                        <h4 className="mb-4 text-2xl font-bold lg:text-3xl font-heading -tracking-tight text-primary-600 dark:text-primary-500 leading-tighter">
                          Retour à l'école
                        </h4>
                        <div className="py-6 sm:p-11">
                          <p className="text-slate-600 dark:text-slate-300">
                            Bienvenue dans le système de gestion scolaire. Accédez à votre compte pour commencer.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
