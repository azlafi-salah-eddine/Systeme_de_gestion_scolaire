import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { absenceService } from '../../services/absenceService';
import type { Absence, AbsencePayload } from '../../services/absenceService';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
  classe?: {
    id: number;
    nom: string;
  };
}

interface Professeur {
  id: number;
  nom: string;
  prenom: string;
}

interface Matiere {
  id: number;
  nom: string;
}

const AbsenceEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);

  const [formData, setFormData] = useState<AbsencePayload>({
    eleve_id: 0,
    date: '',
    motif: '',
    justifie: false,
    professeur_id: undefined,
    heure_debut: '',
    heure_fin: '',
    justification: '',
    matiere_id: undefined,
    active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger l'absence
        const absenceResponse = await absenceService.show(parseInt(id!));
        const absence = absenceResponse.data;
        
        setFormData({
          eleve_id: absence.eleve_id,
          date: absence.date,
          motif: absence.motif,
          justifie: absence.justifie,
          professeur_id: absence.professeur_id,
          heure_debut: absence.heure_debut || '',
          heure_fin: absence.heure_fin || '',
          justification: absence.justification || '',
          matiere_id: absence.matiere_id,
          active: absence.active,
        });

        // Charger les données de référence
        const [elevesRes, professeursRes, matieresRes] = await Promise.all([
          api.get('/v1/eleves', { params: { with: ['classe'] } }),
          api.get('/v1/professeurs'),
          api.get('/v1/matieres')
        ]);
        
        setEleves(elevesRes.data?.data || []);
        setProfesseurs(professeursRes.data?.data || []);
        setMatieres(matieresRes.data?.data || []);
      } catch (error: any) {
        showError('Erreur', error?.message || 'Erreur lors du chargement des données');
        navigate('/eleves/absences');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, navigate, showError]);

  const handleInputChange = (field: keyof AbsencePayload, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.eleve_id) {
      newErrors.eleve_id = 'L\'élève est requis';
    }
    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }
    if (!formData.motif.trim()) {
      newErrors.motif = 'Le motif est requis';
    }
    if (formData.heure_debut && formData.heure_fin) {
      if (formData.heure_debut >= formData.heure_fin) {
        newErrors.heure_fin = 'L\'heure de fin doit être après l\'heure de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await absenceService.update(parseInt(id!), formData);
      showSuccess('Succès', 'Absence modifiée avec succès');
      navigate(`/eleves/absences/${id}`);
    } catch (error: any) {
      showError('Erreur', error?.message || 'Erreur lors de la modification de l\'absence');
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead 
        title="Modifier l'absence" 
        subtitle="Modifier les informations de l'absence" 
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' }, 
          { label: 'Absences', link: '/absences' },
          { label: 'Détails', link: `/absences/${id}` },
          { label: 'Modifier', link: `/absences/${id}/edit` }
        ]} 
      />

      <Card>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Élève */}
              <div>
                <label htmlFor="eleve_id" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Élève *
                </label>
                <select
                  id="eleve_id"
                  value={formData.eleve_id}
                  onChange={(e) => handleInputChange('eleve_id', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.eleve_id ? 'border-red-300 dark:border-red-600' : 'border-slate-300 dark:border-gray-600'}`}
                >
                  <option value={0}>Sélectionner un élève</option>
                  {eleves.map((eleve) => (
                    <option key={eleve.id} value={eleve.id}>
                      {eleve.nom} {eleve.prenom} - {eleve.classe?.nom}
                    </option>
                  ))}
                </select>
                {errors.eleve_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.eleve_id}</p>}
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.date ? 'border-red-300 dark:border-red-600' : 'border-slate-300 dark:border-gray-600'}`}
                />
                {errors.date && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
              </div>

              {/* Heure de début */}
              <div>
                <label htmlFor="heure_debut" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Heure de début
                </label>
                <input
                  type="time"
                  id="heure_debut"
                  value={formData.heure_debut}
                  onChange={(e) => handleInputChange('heure_debut', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Heure de fin */}
              <div>
                <label htmlFor="heure_fin" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Heure de fin
                </label>
                <input
                  type="time"
                  id="heure_fin"
                  value={formData.heure_fin}
                  onChange={(e) => handleInputChange('heure_fin', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${errors.heure_fin ? 'border-red-300 dark:border-red-600' : 'border-slate-300 dark:border-gray-600'}`}
                />
                {errors.heure_fin && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.heure_fin}</p>}
              </div>

              {/* Professeur */}
              <div>
                <label htmlFor="professeur_id" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Professeur
                </label>
                <select
                  id="professeur_id"
                  value={formData.professeur_id || ''}
                  onChange={(e) => handleInputChange('professeur_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner un professeur</option>
                  {professeurs.map((professeur) => (
                    <option key={professeur.id} value={professeur.id}>
                      {professeur.nom} {professeur.prenom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Matière */}
              <div>
                <label htmlFor="matiere_id" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Matière
                </label>
                <select
                  id="matiere_id"
                  value={formData.matiere_id || ''}
                  onChange={(e) => handleInputChange('matiere_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner une matière</option>
                  {matieres.map((matiere) => (
                    <option key={matiere.id} value={matiere.id}>
                      {matiere.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Motif */}
            <div>
              <label htmlFor="motif" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Motif *
              </label>
              <textarea
                id="motif"
                value={formData.motif}
                onChange={(e) => handleInputChange('motif', e.target.value)}
                placeholder="Décrivez le motif de l'absence..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${errors.motif ? 'border-red-300 dark:border-red-600' : 'border-slate-300 dark:border-gray-600'}`}
              />
              {errors.motif && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.motif}</p>}
            </div>

            {/* Justification */}
            <div>
              <label htmlFor="justification" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                Justification
              </label>
              <textarea
                id="justification"
                value={formData.justification}
                onChange={(e) => handleInputChange('justification', e.target.value)}
                placeholder="Justification de l'absence (optionnel)..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Statut justifié */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="justifie"
                checked={formData.justifie}
                onChange={(e) => handleInputChange('justifie', e.target.checked)}
                className="h-4 w-4 text-primary-600 dark:text-primary-500 focus:ring-primary-500 dark:focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              />
              <label htmlFor="justifie" className="ml-2 block text-sm text-slate-700 dark:text-gray-300">
                Absence justifiée
              </label>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/eleves/absences/${id}`)}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Modification...
                  </>
                ) : (
                  <>
                    <Icon name="check" className="text-lg mr-2" />
                    Modifier
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AbsenceEdit;
