import React, { useEffect, useState } from 'react';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { professeurService } from '../../services/professeurService';
import type { ProfesseurPayload } from '../../services/professeurService';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';

const ProfesseurEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useNotification();
  const [form, setForm] = useState<Partial<ProfesseurPayload>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTelephoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Ne garder que les chiffres
    const numericValue = value.replace(/[^0-9]/g, '');
    setForm({ ...form, telephone: numericValue });
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await professeurService.show(Number(id));
        const p = res.data;
        setForm({
          nom: p.nom,
          prenom: p.prenom,
          email: p.email,
          telephone: p.telephone,
          adresse: p.adresse,
          diplome: p.diplome,
          anciennete: p.anciennete,
          date_embauche: p.date_embauche,
          salaire: p.salaire,
        });
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id]);

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      await professeurService.update(Number(id), form);
      showSuccess('Modifié', 'Les informations du professeur ont été enregistrées.');
      navigate(`/professeurs/${id}`);
    } catch (e: any) {
      const msg = e?.message || 'Erreur lors de la sauvegarde';
      setError(msg);
      showError('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead title="Modifier professeur" breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Professeurs', link: '/professeurs' }, { label: 'Modifier', link: `/professeurs/${id}/edit` }]} />
      <Card>
        <div className="p-6 space-y-4">
          {loading && <div className="text-sm text-slate-500 dark:text-gray-400">Chargement...</div>}
          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 dark:text-gray-300 mb-1">Prénom</label>
                <input value={form.prenom || ''} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-gray-300 mb-1">Nom</label>
                <input value={form.nom || ''} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-gray-300 mb-1">Email</label>
                <input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-gray-300 mb-1">Téléphone</label>
                <input type="tel" value={form.telephone || ''} onChange={handleTelephoneChange} maxLength={20} placeholder="0612345678" className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-600 dark:text-gray-300 mb-1">Adresse</label>
                <input value={form.adresse || ''} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-gray-300 mb-1">Diplôme</label>
                <input value={form.diplome || ''} onChange={e => setForm(f => ({ ...f, diplome: e.target.value }))} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-gray-300 mb-1">Ancienneté (années)</label>
                <input type="number" value={form.anciennete || 0} onChange={e => setForm(f => ({ ...f, anciennete: Number(e.target.value) }))} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-gray-300 mb-1">Date d'embauche</label>
                <input 
                  type="date" 
                  value={form.date_embauche || ''} 
                  onChange={e => {
                    const selectedDate = e.target.value;
                    const today = new Date().toISOString().split('T')[0];
                    // Ne permettre que les dates d'aujourd'hui ou avant
                    if (selectedDate <= today) {
                      setForm(f => ({ ...f, date_embauche: selectedDate }));
                    }
                  }} 
                  max={new Date().toISOString().split('T')[0]} 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-gray-300 mb-1">Salaire</label>
                <input type="number" step="0.01" value={form.salaire || 0} onChange={e => setForm(f => ({ ...f, salaire: Number(e.target.value) }))} className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500" />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => navigate(`/professeurs/${id}`)}>
              <Icon name="arrow-left" />
              <span className="ml-2">Annuler</span>
            </Button>
            <Button variant="primary" onClick={save} disabled={saving}>
              <Icon name="check" />
              <span className="ml-2">Enregistrer</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfesseurEdit;
