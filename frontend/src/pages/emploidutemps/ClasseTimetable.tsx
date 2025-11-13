import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Icon from '../../components/Icon';
import Button from '../../components/ui/Button';
import { timetableService } from '../../services/timetableService';
import type { TimetableItem } from '../../services/timetableService';
import { classeService } from '../../services/classeService';
import { salleService } from '../../services/salleService';
import { useAuth } from '../../contexts/AuthContext';
import Error404 from '../errors/Error404';

const jours: TimetableItem['jour'][] = ['lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const heures = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];

function formatTime(t: string) { return t.substring(0,5); }
function getNextHour(h: string) {
  const i = heures.indexOf(h);
  return i < heures.length - 1 ? heures[i+1] : '17:00';
}

const ClasseTimetable: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isEleve } = useAuth();
  const classeId = Number(id);
  const [items, setItems] = useState<TimetableItem[]>([]);
  const [classeName, setClasseName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Si c'est un élève, vérifier qu'il accède uniquement à sa propre classe
  if (isEleve() && user?.classe_id && classeId !== user.classe_id) {
    return <Error404 />;
  }

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const [res, classeRes] = await Promise.all([
          timetableService.byClasse(classeId),
          classeService.show(classeId).catch(() => null),
        ]);
        const list = Array.isArray((res as any)?.data) ? (res as any).data as TimetableItem[] : [];
        setItems(list);
        if (classeRes && (classeRes as any).data) {
          const c = (classeRes as any).data;
          setClasseName(c.nom_complet || c.nom || '');
        }
      } catch (e: any) {
        setError(e?.message || "Erreur lors du chargement de l'emploi du temps");
      } finally {
        setLoading(false);
      }
    };
    if (classeId) run();
  }, [classeId]);

  // Read-only view: no edit/save/remove

  const grouped = useMemo(() => {
    const g: Record<string, TimetableItem[]> = {};
    for (const j of jours) g[j] = [];
    (items || []).forEach(it => {
      if (!g[it.jour]) g[it.jour] = [];
      g[it.jour].push(it);
    });
    const toMinutes = (t: string) => {
      const [h,m] = (t || '0:0').split(':').map(n => parseInt(n || '0', 10));
      return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    };
    Object.values(g).forEach(arr => arr.sort((a,b) => toMinutes(a.heure_debut) - toMinutes(b.heure_debut)));
    return g;
  }, [items]);

  const getSessionAtSlot = (jour: TimetableItem['jour'], heure: string) => {
    const list = grouped[jour] || [];
    const toMinutes = (t: string) => {
      const [h,m] = (t || '0:0').split(':').map(n => parseInt(n || '0', 10));
      return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    };
    const slotMin = toMinutes(heure);
    return list.find(s => toMinutes(s.heure_debut) <= slotMin && toMinutes(s.heure_fin) > slotMin) || null;
  };


  // Impression désactivée

  return (
    <div className="space-y-6">
      <PageHead 
        title={`Emploi du temps - ${classeName || 'Classe'}`}
        subtitle="Vue hebdomadaire"
        breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Classes', link: '/classes' }, { label: 'Emploi du temps', link: `/classes/${id}/emplois-du-temps` }]}
      />

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
        </div>
      )}


      {error && (
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Erreur</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <Card>
          <div className="p-6">
            <div id="timetable-content">
              <div className="px-4 py-2 text-sm font-semibold text-center text-slate-700 dark:text-white">Emploi du temps - {classeName || `Classe #${id}`}</div>
              <div className="overflow-hidden border border-gray-300 dark:border-gray-700 rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="w-16 p-3 text-sm font-semibold text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700">Heure</th>
              {jours.map(j => (
                        <th key={j} className="p-3 text-sm font-semibold text-center text-gray-700 dark:text-gray-300 capitalize bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 last:border-r-0">{j}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heures.map(heure => (
                      <tr key={heure} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="w-16 p-3 text-sm font-medium text-center text-gray-700 dark:text-gray-300 border-t border-r border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                          <div className="flex items-center justify-center h-8">
                            <span className="text-sm font-semibold">{formatTime(heure)} - {formatTime(getNextHour(heure))}</span>
                  </div>
                        </td>
                        {jours.map(jour => {
                          const session = getSessionAtSlot(jour, heure);
                          return (
                            <td
                              key={`${jour}-${heure}`}
                              className={`relative p-2 border-r border-gray-300 dark:border-gray-700 border-t border-gray-300 dark:border-gray-700 last:border-r-0 h-16 w-24 text-center align-middle ${session ? 'text-white font-medium text-xs' : 'bg-white dark:bg-gray-900'}`}
                              style={session ? { backgroundColor: session.matiere_couleur || '#f97316' } : {}}
                            >
                              {session ? (
                                <div className="flex flex-col items-center justify-center w-full h-full text-center">
                                  <div className="mb-1 text-[10px] font-semibold flex items-center justify-center gap-1">
                                    <Icon name="map-pin" size="sm" />
                                    <span className="truncate max-w-[100px]">
                                      {session.salle_nom && session.salle_active !== false 
                                        ? session.salle_nom 
                                        : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                                            Supprimé
                                          </span>
                                        )}
                                    </span>
                        </div>
                                  <div className="mb-1 text-[10px] font-semibold break-all max-w-[110px] mx-auto leading-tight">
                                      {session.matiere_nom && session.matiere_active !== false 
                                        ? session.matiere_nom 
                                        : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                                            Supprimé
                                          </span>
                                        )}
                                  </div>
                                  <div className="flex items-center justify-center text-[10px] truncate opacity-90">
                                    <Icon name="user" size="sm" className="mr-1" />
                                    <span className="truncate">
                                      {session.professeur_nom && session.professeur_active !== false 
                                        ? session.professeur_nom 
                                        : (
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
                                            Supprimé
                                          </span>
                                        )}
                                    </span>
                  </div>
                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Read-only: no modal */}
    </div>
  );
};

export default ClasseTimetable;


