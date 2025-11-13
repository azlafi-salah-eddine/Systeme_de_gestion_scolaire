import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Icon from '../../components/Icon';
import Button from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { timetableService } from '../../services/timetableService';
import type { TimetableItem } from '../../services/timetableService';
import Error404 from '../errors/Error404';

interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
}

const jours: TimetableItem['jour'][] = ['lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const heures = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];

function formatTime(t: string) { return t.substring(0,5); }

function getNextHour(h: string) {
  const i = heures.indexOf(h);
  return i < heures.length - 1 ? heures[i+1] : '17:00';
}

const ProfesseurTimetable: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isProfesseur } = useAuth();
  const [prof, setProf] = useState<Professeur | null>(null);
  const [items, setItems] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const professeurId = (user as any)?.professeur_id;

  useEffect(() => {
    // Ne pas charger les données si l'accès est refusé
    if (accessDenied) {
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Si c'est un professeur, vérifier d'abord qu'il accède à son propre emploi du temps
        if (isProfesseur() && professeurId && id && Number(id) !== professeurId) {
          setAccessDenied(true);
          return;
        }
        
        // Si c'est un professeur qui consulte son propre emploi du temps, ne pas récupérer le profil
        // (car la route /professeurs/:id est maintenant bloquée pour les professeurs)
        // Utiliser directement les données de l'utilisateur connecté
        if (isProfesseur() && professeurId && Number(id) === professeurId) {
          // Utiliser les données de l'utilisateur pour le profil
          setProf({
            id: professeurId,
            nom: user?.nom || '',
            prenom: user?.prenom || '',
            email: user?.email,
            telephone: user?.telephone,
          } as Professeur);
          
          // Charger uniquement l'emploi du temps
          const timetable = await timetableService.byProfesseur(Number(id));
          setItems(timetable.data);
        } else {
          // Pour les admins, charger les données du professeur et l'emploi du temps
          const [{ data: profData }, timetable] = await Promise.all([
            api.get(`/v1/professeurs/${id}`),
            timetableService.byProfesseur(Number(id))
          ]);
          
          setProf(profData.data);
          setItems(timetable.data);
        }
      } catch (e: any) {
        // Si c'est une erreur 403 (accès refusé) ou 404 (professeur non trouvé), rediriger vers 404
        if (e?.response?.status === 403 || e?.response?.status === 404) {
          setAccessDenied(true);
        } else {
          setError(e?.message || 'Erreur de chargement');
        }
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id, accessDenied, isProfesseur, professeurId, user]);

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

  const getSessionAtSlot = (jour: TimetableItem['jour'], heure: string): TimetableItem | null => {
    const sessions = grouped[jour] || [];
    const toMinutes = (t: string) => {
      const [h,m] = (t || '0:0').split(':').map(n => parseInt(n || '0', 10));
      return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    };
    const slotMin = toMinutes(heure);
    return sessions.find(s => toMinutes(s.heure_debut) <= slotMin && toMinutes(s.heure_fin) > slotMin) || null;
  };

  // Si accès refusé, afficher la page 404 (après tous les hooks)
  if (accessDenied) {
    return <Error404 />;
  }

  return (
    <div className="space-y-6">
      <PageHead 
        title={prof ? `Emploi du temps - ${prof.prenom} ${prof.nom}` : 'Emploi du temps'} 
        subtitle="Planning hebdomadaire" 
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' }, 
          { label: 'Professeurs', link: '/professeurs' }, 
          { label: prof ? `${prof.prenom} ${prof.nom}` : 'Professeur', link: `/professeurs/${id}` },
          { label: 'Emploi du temps', link: `/professeurs/${id}/timetable` }
        ]} 
      />

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
        <>
          {/* Professor info header - seulement pour les admins */}
          {prof && !isProfesseur() && (
            <Card>
              <div className="p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white flex items-center justify-center text-xl font-bold">
                  {prof.prenom?.[0]}{prof.nom?.[0]}
                </div>
                <div className="flex-1">
                  <div className="text-xl font-semibold text-slate-800 dark:text-white">{prof.prenom} {prof.nom}</div>
                  <div className="text-sm text-slate-500 dark:text-gray-400">{prof.email || '—'} · {prof.telephone || '—'}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => navigate(`/professeurs/${id}`)}>
                    <Icon name="eye" size="sm" />
                    <span className="ml-2">Voir profil</span>
                  </Button>
                  <Button variant="secondary" onClick={() => navigate(`/professeurs/${id}/edit`)}>
                    <Icon name="edit" size="sm" />
                    <span className="ml-2">Modifier</span>
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Timetable table */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Icon name="calendar" className="text-slate-500 dark:text-gray-400" />
                <div className="font-semibold text-slate-800 dark:text-white">Emploi du temps hebdomadaire</div>
                <div className="text-sm text-slate-500 dark:text-gray-400">({items.length} séances)</div>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="px-4 py-2 text-sm font-semibold text-center text-slate-700 dark:text-gray-300">
                    Emploi du temps - {prof ? `${prof.prenom} ${prof.nom}` : 'Professeur'}
                  </div>
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
                                              Élément supprimé
                                            </span>
                                          )}
                                      </div>
                                      <div className="flex items-center justify-center text-[10px] truncate opacity-90">
                                        <Icon name="users" size="sm" className="mr-1" />
                                        <span className="truncate">
                                          {session.classe_nom && session.classe_active !== false 
                                            ? session.classe_nom 
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
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProfesseurTimetable;
