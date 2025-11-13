<?php

namespace App\Services;

use App\Models\Eleve;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StudentPhotoService
{
    private const PHOTOS_BASE_PATH = 'eleves';
    private const PROFILE_PHOTO_NAME = 'profile';
    private const MAX_WIDTH = 400;
    private const MAX_HEIGHT = 400;
    private const QUALITY = 85;

    /**
     * Generate folder name for student
     */
    public static function generateFolderName(string $nom, string $prenom, ?string $cne = null): string
    {
        // Nettoyer et formater les noms
        $nomClean = self::cleanString($nom);
        $prenomClean = self::cleanString($prenom);
        $cneClean = $cne ? self::cleanString($cne) : null;

        // Format: Prenom_Nom_CNE ou Prenom_Nom si pas de CNE
        $folderName = $prenomClean . '_' . $nomClean;
        if ($cneClean) {
            $folderName .= '_' . $cneClean;
        }

        return $folderName;
    }

    /**
     * Get the full path for student's folder
     */
    public static function getStudentFolderPath(Eleve $eleve): string
    {
        $folderName = self::generateFolderName(
            $eleve->nom_fr ?: $eleve->nom,
            $eleve->prenom_fr ?: $eleve->prenom,
            $eleve->cne
        );

        return self::PHOTOS_BASE_PATH . '/' . $folderName;
    }

    /**
     * Get the full path for student's profile photo
     */
    public static function getProfilePhotoPath(Eleve $eleve, string $extension = 'jpg'): string
    {
        $folderPath = self::getStudentFolderPath($eleve);
        return $folderPath . '/' . self::PROFILE_PHOTO_NAME . '.' . $extension;
    }

    /**
     * Save profile photo from base64 data
     */
    public function saveProfilePhotoFromBase64(Eleve $eleve, string $base64Data): string
    {
        try {
            // Extraire les données de l'image base64
            $imageData = $this->parseBase64Image($base64Data);
            
            // Créer le dossier de l'élève
            $folderPath = self::getStudentFolderPath($eleve);
            Storage::disk('public')->makeDirectory($folderPath);

            // Déterminer l'extension et le chemin final
            $extension = $imageData['extension'];
            $filePath = $folderPath . '/' . self::PROFILE_PHOTO_NAME . '.' . $extension;

            // Sauvegarder l'image directement (sans redimensionnement pour l'instant)
            $fullPath = Storage::disk('public')->path($filePath);
            file_put_contents($fullPath, $imageData['data']);

            // Nettoyer les anciennes photos si elles existent
            $this->cleanOldPhotos($eleve, $extension);

            return $filePath;

        } catch (\Exception $e) {
            throw new \Exception("Erreur lors de la sauvegarde de la photo: " . $e->getMessage());
        }
    }

    /**
     * Save profile photo from uploaded file
     */
    public function saveProfilePhotoFromFile(Eleve $eleve, $uploadedFile): string
    {
        try {
            // Valider le fichier
            if (!$uploadedFile->isValid()) {
                throw new \Exception("Fichier invalide");
            }

            // Créer le dossier de l'élève
            $folderPath = self::getStudentFolderPath($eleve);
            Storage::disk('public')->makeDirectory($folderPath);

            // Déterminer l'extension
            $extension = strtolower($uploadedFile->getClientOriginalExtension());
            if (!in_array($extension, ['jpg', 'jpeg', 'png'])) {
                $extension = 'jpg';
            }

            $filePath = $folderPath . '/' . self::PROFILE_PHOTO_NAME . '.' . $extension;

            // Sauvegarder le fichier directement
            $uploadedFile->storeAs($folderPath, self::PROFILE_PHOTO_NAME . '.' . $extension, 'public');

            // Nettoyer les anciennes photos
            $this->cleanOldPhotos($eleve, $extension);

            return $filePath;

        } catch (\Exception $e) {
            throw new \Exception("Erreur lors de la sauvegarde de la photo: " . $e->getMessage());
        }
    }

    /**
     * Delete student's profile photo
     */
    public function deleteProfilePhoto(Eleve $eleve): bool
    {
        try {
            $folderPath = self::getStudentFolderPath($eleve);
            
            // Supprimer tous les fichiers de profil possibles
            $extensions = ['jpg', 'jpeg', 'png'];
            $deleted = false;

            foreach ($extensions as $ext) {
                $filePath = $folderPath . '/' . self::PROFILE_PHOTO_NAME . '.' . $ext;
                if (Storage::disk('public')->exists($filePath)) {
                    Storage::disk('public')->delete($filePath);
                    $deleted = true;
                }
            }

            return $deleted;

        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get profile photo URL
     */
    public function getProfilePhotoUrl(Eleve $eleve): ?string
    {
        $folderPath = self::getStudentFolderPath($eleve);
        $extensions = ['jpg', 'jpeg', 'png'];

        foreach ($extensions as $ext) {
            $filePath = $folderPath . '/' . self::PROFILE_PHOTO_NAME . '.' . $ext;
            if (Storage::disk('public')->exists($filePath)) {
                return asset('storage/' . $filePath);
            }
        }

        return null;
    }

    /**
     * Check if student has a profile photo
     */
    public function hasProfilePhoto(Eleve $eleve): bool
    {
        return $this->getProfilePhotoUrl($eleve) !== null;
    }

    /**
     * Rename student folder when student info changes
     */
    public function renameStudentFolder(Eleve $eleve, string $oldNom, string $oldPrenom, ?string $oldCne = null): bool
    {
        try {
            $oldFolderName = self::generateFolderName($oldNom, $oldPrenom, $oldCne);
            $newFolderName = self::generateFolderName(
                $eleve->nom_fr ?: $eleve->nom,
                $eleve->prenom_fr ?: $eleve->prenom,
                $eleve->cne
            );

            if ($oldFolderName === $newFolderName) {
                return true; // Pas de changement nécessaire
            }

            $oldPath = self::PHOTOS_BASE_PATH . '/' . $oldFolderName;
            $newPath = self::PHOTOS_BASE_PATH . '/' . $newFolderName;

            if (Storage::disk('public')->exists($oldPath)) {
                return Storage::disk('public')->move($oldPath, $newPath);
            }

            return true;

        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Clean old photos with different extensions
     */
    private function cleanOldPhotos(Eleve $eleve, string $currentExtension): void
    {
        $folderPath = self::getStudentFolderPath($eleve);
        $extensions = ['jpg', 'jpeg', 'png'];

        foreach ($extensions as $ext) {
            if ($ext !== $currentExtension) {
                $filePath = $folderPath . '/' . self::PROFILE_PHOTO_NAME . '.' . $ext;
                if (Storage::disk('public')->exists($filePath)) {
                    Storage::disk('public')->delete($filePath);
                }
            }
        }
    }

    /**
     * Parse base64 image data
     */
    private function parseBase64Image(string $base64Data): array
    {
        // Vérifier le format data URL
        if (!preg_match('/^data:image\/([a-z]+);base64,(.+)$/i', $base64Data, $matches)) {
            throw new \Exception("Format de données base64 invalide");
        }

        $mimeType = strtolower($matches[1]);
        $imageData = base64_decode($matches[2]);

        if ($imageData === false) {
            throw new \Exception("Impossible de décoder les données base64");
        }

        // Mapper les types MIME aux extensions
        $extensionMap = [
            'jpeg' => 'jpg',
            'jpg' => 'jpg',
            'png' => 'png',
        ];

        $extension = $extensionMap[$mimeType] ?? 'jpg';

        return [
            'data' => $imageData,
            'extension' => $extension,
            'mime_type' => 'image/' . $mimeType
        ];
    }

    /**
     * Clean string for folder names
     */
    private static function cleanString(string $str): string
    {
        // Supprimer les accents
        $str = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $str);
        
        // Garder seulement les lettres, chiffres et quelques caractères spéciaux
        $str = preg_replace('/[^a-zA-Z0-9\-_]/', '', $str);
        
        // Limiter la longueur
        return Str::limit($str, 20, '');
    }
}
