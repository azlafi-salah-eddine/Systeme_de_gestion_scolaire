<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidPhoto implements ValidationRule
{
    private int $maxSizeBytes;
    private array $allowedFormats;

    public function __construct(int $maxSizeBytes = 1048576, array $allowedFormats = ['image/jpeg', 'image/png'])
    {
        $this->maxSizeBytes = $maxSizeBytes;
        $this->allowedFormats = $allowedFormats;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return; // Allow empty values (nullable)
        }

        // Check if it's a valid base64 data URL
        if (!$this->isValidDataUrl($value)) {
            $fail('La photo doit être un fichier image valide.');
            return;
        }

        // Extract the data part and mime type
        $dataUrlParts = explode(',', $value, 2);
        if (count($dataUrlParts) !== 2) {
            $fail('Format de photo invalide.');
            return;
        }

        $header = $dataUrlParts[0];
        $data = $dataUrlParts[1];

        // Extract mime type from header (e.g., "data:image/jpeg;base64")
        if (!preg_match('/data:([^;]+);/', $header, $matches)) {
            $fail('Type de fichier non reconnu.');
            return;
        }

        $mimeType = $matches[1];

        // Check if mime type is allowed
        if (!in_array($mimeType, $this->allowedFormats)) {
            $allowedNames = array_map(function($format) {
                return strtoupper(str_replace('image/', '', $format));
            }, $this->allowedFormats);
            $fail('Format de photo non autorisé. Formats acceptés: ' . implode(', ', $allowedNames) . '.');
            return;
        }

        // Check file size (base64 decoded size)
        $decodedData = base64_decode($data, true);
        if ($decodedData === false) {
            $fail('Données de photo corrompues.');
            return;
        }

        $fileSize = strlen($decodedData);
        if ($fileSize > $this->maxSizeBytes) {
            $maxSizeMB = round($this->maxSizeBytes / (1024 * 1024), 1);
            $fail("La photo est trop volumineuse. Taille maximale: {$maxSizeMB}MB.");
            return;
        }

        // Additional validation: try to create image resource to ensure it's a valid image
        $imageResource = imagecreatefromstring($decodedData);
        if ($imageResource === false) {
            $fail('Le fichier n\'est pas une image valide.');
            return;
        }
        
        // Clean up the resource
        imagedestroy($imageResource);
    }

    /**
     * Check if the value is a valid data URL
     */
    private function isValidDataUrl(string $value): bool
    {
        return preg_match('/^data:image\/[a-z]+;base64,/', $value) === 1;
    }
}
