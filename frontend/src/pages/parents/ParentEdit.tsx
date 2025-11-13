import React, { useEffect, useState } from 'react';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { useNavigate, useParams } from 'react-router-dom';
import { parentService, type ParentPayload, type ParentEleve } from '../../services/parentService';
import { useNotification } from '../../contexts/NotificationContext';

const ParentEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [parent, setParent] = useState<ParentEleve | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ParentPayload>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    profession: '',
    type: 'pere',
  });

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await parentService.show(Number(id));
        const parentData = (res as any).parent;
        setParent(parentData);
        setForm({
          nom: parentData?.nom || '',
          prenom: parentData?.prenom || '',
          email: parentData?.email || '',
          telephone: parentData?.telephone || '',
          adresse: parentData?.adresse || '',
          profession: parentData?.profession || '',
          type: parentData?.type || 'pere',
        });
      } catch (e: any) {
        setError(e?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await parentService.update(Number(id), form);
      showSuccess('Modifié', 'Les informations du parent ont été enregistrées.');
      navigate(`/parents/${id}`);
    } catch (e) {
      const msg = (e as any)?.message || 'Erreur lors de la mise à jour';
      setError(msg);
      showError('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  const input = (name: keyof ParentPayload, placeholder: string, type: string = 'text') => (
    <input
      value={(form[name] as any) || ''}
      onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      placeholder={placeholder}
      type={type}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500"
    />
  );

  return (
    <div className="space-y-6">
      <PageHead title="Modifier parent" subtitle="Mettre à jour les informations" breadcrumb={[{ label: 'Accueil', link: '/dashboard' }, { label: 'Parents', link: '/parents' }, { label: 'Modifier', link: `/parents/${id}/edit` }]} />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-400">{error}</div>
      ) : (
        <Card>
          <div className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-gray-300">Prénom</label>
                  {input('prenom', 'Prénom')}
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-gray-300">Nom</label>
                  {input('nom', 'Nom')}
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-gray-300">Email</label>
                  {input('email', 'Email', 'email')}
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-gray-300">Téléphone</label>
                  {input('telephone', 'Téléphone')}
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-gray-300">Adresse</label>
                  {input('adresse', 'Adresse')}
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-gray-300">Profession</label>
                  {input('profession', 'Profession')}
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-gray-300">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'pere' | 'mere' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500"
                  >
                    <option value="pere">Père</option>
                    <option value="mere">Mère</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="primary" type="submit" disabled={saving}>
                  <Icon name="check" size="sm" />
                  <span className="ml-2">{saving ? 'Sauvegarde...' : 'Enregistrer'}</span>
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ParentEdit;
