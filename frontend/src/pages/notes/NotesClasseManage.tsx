import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Icon from '../../components/Icon';
import { eleveService } from '../../services/eleveService';
import type { Eleve } from '../../types/eleve';
import { classeService } from '../../services/classeService';
import matiereService from '../../services/matiereService';
import notesService from '../../services/notesService';
import { controleService } from '../../services/controleService';
import niveauService from '../../services/niveauService';
import { useNotification } from '../../contexts/NotificationContext';
import jsPDF from 'jspdf';

// Utiliser l'interface Eleve du service

interface Classe {
  id: number;
  nom: string;
  annee_scolaire_id?: number;
  niveau?: string | {
    id: number;
    nom: string;
    bareme?: number;
  };
}

interface Matiere {
  id: number;
  nom: string;
  code: string;
  description?: string;
  couleur?: string;
  active: boolean;
}



interface Controle {
  id: number;
  libelle: string;
  debut_controle: string;
  fin_controle: string;
  matiere_id: number;
  professeur_id: number;
  periode_id: number;
  active: boolean;
  matiere?: {
    id: number;
    nom: string;
    code: string;
    niveau?: {
      id: number;
      nom: string;
    };
  };
  professeur?: {
    id: number;
    nom: string;
    prenom: string;
    diplome?: string;
    anciennete?: number;
    telephone?: string;
    email?: string;
    adresse?: string;
    date_embauche?: string;
    salaire?: string;
    active: boolean;
    created_at: string;
    updated_at: string;
  };
  periode?: {
    id: number;
    nom: string;
    date_debut: string;
    date_fin: string;
  };
}

interface NoteFormData {
  controle_id: number;
  notes: Array<{
    eleve_id: number;
    note: number;
  }>;
}

const NotesClasseManage: React.FC = () => {
  const { classeId } = useParams<{ classeId: string }>();
  const { showSuccess, showError } = useNotification();
  
  // Data state
  const [classe, setClasse] = useState<Classe | null>(null);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [controles, setControles] = useState<Controle[]>([]);
  const [existingNotes, setExistingNotes] = useState<any[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState<number | null>(null);
  const [selectedProfesseur, setSelectedProfesseur] = useState<{id: number, nom: string, prenom: string} | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<NoteFormData>({
    controle_id: 0,
    notes: []
  });

  // Get bareme from niveau
  const getBareme = (): number => {
    if (classe?.niveau && typeof classe.niveau === 'object' && 'bareme' in classe.niveau) {
      const bareme = classe.niveau.bareme;
      // S'assurer que c'est un nombre
      return typeof bareme === 'number' ? bareme : parseFloat(String(bareme || 20.00));
    }
    return 20.00;
  };

  // Format bareme to remove unnecessary .00
  const formatBareme = (value: number | string): string => {
    // Convertir en nombre si c'est une string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Si c'est NaN, retourner la valeur par défaut
    if (isNaN(numValue)) {
      return '20';
    }
    
    // Arrondir à 2 décimales pour éviter les problèmes de précision
    const rounded = Math.round(numValue * 100) / 100;
    
    // Si c'est un nombre entier (ou très proche), retourner sans décimales
    if (Math.abs(rounded % 1) < 0.001) {
      return Math.round(rounded).toString();
    }
    // Sinon, formater avec 2 décimales et retirer les zéros finaux inutiles
    const formatted = rounded.toFixed(2);
    // Retirer les zéros finaux (ex: "5.50" reste "5.5", "5.00" devient "5")
    return parseFloat(formatted).toString();
  };

  // Load initial data
  useEffect(() => {
    if (classeId) {
      loadInitialData();
    }
  }, [classeId]);


  // Load students when class is loaded
  useEffect(() => {
    if (classeId && classe) {
      loadElevesByClasse(parseInt(classeId));
    }
  }, [classeId, classe]);

  // Initialize notes array when students are loaded
  useEffect(() => {
    if (eleves.length > 0 && existingNotes.length === 0) {
      setFormData(prev => ({
        ...prev,
        notes: eleves.map(eleve => ({
          eleve_id: eleve.id,
          note: 0
        }))
      }));
    }
  }, [eleves, existingNotes.length]);

  // Load controles when matiere is selected
  useEffect(() => {
    if (selectedMatiere && classeId) {
      loadControlesForClasse(parseInt(classeId), selectedMatiere);
    } else {
      setControles([]);
      setFormData(prev => ({ ...prev, controle_id: 0 }));
      setSelectedProfesseur(null);
    }
  }, [selectedMatiere, classeId]);

  // Auto-select first controle when controles are loaded
  useEffect(() => {
    if (controles.length > 0) {
      setFormData(prev => ({
        ...prev,
        controle_id: controles[0].id
      }));
      // Charger les notes existantes pour le premier contrôle
      loadExistingNotes(controles[0].id);
    }
  }, [controles]);

  // Set professor when controle is selected
  useEffect(() => {
    if (formData.controle_id > 0) {
      const selectedControle = controles.find(c => c.id === formData.controle_id);
      if (selectedControle?.professeur) {
        setSelectedProfesseur({
          id: selectedControle.professeur.id,
          nom: selectedControle.professeur.nom,
          prenom: selectedControle.professeur.prenom
        });
      } else {
        setSelectedProfesseur(null);
      }
    } else {
      setSelectedProfesseur(null);
    }
  }, [formData.controle_id, controles]);

  // Reset professeur when matiere changes
  useEffect(() => {
    if (!selectedMatiere) {
      setSelectedProfesseur(null);
    }
  }, [selectedMatiere]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load classe with niveau relation
      if (classeId) {
        const classeRes = await classeService.show(parseInt(classeId), ['niveau']);
        const classeData = classeRes.data || null;
        
        // If niveau is loaded but doesn't have bareme, load it separately
        if (classeData?.niveau && typeof classeData.niveau === 'object' && 'id' in classeData.niveau) {
          const niveauId = (classeData.niveau as any).id;
          
          // Check if bareme is missing, then load niveau details
          if (!('bareme' in classeData.niveau)) {
            try {
              const niveauDetail = await niveauService.show(niveauId);
              
              // Update classe data with bareme
              classeData.niveau = {
                ...(classeData.niveau as any),
                bareme: niveauDetail.bareme || 20.00
              };
            } catch (err) {
              // Set default bareme if loading fails
              classeData.niveau = {
                ...(classeData.niveau as any),
                bareme: 20.00
              };
            }
          }
        }
        
        setClasse(classeData);
        
        // Load matieres filtered by classe niveau
        if (classeData?.niveau && typeof classeData.niveau === 'object' && 'id' in classeData.niveau) {
          // Use getAll() instead of getActive() to get full matiere data including niveau_id
          const matieresRes = await matiereService.getAll();
          const allMatieres = matieresRes || [];
          
          // Filter matieres by classe niveau
          const filteredMatieres = allMatieres.filter((matiere: any) => 
            matiere.niveau_id === (classeData.niveau as any).id
          );
          setMatieres(filteredMatieres);
        } else {
          // If no niveau, load all matieres (fallback)
          const matieresRes = await matiereService.getAll();
          setMatieres(matieresRes || []);
        }
      }
      
    } catch (error) {
      showError('Erreur', 'Impossible de charger les données initiales');
    } finally {
      setLoading(false);
    }
  };

  const loadElevesByClasse = async (classeId: number) => {
    try {
      // Exclure les élèves non affectés
      const params: any = {
        has_classe: 'true'
      };
      // Ajouter le filtre d'année scolaire si la classe a une année scolaire
      if (classe?.annee_scolaire_id) {
        params.annee_scolaire_id = classe.annee_scolaire_id;
      }
      const response = await eleveService.getElevesByClasse(classeId, params);
      setEleves(response.data || []);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les élèves de cette classe');
    }
  };



  const loadControlesForClasse = async (classeId: number, matiereId: number) => {
    try {
      // Récupérer les contrôles pour cette classe
      const response = await controleService.getControlesForClasse(classeId);
      
      if (response.success && response.data) {
        // Filtrer les contrôles pour cette matière et qui sont actifs
        const controlesFiltres = response.data.filter((controle: Controle) => 
          controle.matiere_id === matiereId && controle.active
        );
        
        setControles(controlesFiltres);
      } else {
        setControles([]);
        if (response.message) {
          showError('Erreur', response.message);
        }
      }
    } catch (error) {
      showError('Erreur', 'Impossible de charger les contrôles');
    }
  };

  const loadExistingNotes = async (controleId: number) => {
    try {
      const response = await notesService.getNotes({ controle_id: controleId });
      
      if (response.success && response.data && response.data.length > 0) {
        setExistingNotes(response.data);
        
        // Pré-remplir le formulaire avec les notes existantes
        const notesFormData = eleves.map(eleve => {
          const existingNote = response.data.find((note: any) => note.eleve_id === eleve.id);
          const noteValue = existingNote ? parseFloat(existingNote.note) : 0;
          
          return {
            eleve_id: eleve.id,
            note: noteValue
          };
        });
        
        setFormData(prev => ({
          ...prev,
          notes: notesFormData
        }));
      } else {
        setExistingNotes([]);
        // Initialiser avec des notes vides
        const notesFormData = eleves.map(eleve => ({
          eleve_id: eleve.id,
          note: 0
        }));
        
        setFormData(prev => ({
          ...prev,
          notes: notesFormData
        }));
      }
    } catch (error) {
      setExistingNotes([]);
      // En cas d'erreur, initialiser avec des notes vides
      const notesFormData = eleves.map(eleve => ({
        eleve_id: eleve.id,
        note: 0
      }));
      
      setFormData(prev => ({
        ...prev,
        notes: notesFormData
      }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.controle_id) {
      showError('Erreur', 'Veuillez sélectionner un contrôle');
      return;
    }

    // Si aucun professeur n'est trouvé, afficher un message d'erreur plus informatif
    if (!selectedProfesseur) {
      showError(
        'Professeur non trouvé', 
        'Aucun professeur n\'est assigné à cette matière dans cette classe. ' +
        'Veuillez configurer l\'emploi du temps ou contacter l\'administrateur.'
      );
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
      
      // Gérer les notes existantes et nouvelles
      if (!selectedControle?.matiere_id || !selectedControle?.professeur_id) {
        showError('Erreur', 'Informations du contrôle manquantes');
        return;
      }

      const notePromises = formData.notes
        .filter(note => note.note > 0)
        .map(async note => {
          const noteData = {
            eleve_id: note.eleve_id,
            controle_id: formData.controle_id,
            note: note.note,
            // Le bareme est maintenant récupéré automatiquement depuis le niveau de l'élève côté backend
            // Ajouter les informations manquantes
            matiere_id: selectedControle.matiere_id,
            professeur_id: selectedControle.professeur_id,
            periode_id: selectedControle.periode_id,
            annee_scolaire_id: classe?.annee_scolaire_id
          };
          
          // Vérifier si une note existe déjà pour cet élève et ce contrôle
          const existingNote = existingNotes.find(existing => 
            existing.eleve_id === note.eleve_id && existing.controle_id === formData.controle_id
          );
          
          if (existingNote) {
            // Mettre à jour la note existante
            return notesService.updateNote(existingNote.id, noteData);
          } else {
            // Créer une nouvelle note
            return notesService.createNote(noteData);
          }
        });

      await Promise.all(notePromises);
      
      // Recharger les notes existantes pour refléter les changements
      await loadExistingNotes(formData.controle_id);
      
      showSuccess('Succès', 'Notes sauvegardées avec succès pour tous les élèves');
      // Reste sur la même page
      
    } catch (error: any) {
      showError('Erreur', error.response?.data?.message || 'Impossible d\'ajouter les notes');
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

  const selectedControle = controles.find(c => c.id === formData.controle_id);

  const handleExportNotes = async () => {
    try {
      if (!classeId) {
        showError('Erreur', 'ID de classe manquant');
        return;
      }

      // Vérifier s'il y a des notes à sauvegarder
      const hasNotes = formData.notes.some(note => note.note > 0);
      if (!hasNotes) {
        showError('Erreur', 'Veuillez saisir au moins une note avant d\'exporter');
        return;
      }

      // Sauvegarder d'abord les notes en cours
      setLoading(true);
      
      if (!selectedControle?.matiere_id || !selectedControle?.professeur_id) {
        showError('Erreur', 'Informations du contrôle manquantes');
        return;
      }

      // Sauvegarder les notes
      const notePromises = formData.notes
        .filter(note => note.note > 0)
        .map(async note => {
          const noteData = {
            eleve_id: note.eleve_id,
            controle_id: formData.controle_id,
            note: note.note,
            // Le bareme est maintenant récupéré automatiquement depuis le niveau de l'élève côté backend
            matiere_id: selectedControle.matiere_id,
            professeur_id: selectedControle.professeur_id,
            periode_id: selectedControle.periode_id,
            annee_scolaire_id: classe?.annee_scolaire_id
          };
          
          const existingNote = existingNotes.find(existing => 
            existing.eleve_id === note.eleve_id && existing.controle_id === formData.controle_id
          );
          
          if (existingNote) {
            return notesService.updateNote(existingNote.id, noteData);
          } else {
            return notesService.createNote(noteData);
          }
        });

      await Promise.all(notePromises);
      
      // Recharger les notes existantes après sauvegarde
      await loadExistingNotes(formData.controle_id);

      // Maintenant exporter les notes - filtrer par contrôle spécifique
      const response = await notesService.getNotes({
        controle_id: formData.controle_id,
        annee_scolaire_id: classe?.annee_scolaire_id,
        with: 'eleve,matiere,professeur,controle,periode'
      });

      if (response.success && response.data && response.data.length > 0) {
        // Créer le PDF
        generatePDF(response.data);
        
        showSuccess('Succès', `Notes sauvegardées et export PDF terminé: ${response.data.length} note(s) exportée(s)`);
      } else {
        showError('Information', 'Aucune note trouvée pour cette classe.');
      }
    } catch (error: any) {
      showError('Erreur', error.response?.data?.message || 'Impossible d\'exporter les notes');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = (notes: any[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // En-tête principal du document
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RELEVÉ DES NOTES DE CONTRÔLE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;


    // Informations détaillées
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    // Informations du contrôle sélectionné - Layout côte à côte
    if (selectedControle) {
      // Ligne du haut avec les en-têtes et infos de classe
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      const niveauInfo = classe?.niveau ? `Niveau: ${typeof classe.niveau === 'object' ? classe.niveau.nom : classe.niveau}` : '';
      const classInfo = `Classe: ${classe?.nom || 'N/A'}`;
      const dateInfo = `Date: ${new Date(selectedControle.debut_controle).toLocaleDateString('fr-FR')}`;
      
      // Ligne du haut: Niveau (gauche), Classe (centre), Date (droite)
      doc.text(niveauInfo, 20, yPosition);
      doc.text(classInfo, pageWidth / 2, yPosition, { align: 'center' });
      doc.text(dateInfo, pageWidth - 20, yPosition, { align: 'right' });
      
      // Ligne des en-têtes: DÉTAILS DU CONTRÔLE et STATISTIQUES DU CONTRÔLE
      doc.setFontSize(9);
      doc.text('DÉTAILS DU CONTRÔLE', 20, yPosition + 10);
      doc.text('STATISTIQUES DU CONTRÔLE', pageWidth - 20, yPosition + 10, { align: 'right' });
      yPosition += 18;
      
      // Colonne gauche - Détails du contrôle
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Contrôle: ${selectedControle.libelle}`, 25, yPosition);
      doc.text(`• Matière: ${selectedControle.matiere?.nom || 'N/A'}`, 25, yPosition + 5);
      doc.text(`• Professeur: ${selectedProfesseur ? `${selectedProfesseur.prenom} ${selectedProfesseur.nom}` : 'N/A'}`, 25, yPosition + 10);
      doc.text(`• Période: ${selectedControle.periode?.nom || 'N/A'}`, 25, yPosition + 15);
      doc.text(`• Date du contrôle: ${new Date(selectedControle.debut_controle).toLocaleDateString('fr-FR')}`, 25, yPosition + 20);
      
      // Colonne droite - Statistiques du contrôle (utiliser les notes uniques)
      // Grouper les notes par élève pour éviter les doublons
      const notesByEleve: { [key: number]: any } = {};
      notes.forEach((note: any) => {
        if (note.eleve && note.eleve.id) {
          notesByEleve[note.eleve.id] = note;
        }
      });
      const uniqueNotes = Object.values(notesByEleve) as any[];
      
      const totalStudents = uniqueNotes.length;
      const studentsWithNotes = uniqueNotes.filter((note: any) => parseFloat(note.note) > 0).length;
      const bareme = getBareme();
      
      // Calculer la moyenne correctement
      let average = 0;
      if (studentsWithNotes > 0) {
        const sum = uniqueNotes.filter((note: any) => parseFloat(note.note) > 0).reduce((sum: number, note: any) => sum + parseFloat(note.note), 0);
        average = sum / studentsWithNotes;
      }
      
      const validNotes = uniqueNotes.filter((note: any) => parseFloat(note.note) > 0).map((note: any) => parseFloat(note.note));
      const maxNote = validNotes.length > 0 ? Math.max(...validNotes) : 0;
      const minNote = validNotes.length > 0 ? Math.min(...validNotes) : 0;
      
      // Positionner les statistiques sous leur propre en-tête (droite)
      const statsStartX = pageWidth / 2 + 40; // Commencer plus à droite
      
      // Formater le bareme sans .00 inutiles
      const formattedBareme = formatBareme(bareme);
      
      doc.text(`• Nombre total d'élèves: ${totalStudents}`, statsStartX, yPosition);
      doc.text(`• Élèves ayant une note: ${studentsWithNotes}`, statsStartX, yPosition + 5);
      doc.text(`• Moyenne de la classe: ${formatBareme(average)}/${formattedBareme}`, statsStartX, yPosition + 10);
      doc.text(`• Note maximale: ${formatBareme(maxNote)}/${formattedBareme}`, statsStartX, yPosition + 15);
      doc.text(`• Note minimale: ${formatBareme(minNote)}/${formattedBareme}`, statsStartX, yPosition + 20);
      
      yPosition += 30;
    } else {
      // Fallback si pas de contrôle sélectionné
      const classInfo = `Classe: ${classe?.nom || 'N/A'}`;
      const niveauInfo = classe?.niveau ? `Niveau: ${typeof classe.niveau === 'object' ? classe.niveau.nom : classe.niveau}` : '';
      const dateInfo = `Date: ${new Date().toLocaleDateString('fr-FR')}`;
      
      doc.text(niveauInfo, 20, yPosition);
      doc.text(classInfo, 20, yPosition + 5);
      doc.text(dateInfo, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 15;
    }

    // Séparateur
    doc.setDrawColor(0, 0, 0);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // En-têtes du tableau centré (plus compact)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const tableHeaders = ['Matricule', 'CNE', 'Nom complet', 'Note'];
    const colWidths = [35, 35, 80, 30];
    const tableStartX = (pageWidth - colWidths.reduce((sum, width) => sum + width, 0)) / 2;
    let xPosition = tableStartX;

    // Dessiner les en-têtes avec style amélioré (plus petit)
    doc.setFillColor(240, 240, 240);
    doc.rect(xPosition, yPosition - 3, colWidths.reduce((sum, width) => sum + width, 0), 8, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(xPosition, yPosition - 3, colWidths.reduce((sum, width) => sum + width, 0), 8);
    
    tableHeaders.forEach((header, index) => {
      doc.rect(xPosition, yPosition - 3, colWidths[index], 8);
      doc.text(header, xPosition + colWidths[index]/2, yPosition + 1, { align: 'center' });
      xPosition += colWidths[index];
    });
    yPosition += 8;

    // Données des élèves (plus compact) - éviter les doublons
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Grouper les notes par élève pour éviter les doublons
    const notesByEleve: { [key: number]: any } = {};
    notes.forEach((note: any) => {
      if (note.eleve && note.eleve.id) {
        notesByEleve[note.eleve.id] = note;
      }
    });
    
    const uniqueNotes = Object.values(notesByEleve) as any[];
    
    uniqueNotes.forEach((note: any, index: number) => {
      // Vérifier si on a besoin d'une nouvelle page
      if (yPosition > pageHeight - 15) {
        doc.addPage();
        yPosition = 20;
      }

      xPosition = tableStartX;
      
      // Construire le nom complet
      let nomComplet = 'N/A';
      if (note.eleve) {
        if (note.eleve.nom_complet) {
          nomComplet = note.eleve.nom_complet;
        } else if (note.eleve.nom_fr && note.eleve.prenom_fr) {
          nomComplet = `${note.eleve.prenom_fr} ${note.eleve.nom_fr}`;
        } else if (note.eleve.nom && note.eleve.prenom) {
          nomComplet = `${note.eleve.prenom} ${note.eleve.nom}`;
        }
      }
      
      // Formater la note de manière plus claire
      const noteValue = parseFloat(note.note) || 0;
      const baremeValue = getBareme();
      const formattedNote = formatBareme(noteValue);
      const formattedBareme = formatBareme(baremeValue);
      
      const rowData = [
        note.eleve?.matricule || 'N/A',
        note.eleve?.cne || 'N/A',
        nomComplet,
        `${formattedNote}/${formattedBareme}`
      ];

      // Alterner les couleurs de fond pour les lignes (plus petit)
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(xPosition, yPosition - 3, colWidths.reduce((sum, width) => sum + width, 0), 6, 'F');
      }

      rowData.forEach((data, colIndex) => {
        doc.setDrawColor(0, 0, 0);
        doc.rect(xPosition, yPosition - 3, colWidths[colIndex], 6);
        doc.text(data, xPosition + colWidths[colIndex]/2, yPosition + 1, { align: 'center' });
        xPosition += colWidths[colIndex];
      });

      yPosition += 6;
    });


    // Télécharger le PDF
    const filename = `notes_${classe?.nom}_${selectedControle?.libelle || 'controle'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };


  return (
    <div className="space-y-6">
      <PageHead
        title={`Gestion des Notes - ${classe?.nom || 'Classe'}`}
        subtitle="Sélectionnez un contrôle et saisissez les notes pour tous les élèves de la classe"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Notes', link: '/notes' },
          { label: `Gestion - ${classe?.nom || 'Classe'}`, link: '#' }
        ]}
      />

      {/* Class Info */}
      <Card>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {classe?.nom}
              </h3>
              {classe?.niveau && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Niveau: {typeof classe.niveau === 'object' ? classe.niveau.nom : classe.niveau}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {eleves.length} élève{eleves.length > 1 ? 's' : ''} dans cette classe
              </p>
            </div>
            <Button
              onClick={() => {
                // Reste sur la même page, recharge les données
                loadInitialData();
              }}
              variant="outline"
            >
              <Icon name="arrow-left" size="sm" className="mr-2" />
              Retour aux notes
            </Button>
          </div>
        </div>
      </Card>

      {/* Control Selection */}
      <Card>
        <div className="p-5 sm:p-6">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sélectionner un contrôle
            </h3>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Matière <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedMatiere || ''}
                  onChange={(e) => setSelectedMatiere(parseInt(e.target.value) || null)}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={matieres.length === 0}
                >
                  <option value="">
                    {matieres.length === 0 
                      ? `Aucune matière disponible pour le niveau ${typeof classe?.niveau === 'object' && classe?.niveau ? (classe.niveau as any).nom : classe?.niveau || ''}`
                      : 'Sélectionner une matière'
                    }
                  </option>
                  {matieres.map(matiere => (
                    <option key={matiere.id} value={matiere.id}>
                      {matiere.nom} ({matiere.code})
                    </option>
                  ))}
                </select>
                {matieres.length === 0 && (
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                    Aucune matière n'est configurée pour le niveau "{typeof classe?.niveau === 'object' && classe?.niveau ? (classe.niveau as any).nom : String(classe?.niveau || '')}". 
                    Veuillez d'abord configurer les matières pour ce niveau.
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contrôle <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.controle_id}
                  onChange={(e) => {
                    const controleId = parseInt(e.target.value);
                    setFormData(prev => ({ ...prev, controle_id: controleId }));
                    if (controleId > 0) {
                      loadExistingNotes(controleId);
                    }
                  }}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={controles.length === 0}
                >
                  <option value="">
                    {controles.length === 0 
                      ? 'Aucun contrôle disponible'
                      : 'Sélectionner un contrôle'
                    }
                  </option>
                  {controles.map(controle => (
                    <option key={controle.id} value={controle.id}>
                      {controle.libelle} - {new Date(controle.debut_controle).toLocaleDateString('fr-FR')} ({controle.periode?.nom || 'Période non définie'})
                    </option>
                  ))}
                </select>
                {controles.length === 0 && selectedMatiere && (
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                    Aucun contrôle n'a été créé pour cette matière dans cette classe.
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Professeur responsable
                </label>
                <div className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg dark:text-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                  {false ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 border-b-2 rounded-full animate-spin border-primary-600 dark:border-primary-500"></div>
                      <span className="text-gray-500 dark:text-gray-400">Chargement du professeur...</span>
                    </div>
                  ) : selectedProfesseur ? (
                    <div className="flex items-center">
                      <Icon name="user" className="mr-2 text-primary-600 dark:text-primary-400" size="sm" />
                      <span className="font-medium">{selectedProfesseur.prenom} {selectedProfesseur.nom}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">
                      {selectedMatiere ? 'Aucun professeur assigné' : 'Sélectionnez une matière'}
                    </span>
                  )}
                </div>
              </div>

              
            </div>

            {selectedMatiere && controles.length === 0 && (
              <div className="py-8 text-center">
                <Icon name="alert" className="mx-auto mb-4 text-amber-500 dark:text-amber-400" size="lg" />
                <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  Aucun contrôle trouvé
                </h4>
                <p className="mb-4 text-gray-500 dark:text-gray-400">
                  Aucun contrôle n'a été créé pour cette matière dans cette classe.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Veuillez d'abord créer des contrôles pour cette matière avant de pouvoir saisir des notes.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Notes Form */}
      {formData.controle_id > 0 && controles.length > 0 && (
        <Card>
          <div className="p-5 sm:p-6">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {existingNotes.length > 0 && formData.controle_id > 0 ? 'Modification des notes' : 'Saisie des notes'}
                  </h3>
                  
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="file-text" className="text-primary-600 dark:text-primary-400" size="sm" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedControle?.libelle}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {selectedMatiere && (
                        <span className="flex items-center gap-1">
                          <Icon name="book" size="sm" className="dark:text-gray-400" />
                          {matieres.find(m => m.id === selectedMatiere)?.nom}
                        </span>
                      )}
                      {selectedProfesseur && (
                        <span className="flex items-center gap-1">
                              <Icon name="user" size="sm" className="dark:text-gray-400" />
                          {selectedProfesseur.prenom} {selectedProfesseur.nom}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Icon name="calendar" size="sm" className="dark:text-gray-400" />
                        {selectedControle && new Date(selectedControle.debut_controle).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                   
                  </div>
                </div>
              </div>

              {/* Bareme Info and Export Button */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Barème du niveau
                  </label>
                  <div className="w-full px-3 py-2 text-gray-700 border border-gray-300 rounded-lg dark:text-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                    <span className="font-medium">{formatBareme(getBareme())} / {formatBareme(getBareme())}</span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      (défini au niveau)
                    </span>
                  </div>
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportNotes}
                    loading={loading}
                    icon={<Icon name="file-pdf" size="sm" />}
                    className="flex items-center gap-2 text-red-600 border-red-300 dark:text-red-400 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-400 dark:hover:border-red-600"
                  >
                    Sauvegarder et Exporter
                  </Button>
                </div>
              </div>

              {/* Students Notes Table */}
              <div className="overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                  <h5 className="font-medium text-gray-900 dark:text-white">
                    Notes des élèves
                  </h5>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                          Élève
                        </th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-400">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                      {eleves.map((eleve) => {
                        const noteData = formData.notes.find(n => n.eleve_id === eleve.id);
                        const note = noteData?.note || 0;
                        const existingNote = existingNotes.find(existing => 
                          existing.eleve_id === eleve.id && existing.controle_id === formData.controle_id
                        );
                        
                        return (
                          <tr key={eleve.id} className={existingNote ? 'bg-blue-50 dark:bg-blue-900/30' : ''}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {eleve.nom_complet}
                                </div>
                                {existingNote && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                                    <Icon name="check" size="sm" className="mr-1" />
                                    La note existante peut être modifiée si nécessaire.
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={getBareme()}
                                  step="0.01"
                                  value={note}
                                  onChange={(e) => handleNoteChange(eleve.id, parseFloat(e.target.value) || 0)}
                                  className={`w-20 px-2 py-1 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                                    existingNote 
                                      ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30' 
                                      : 'border-gray-300 dark:border-gray-600'
                                  }`}
                                  placeholder="0"
                                />
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                  / {formatBareme(getBareme())}
                                </span>
                            
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end pt-4 space-x-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Reste sur la même page, réinitialise le formulaire
                    setFormData({
                      controle_id: 0,
                      notes: []
                    });
                    setExistingNotes([]);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  icon={<Icon name="check" size="sm" />}
                >
                  {existingNotes.length > 0 && formData.controle_id > 0 ? 'Modifier les notes' : 'Enregistrer les notes'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
};

export default NotesClasseManage;
