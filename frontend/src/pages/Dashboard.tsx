import React, { useEffect, useState, useRef } from 'react';
import { Icon } from '../components';
import { useAnneeScolaire } from '../contexts/AnneeScolaireContext';
import { dashboardService } from '../services/dashboardService';

const Dashboard: React.FC = () => {
  const { anneeActive, loading: anneeLoading } = useAnneeScolaire();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);



  useEffect(() => {
    const loadStats = async () => {
      if (isLoadingRef.current) {
        return;
      }
      
      try {
        isLoadingRef.current = true;
        setLoading(true);
        setError(null);
        
        const response = await dashboardService.getStatistics();
        
        if (response.success === true) {
          const formattedStats = dashboardService.formatStatisticsForDisplay(response.data);
          setStats(formattedStats);
        } else {
          setError(response.message || 'Erreur lors du chargement des statistiques');
        }
      } catch (error: any) {
        setError(error.message || 'Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    if (anneeActive?.id) {
      void loadStats();
    }
  }, [anneeActive?.id]);








  return (
    <>
      {/* Page Head - Template Style */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Tableau de bord</h2>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">Bienvenue dans le système de gestion scolaire.</p>
          {!anneeLoading && anneeActive && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 shadow-sm dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700">
              Année active: {anneeActive.nom}
            </span>
          )}
          {!anneeLoading && !anneeActive && (
            <a href="/annees-scolaires" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              Aucune année active — Gérer
            </a>
          )}
        </div>
      </div>

      
      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <Icon name="alert-circle" className="text-red-500 dark:text-red-400 mr-2" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        /* Dashboard Cards - Original Style */
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <div key={index} className={`p-8 rounded-lg text-white relative overflow-hidden ${
              stat.color === 'blue' ? 'bg-blue-500 dark:bg-blue-700' :
              stat.color === 'indigo' ? 'bg-indigo-500 dark:bg-indigo-700' :
              stat.color === 'green' ? 'bg-green-500 dark:bg-green-700' :
              stat.color === 'purple' ? 'bg-purple-500 dark:bg-purple-700' :
              stat.color === 'orange' ? 'bg-orange-500 dark:bg-orange-700' :
              stat.color === 'red' ? 'bg-red-500 dark:bg-red-700' :
              stat.color === 'cyan' ? 'bg-cyan-500 dark:bg-cyan-700' :
              stat.color === 'rose' ? 'bg-rose-500 dark:bg-rose-700' :
              stat.color === 'emerald' ? 'bg-emerald-500 dark:bg-emerald-700' :
              stat.color === 'teal' ? 'bg-teal-500 dark:bg-teal-700' :
              stat.color === 'slate' ? 'bg-slate-500 dark:bg-slate-700' :
              stat.color === 'gray' ? 'bg-gray-500 dark:bg-gray-700' :
              stat.color === 'violet' ? 'bg-violet-500 dark:bg-violet-700' :
              stat.color === 'amber' ? 'bg-amber-500 dark:bg-amber-700' :
              stat.color === 'sky' ? 'bg-sky-500 dark:bg-sky-700' :
              stat.color === 'lime' ? 'bg-lime-500 dark:bg-lime-700' :
              'bg-gray-500 dark:bg-gray-700'
            }`}>
                    {/* Background icon */}
              <div className="absolute top-2 right-2 opacity-15 dark:opacity-20">
                <Icon name={stat.icon} size="custom" className="text-8xl" />
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="mb-2 text-3xl font-bold dark:text-white">{stat.count}</div>
                <div className="mb-2 text-lg font-medium dark:text-white">{stat.title}</div>
                <div className="text-sm opacity-90 dark:opacity-80">{stat.subtitle}</div>
              </div>
                    </div>
                ))}
        </div>
      )}
    </>
  );
};

export default Dashboard;