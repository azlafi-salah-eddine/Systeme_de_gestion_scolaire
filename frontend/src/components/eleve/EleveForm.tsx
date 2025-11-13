import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Icon from '../Icon';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StudentPhoto from '../ui/StudentPhoto';
import type { Eleve, Classe } from '../../types/eleve';

interface EleveFormProps {
  eleve?: Eleve;
  classes: Classe[];
  onSubmit: (data: EleveFormData) => void;
  loading?: boolean;
  onCancel?: () => void;
}

export interface EleveFormData {
  nom: string;
  prenom: string;
  date_naissance: string;
  matricule?: string;
  cne?: string;
  photo?: string;
  adresse?: string;
  infos_sante?: string;
  groupe_sanguin?: string;
  allergies?: string;
  classe_id?: number;
  date_inscription: string;
  active: boolean;
}

const EleveForm: React.FC<EleveFormProps> = ({ 
  eleve, 
  classes, 
  onSubmit, 
  loading = false,
  onCancel 
}) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<EleveFormData>({
    defaultValues: {
      nom: '',
      prenom: '',
      date_naissance: '',
      matricule: '',
      cne: '',
      photo: '',
      adresse: '',
      infos_sante: '',
      groupe_sanguin: '',
      allergies: '',
      classe_id: undefined,
      date_inscription: new Date().toISOString().split('T')[0],
      active: true
    }
  });

  const watchedPhoto = watch('photo');

  useEffect(() => {
    if (eleve) {
      reset({
        nom: eleve.nom,
        prenom: eleve.prenom,
        date_naissance: eleve.date_naissance ? eleve.date_naissance.split('T')[0] : '',
        matricule: eleve.matricule || '',
        cne: eleve.cne || '',
        photo: eleve.photo || '',
        adresse: eleve.adresse || '',
        infos_sante: eleve.infos_sante || '',
        groupe_sanguin: eleve.groupe_sanguin || '',
        allergies: eleve.allergies || '',
        classe_id: eleve.classe_id || undefined,
        date_inscription: eleve.date_inscription ? eleve.date_inscription.split('T')[0] : '',
        active: eleve.active
      });
      setPhotoPreview(eleve.photo || null);
    }
  }, [eleve, reset]);

  useEffect(() => {
    if (watchedPhoto && watchedPhoto.startsWith('data:')) {
      setPhotoPreview(watchedPhoto);
    }
  }, [watchedPhoto]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setValue('photo', result);
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmitForm = (data: EleveFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* Informations personnelles */}
      <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Icon name="user" className="mr-2" />
          Informations personnelles
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prénom *
            </label>
            <input
              type="text"
              {...register('prenom', { required: 'Le prénom est requis' })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                errors.prenom ? 'border-red-500 dark:border-red-600' : ''
              }`}
              placeholder="Prénom de l'élève"
            />
            {errors.prenom && (
              <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom *
            </label>
            <input
              type="text"
              {...register('nom', { required: 'Le nom est requis' })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                errors.nom ? 'border-red-500 dark:border-red-600' : ''
              }`}
              placeholder="Nom de l'élève"
            />
            {errors.nom && (
              <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de naissance *
            </label>
            <input
              type="date"
              {...register('date_naissance', { required: 'La date de naissance est requise' })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                errors.date_naissance ? 'border-red-500 dark:border-red-600' : ''
              }`}
            />
            {errors.date_naissance && (
              <p className="mt-1 text-sm text-red-600">{errors.date_naissance.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date d'inscription *
            </label>
            <input
              type="date"
              {...register('date_inscription', { required: 'La date d\'inscription est requise' })}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent ${
                errors.date_inscription ? 'border-red-500 dark:border-red-600' : ''
              }`}
            />
            {errors.date_inscription && (
              <p className="mt-1 text-sm text-red-600">{errors.date_inscription.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Matricule
            </label>
            <input
              type="text"
              {...register('matricule')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
              placeholder="Matricule de l'élève"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CNE
            </label>
            <input
              type="text"
              {...register('cne')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
              placeholder="CNE de l'élève"
            />
          </div>
        </div>
      </Card>

      {/* Photo */}
      <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Icon name="camera" className="mr-2" />
          Photo
        </h3>
        
        <div className="flex items-center space-x-6">
          <StudentPhoto
            src={photoPreview || eleve?.photo}
            alt="Photo de l'élève"
            size="lg"
            studentName={`${watch('nom')} ${watch('prenom')}`}
            cne={watch('cne')}
            showDebugInfo={process.env.NODE_ENV === 'development'}
            className="rounded-lg"
          />
          
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="mt-1 text-sm text-gray-500">
              Formats acceptés: JPG, PNG, GIF (max 2MB)
            </p>
            <p className="mt-1 text-xs text-blue-600">
              💡 Conseil: La photo sera sauvegardée avec le format nom.prenom.cne.jpeg pour faciliter la recherche
            </p>
          </div>
        </div>
      </Card>

      {/* Informations scolaires */}
      <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Icon name="graduation-cap" className="mr-2" />
          Informations scolaires
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Classe
            </label>
            <select
              {...register('classe_id')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('active')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Élève actif
            </label>
          </div>
        </div>
      </Card>

      {/* Informations de contact */}
      <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Icon name="map-pin" className="mr-2" />
          Informations de contact
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresse
          </label>
          <textarea
            {...register('adresse')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
            placeholder="Adresse complète de l'élève"
          />
        </div>
      </Card>

      {/* Informations médicales */}
      <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Icon name="heart" className="mr-2" />
          Informations médicales
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Groupe sanguin
            </label>
            <select
              {...register('groupe_sanguin')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Sélectionner un groupe</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Allergies
            </label>
            <input
              type="text"
              {...register('allergies')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
              placeholder="Allergies connues"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Informations de santé
          </label>
          <textarea
            {...register('infos_sante')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-500 focus:border-transparent"
            placeholder="Informations médicales importantes"
          />
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Annuler
          </Button>
        )}
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
        >
          {eleve ? 'Mettre à jour' : 'Créer l\'élève'}
        </Button>
      </div>
    </form>
  );
};

export default EleveForm;
