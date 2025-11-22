import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import notesService, { type Note, type CreateNoteData } from '../../services/notesService';
import Button from '../ui/Button';
import Icon from '../Icon';

interface NoteFormProps {
  note?: Note;
  onSave: (note: Note) => void;
  onCancel: () => void;
  isEditing?: boolean;
  isModal?: boolean; // Nouveau prop pour déterminer si c'est un modal ou une page
}

const NoteForm: React.FC<NoteFormProps> = ({
  note,
  onSave,
  onCancel,
  isEditing = false,
  isModal = true // Par défaut, c'est un modal
}) => {
  const [searchParams] = useSearchParams();
  
  // Lire les paramètres d'URL
  const urlEleveId = searchParams.get('eleve_id');
  const urlControleId = searchParams.get('controle_id');
  const urlDisciplineId = searchParams.get('discipline_id');
  const urlProfesseurId = searchParams.get('professeur_id');
  const urlPeriodeId = searchParams.get('periode_id');
  const urlAnneeScolaireId = searchParams.get('annee_scolaire_id');

  const [formData, setFormData] = useState<CreateNoteData>({
    eleve_id: note?.eleve_id || (urlEleveId ? parseInt(urlEleveId) : 0),
    matiere_id: note?.matiere_id || 0,
    discipline_id: note?.discipline_id || (urlDisciplineId ? parseInt(urlDisciplineId) : undefined),
    controle_id: note?.controle_id || (urlControleId ? parseInt(urlControleId) : undefined),
    professeur_id: note?.professeur_id || (urlProfesseurId ? parseInt(urlProfesseurId) : 0),
    note: note?.note || 0,
    bareme: note?.bareme || 20,
    type_controle: note?.type_controle || '',
    periode_id: note?.periode_id || (urlPeriodeId ? parseInt(urlPeriodeId) : undefined),
    annee_scolaire_id: note?.annee_scolaire_id || (urlAnneeScolaireId ? parseInt(urlAnneeScolaireId) : undefined),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Mock data - En production, ces données viendraient de l'API
  const eleves = [
    { id: 1, nom: 'Dupont', prenom: 'Jean', nom_complet: 'Jean Dupont' },
    { id: 2, nom: 'Martin', prenom: 'Marie', nom_complet: 'Marie Martin' },
    { id: 3, nom: 'Bernard', prenom: 'Pierre', nom_complet: 'Pierre Bernard' },
  ];

  const disciplines = [
    { id: 1, nom: 'Mathématiques', code: 'MATH', coefficient: 3 },
    { id: 2, nom: 'Français', code: 'FR', coefficient: 2 },
    { id: 3, nom: 'Anglais', code: 'ENG', coefficient: 2 },
    { id: 4, nom: 'Sciences', code: 'SCI', coefficient: 2 },
  ];

  const professeurs = [
    { id: 1, nom: 'Durand', prenom: 'Sophie', nom_complet: 'Sophie Durand' },
    { id: 2, nom: 'Moreau', prenom: 'Michel', nom_complet: 'Michel Moreau' },
    { id: 3, nom: 'Leroy', prenom: 'Isabelle', nom_complet: 'Isabelle Leroy' },
  ];

  const controles = [
    { id: 1, nom: 'Devoir 1', type: 'Devoir' },
    { id: 2, nom: 'Contrôle 1', type: 'Contrôle' },
    { id: 3, nom: 'Examen', type: 'Examen' },
  ];

  const periodes = [
    { id: 1, nom: '1er Trimestre', description: 'Premier trimestre', date_debut: '2024-09-01', date_fin: '2024-12-20' },
    { id: 2, nom: '2ème Trimestre', description: 'Deuxième trimestre', date_debut: '2025-01-06', date_fin: '2025-03-28' },
    { id: 3, nom: '3ème Trimestre', description: 'Troisième trimestre', date_debut: '2025-04-07', date_fin: '2025-06-30' },
  ];

  const anneesScolaires = [
    { id: 1, nom: '2024-2025', annee_debut: 2024, annee_fin: 2025, active: true },
    { id: 2, nom: '2023-2024', annee_debut: 2023, annee_fin: 2024, active: false },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'eleve_id' || name === 'discipline_id' || name === 'professeur_id' || 
              name === 'controle_id' || name === 'periode_id' || name === 'annee_scolaire_id' 
        ? (value ? parseInt(value) : undefined)
        : name === 'note' || name === 'bareme'
        ? parseFloat(value) || 0
        : value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.eleve_id) {
      errors.eleve_id = 'L\'élève est requis';
    }
    if (!formData.discipline_id) {
      errors.discipline_id = 'La discipline est requise';
    }
    if (!formData.professeur_id) {
      errors.professeur_id = 'Le professeur est requis';
    }
    if (formData.note < 0 || (formData.bareme && formData.note > formData.bareme)) {
      errors.note = `La note doit être entre 0 et ${formData.bareme || 20}`;
    }
    if (formData.bareme && formData.bareme <= 0) {
      errors.bareme = 'Le barème doit être supérieur à 0';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let response;
      if (isEditing && note) {
        response = await notesService.updateNote(note.id, formData);
      } else {
        response = await notesService.createNote(formData);
      }

      if (response.success) {
        onSave(response.data);
      } else {
        setError('Erreur lors de la sauvegarde de la note');
      }
    } catch (err) {
      setError('Erreur lors de la sauvegarde de la note');
      console.error('Error saving note:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isModal ? "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" : ""}>
      <div className={isModal ? "relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800" : "p-6"}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {isEditing ? 'Modifier la note' : 'Ajouter une nouvelle note'}
          </h3>
          {isModal && (
            <Button
              variant="ghost"
              onClick={onCancel}
              icon={<Icon name="times" size="sm" />}
            />
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Élève */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Élève <span className="text-red-500">*</span>
              </label>
              <select
                name="eleve_id"
                value={formData.eleve_id || ''}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  validationErrors.eleve_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner un élève</option>
                {eleves.map(eleve => (
                  <option key={eleve.id} value={eleve.id}>
                    {eleve.nom_complet}
                  </option>
                ))}
              </select>
              {validationErrors.eleve_id && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.eleve_id}</p>
              )}
            </div>

            {/* Discipline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discipline <span className="text-red-500">*</span>
              </label>
              <select
                name="discipline_id"
                value={formData.discipline_id || ''}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.discipline_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner une discipline</option>
                {disciplines.map(discipline => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.nom} ({discipline.code})
                  </option>
                ))}
              </select>
              {validationErrors.discipline_id && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.discipline_id}</p>
              )}
            </div>

            {/* Professeur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professeur <span className="text-red-500">*</span>
              </label>
              <select
                name="professeur_id"
                value={formData.professeur_id || ''}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.professeur_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner un professeur</option>
                {professeurs.map(professeur => (
                  <option key={professeur.id} value={professeur.id}>
                    {professeur.nom_complet}
                  </option>
                ))}
              </select>
              {validationErrors.professeur_id && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.professeur_id}</p>
              )}
            </div>

            {/* Contrôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contrôle
              </label>
              <select
                name="controle_id"
                value={formData.controle_id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un contrôle</option>
                {controles.map(controle => (
                  <option key={controle.id} value={controle.id}>
                    {controle.nom} ({controle.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                min="0"
                max={formData.bareme}
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.note ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {validationErrors.note && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.note}</p>
              )}
            </div>

            {/* Barème */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barème <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="bareme"
                value={formData.bareme}
                onChange={handleInputChange}
                min="0.1"
                step="0.1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.bareme ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="20.00"
              />
              {validationErrors.bareme && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.bareme}</p>
              )}
            </div>

            {/* Type de contrôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de contrôle
              </label>
              <select
                name="type_controle"
                value={formData.type_controle || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un type</option>
                <option value="Devoir">Devoir</option>
                <option value="Contrôle">Contrôle</option>
                <option value="Examen">Examen</option>
                <option value="Oral">Oral</option>
                <option value="Pratique">Pratique</option>
                <option value="TP">Travaux Pratiques</option>
                <option value="Projet">Projet</option>
              </select>
            </div>

            {/* Période */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Période
              </label>
              <select
                name="periode_id"
                value={formData.periode_id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner une période</option>
                {periodes.map(periode => (
                  <option key={periode.id} value={periode.id}>
                    {periode.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Année scolaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année scolaire
              </label>
              <select
                name="annee_scolaire_id"
                value={formData.annee_scolaire_id || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner une année</option>
                {anneesScolaires.map(annee => (
                  <option key={annee.id} value={annee.id}>
                    {annee.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              loading={loading}
              icon={!loading ? <Icon name="save" size="sm" /> : undefined}
            >
              {isEditing ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteForm;
