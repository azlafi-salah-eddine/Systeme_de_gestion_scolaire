import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { classeService } from '../../services/classeService';
import { eleveService } from '../../services/eleveService';
import { professeurService } from '../../services/professeurService';
import notesService from '../../services/notesService';
import niveauService from '../../services/niveauService';
import matiereService from '../../services/matiereService';
import { useNotification } from '../../contexts/NotificationContext';

interface Classe {
  id: number;
  nom: string;
  niveau?: { id: number; nom: string } | string;
}

interface Eleve {
  id: number;
  nom_fr?: string;
  prenom_fr?: string;
  nom_complet?: string;
}


interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
}

interface NoteFormData {
  matiere_id: number;
  professeur_id: number;
  type_controle: string;
  bareme: number;
  date_controle: string;
  notes: Array<{
    eleve_id: number;
    note: number;
  }>;
}

const NotesNew: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  // Data state
  const [niveaux, setNiveaux] = useState<Array<{id: number, nom: string}>>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);
  const [matieres, setMatieres] = useState<Array<{id: number, nom: string, code: string}>>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [selectedNiveau, setSelectedNiveau] = useState<number | null>(null);
  const [selectedClasse, setSelectedClasse] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<NoteFormData>({
    matiere_id: 0,
    professeur_id: 0,
    type_controle: '',
    bareme: 20,
    date_controle: new Date().toISOString().split('T')[0],
    notes: []
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load classes when niveau changes
  useEffect(() => {
    if (selectedNiveau) {
      loadClasses(selectedNiveau);
    } else {
      setClasses([]);
      setSelectedClasse(null);
    }
  }, [selectedNiveau]);

  // Load students when class is selected
  useEffect(() => {
    if (selectedClasse) {
      loadElevesByClasse(selectedClasse);
    } else {
      setEleves([]);
    }
  }, [selectedClasse]);

  // Initialize notes array when students are loaded
  useEffect(() => {
    if (eleves.length > 0) {
      setFormData(prev => ({
        ...prev,
        notes: eleves.map(eleve => ({
          eleve_id: eleve.id,
          note: 0
        }))
      }));
    }
  }, [eleves]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load niveaux
      const niveauxRes = await niveauService.list();
      setNiveaux(Array.isArray(niveauxRes) ? niveauxRes : (niveauxRes as any)?.data || []);
      
      
      // Load matieres
      const matieresRes = await matiereService.getActive();
      setMatieres(Array.isArray(matieresRes) ? matieresRes : (matieresRes as any)?.data || []);
      
      // Load professeurs
      const professeursRes = await professeurService.list({ per_page: 1000 });
      setProfesseurs((professeursRes as any).data || professeursRes || []);
      
    } catch (error) {
      showError('Erreur', 'Impossible de charger les données initiales');
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async (niveauId: number) => {
    try {
      const response = await classeService.index({ 
        per_page: 1000, 
          niveau: niveauId.toString(),
        active: true 
      });
      setClasses(response.data || []);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les classes');
      console.error('Error loading classes:', error);
    }
  };

  const loadElevesByClasse = async (classeId: number) => {
    try {
      setLoading(true);
      const response = await eleveService.getElevesByClasse(classeId);
      setEleves(response.data || []);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les élèves de cette classe');
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNiveauChange = (niveauId: number) => {
    setSelectedNiveau(niveauId);
    setSelectedClasse(null);
    setShowForm(false);
  };

  const handleClasseChange = (classeId: number) => {
    setSelectedClasse(classeId);
    setShowForm(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClasse) {
      showError('Erreur', 'Veuillez sélectionner une classe');
      return;
    }

    if (!formData.matiere_id || !formData.professeur_id || !formData.type_controle) {
      showError('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Check if at least one note is entered
    const hasNotes = formData.notes.some(note => note.note > 0);
    if (!hasNotes) {
      showError('Erreur', 'Veuillez saisir au moins une note');
      return;
    }

    try {
      setLoading(true);
      
      // Create notes for all students with grades > 0
      const notePromises = formData.notes
        .filter(note => note.note > 0)
        .map(note => 
          notesService.createNote({
            eleve_id: note.eleve_id,
            matiere_id: formData.matiere_id,
            professeur_id: formData.professeur_id,
            note: note.note,
            bareme: formData.bareme,
            type_controle: formData.type_controle,
            annee_scolaire_id: 1 // You might want to get this from context
          })
        );

      await Promise.all(notePromises);
      
      showSuccess('Succès', 'Notes ajoutées avec succès pour tous les élèves');
      navigate('/notes');
      
    } catch (error) {
      showError('Erreur', 'Impossible d\'ajouter les notes');
      console.error('Error creating notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteChange = (eleveId: number, note: number) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes.map(n => 
        n.eleve_id === eleveId ? { ...n, note } : n
      )
    }));
  };

  const selectedClasseData = classes.find(c => c.id === selectedClasse);

  return (
    <div className="space-y-6">
      <PageHead
        title="Ajouter des Notes"
        subtitle="Sélectionnez une classe et ajoutez des notes pour tous les élèves"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Notes', link: '/notes' },
          { label: 'Ajouter des notes', link: '#' }
        ]}
      />

      {/* Niveau Selection */}
      <Card>
        <Card.Body>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sélectionner un niveau
            </h3>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {niveaux.map((niveau) => (
                  <button
                    key={niveau.id}
                    onClick={() => handleNiveauChange(niveau.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedNiveau === niveau.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {niveau.nom}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Class Selection */}
          {selectedNiveau && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Sélectionner une classe
              </h3>
              
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((classe) => (
                    <button
                      key={classe.id}
                      onClick={() => handleClasseChange(classe.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedClasse === classe.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {classe.nom}
                      </div>
                      {classe.niveau && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {typeof classe.niveau === 'string' ? classe.niveau : (classe.niveau?.nom || '')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedClasse && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    Classe sélectionnée: {selectedClasseData?.nom}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {eleves.length} élève{eleves.length > 1 ? 's' : ''} dans cette classe
                  </p>
                </div>
                <Button
                  onClick={() => setShowForm(!showForm)}
                  variant="primary"
                  icon={<Icon name="plus" size="sm" />}
                >
                  {showForm ? 'Masquer le formulaire' : 'Ajouter des notes'}
                </Button>
              </div>

              {showForm && (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {/* Form Header */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Matière <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.matiere_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, matiere_id: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value={0}>Sélectionner une matière</option>
                        {matieres.map(matiere => (
                          <option key={matiere.id} value={matiere.id}>
                            {matiere.nom} ({matiere.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Professeur <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.professeur_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, professeur_id: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value={0}>Sélectionner un professeur</option>
                        {professeurs.map(professeur => (
                          <option key={professeur.id} value={professeur.id}>
                            {professeur.nom_complet}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type de contrôle <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.type_controle}
                        onChange={(e) => setFormData(prev => ({ ...prev, type_controle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                      >
                        <option value="">Sélectionner un type</option>
                        <option value="Devoir">Devoir</option>
                        <option value="Contrôle">Contrôle</option>
                        <option value="Examen">Examen</option>
                        <option value="Oral">Oral</option>
                        <option value="Pratique">Pratique</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Barème
                      </label>
                      <input
                        type="number"
                        value={formData.bareme}
                        onChange={(e) => setFormData(prev => ({ ...prev, bareme: parseFloat(e.target.value) || 20 }))}
                        min="0.1"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date du contrôle
                      </label>
                      <input
                        type="date"
                        value={formData.date_controle}
                        onChange={(e) => setFormData(prev => ({ ...prev, date_controle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Students Notes Table */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        Notes des élèves
                      </h5>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Élève
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Note
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Pourcentage
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {eleves.map((eleve) => {
                            const noteData = formData.notes.find(n => n.eleve_id === eleve.id);
                            const note = noteData?.note || 0;
                            const percentage = formData.bareme > 0 ? (note / formData.bareme) * 100 : 0;
                            
                            return (
                              <tr key={eleve.id}>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {eleve.nom_complet}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <input
                                    type="number"
                                    min="0"
                                    max={formData.bareme}
                                    step="0.01"
                                    value={note}
                                    onChange={(e) => handleNoteChange(eleve.id, parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`text-sm font-medium ${
                                    percentage >= 80 ? 'text-green-600' : 
                                    percentage >= 60 ? 'text-yellow-600' : 
                                    percentage > 0 ? 'text-red-600' : 'text-gray-400'
                                  }`}>
                                    {percentage > 0 ? `${percentage.toFixed(1)}%` : '—'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/notes')}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                      icon={<Icon name="save" size="sm" />}
                    >
                      Enregistrer les notes
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default NotesNew;
