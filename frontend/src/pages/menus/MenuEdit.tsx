import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { menuService } from '../../services/menuService';
import { cantineService } from '../../services/cantineService';
import type { MenuItem } from '../../services/menuService';
import type { Cantine } from '../../types/eleve';

const MenuEdit: React.FC = () => {
  const { id } = useParams();
  const menuId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [cantines, setCantines] = useState<Cantine[]>([]);
  const [jours] = useState<MenuItem['jour'][]>(['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche']);

  const [cantineId, setCantineId] = useState<number | ''>('');
  const [jour, setJour] = useState<MenuItem['jour'] | ''>('');
  const [plat, setPlat] = useState('');
  const [entree, setEntree] = useState('');
  const [dessert, setDessert] = useState('');
  const [boisson, setBoisson] = useState('');
  const [dateMenu, setDateMenu] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadCantines();
  }, []);

  useEffect(() => {
    if (!menuId) return;
    void loadMenu();
  }, [menuId]);

  const loadCantines = async () => {
    try {
      const res = await cantineService.list({ per_page: 100 });
      setCantines(res.data);
    } catch {}
  };

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await menuService.show(menuId);
      const m = res.data;
      setCantineId(m.cantine_id);
      setJour(m.jour);
      setPlat(m.plat_principal);
      setEntree(m.entree || '');
      setDessert(m.dessert || '');
      setBoisson(m.boisson || '');
      setDateMenu(m.date_menu || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantineId) return setError('Cantine requise');
    if (!jour) return setError('Jour requis');
    if (!plat.trim()) return setError('Plat principal requis');
    try {
      setSaving(true);
      setError(null);
      await menuService.update(menuId, {
        cantine_id: Number(cantineId),
        jour: jour as MenuItem['jour'],
        plat_principal: plat.trim(),
        entree: entree.trim() || undefined,
        dessert: dessert.trim() || undefined,
        boisson: boisson.trim() || undefined,
        date_menu: dateMenu || undefined,
      });
      navigate(`/menus/${menuId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title="Modifier le menu" 
        subtitle="Mettre à jour les informations du menu"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Menus', link: '/menus' },
          { label: 'Modifier', link: `/menus/${menuId}/edit` },
        ]}
      />

      <Card>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <form className="p-6 space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-600">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantine</label>
                <select className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" value={cantineId} onChange={(e) => setCantineId(e.target.value ? Number(e.target.value) : '')} required>
                  <option value="">Sélectionner</option>
                  {cantines.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jour</label>
                <select className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" value={jour} onChange={(e) => setJour(e.target.value as MenuItem['jour'] | '')} required>
                  <option value="">Sélectionner</option>
                  {jours.map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plat principal</label>
                <input type="text" className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" value={plat} onChange={(e) => setPlat(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Entrée</label>
                <input type="text" className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" value={entree} onChange={(e) => setEntree(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dessert</label>
                <input type="text" className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" value={dessert} onChange={(e) => setDessert(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Boisson</label>
                <input type="text" className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" value={boisson} onChange={(e) => setBoisson(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date (optionnelle)</label>
                <input type="date" className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500" value={dateMenu} onChange={(e) => setDateMenu(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Annuler</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default MenuEdit;


