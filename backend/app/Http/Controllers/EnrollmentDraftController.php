<?php

namespace App\Http\Controllers;

use App\Models\Eleve;
use App\Models\ParentEleve;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class EnrollmentDraftController extends Controller
{
    /**
     * Sauvegarder un brouillon d'inscription (temporaire)
     */
    public function saveDraft(Request $request): JsonResponse
    {
        try {
            $draftId = $request->get('draft_id', Str::uuid()->toString());
            $step = $request->get('step', 1);
            $data = $request->get('data', []);
            
            // Sauvegarder en cache pour 1 heure
            Cache::put("enrollment_draft_{$draftId}", [
                'step' => $step,
                'data' => $data,
                'updated_at' => now()
            ], 3600);
            
            return response()->json([
                'success' => true,
                'draft_id' => $draftId,
                'message' => 'Brouillon sauvegardé'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la sauvegarde du brouillon',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Récupérer un brouillon d'inscription
     */
    public function getDraft(Request $request, string $draftId): JsonResponse
    {
        try {
            $draft = Cache::get("enrollment_draft_{$draftId}");
            
            if (!$draft) {
                return response()->json([
                    'success' => false,
                    'message' => 'Brouillon non trouvé ou expiré'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $draft
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du brouillon',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Valider les parents temporairement (sans les créer)
     */
    public function validateParents(Request $request): JsonResponse
    {
        try {
            $parents = $request->get('parents', []);
            $validatedParents = [];
            $errors = [];
            
            foreach ($parents as $type => $parentData) {
                if (empty($parentData)) continue;
                
                // Si c'est un ID existant
                if (isset($parentData['id']) && is_numeric($parentData['id'])) {
                    $parent = ParentEleve::find($parentData['id']);
                    if ($parent) {
                        $validatedParents[$type] = [
                            'id' => $parent->id,
                            'nom' => $parent->nom,
                            'prenom' => $parent->prenom,
                            'telephone' => $parent->telephone,
                            'existing' => true
                        ];
                    } else {
                        $errors[$type] = 'Parent non trouvé';
                    }
                } else {
                    // Nouveau parent - valider les données
                    $validation = $this->validateNewParent($parentData);
                    if ($validation['valid']) {
                        $validatedParents[$type] = array_merge($parentData, ['existing' => false]);
                    } else {
                        $errors[$type] = $validation['errors'];
                    }
                }
            }
            
            return response()->json([
                'success' => empty($errors),
                'parents' => $validatedParents,
                'errors' => $errors
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation des parents',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Finaliser l'inscription complète (tout en une transaction)
     */
    public function finalizeEnrollment(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            
            $draftId = $request->get('draft_id');
            $draft = Cache::get("enrollment_draft_{$draftId}");
            
            if (!$draft) {
                throw new \Exception('Brouillon d\'inscription non trouvé');
            }
            
            $data = $draft['data'];
            
            // 1. Créer l'élève
            $eleve = Eleve::create($this->prepareEleveData($data['student']));
            
            // 2. Créer/Associer les parents
            if (isset($data['parents'])) {
                $this->handleParents($eleve, $data['parents']);
            }
            
            // 3. Associer classe, cantine, transport
            if (isset($data['assignments'])) {
                $this->handleAssignments($eleve, $data['assignments']);
            }
            
            // 4. Supprimer le brouillon
            Cache::forget("enrollment_draft_{$draftId}");
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Inscription finalisée avec succès',
                'eleve' => $eleve->load(['parents', 'classe'])
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la finalisation de l\'inscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Préparer les données de l'élève
     */
    private function prepareEleveData(array $studentData): array
    {
        // Logique de préparation des données (comme dans EleveController)
        return array_merge($studentData, [
            'active' => true,
            'date_inscription' => now()->toDateString()
        ]);
    }
    
    /**
     * Gérer les parents (créer nouveaux + associer)
     */
    private function handleParents(Eleve $eleve, array $parentsData): void
    {
        foreach ($parentsData as $type => $parentData) {
            if (empty($parentData)) continue;
            
            if ($parentData['existing']) {
                // Parent existant
                $parentId = $parentData['id'];
            } else {
                // Créer nouveau parent
                $parent = ParentEleve::create($parentData);
                $parentId = $parent->id;
            }
            
            // Associer à l'élève
            $eleve->parents()->attach($parentId, [
                'relation' => $type,
                'contact_principal' => $type === 'pere'
            ]);
        }
    }
    
    /**
     * Gérer les affectations (classe, cantine, transport)
     */
    private function handleAssignments(Eleve $eleve, array $assignments): void
    {
        if (isset($assignments['classe_id'])) {
            $eleve->update(['classe_id' => $assignments['classe_id']]);
        }
        
        if (isset($assignments['cantine_id'])) {
            $eleve->cantines()->attach($assignments['cantine_id'], [
                'date_inscription' => now()
            ]);
        }
        
        if (isset($assignments['transport_id'])) {
            $eleve->transports()->attach($assignments['transport_id'], [
                'date_inscription' => now()
            ]);
        }
    }
    
    /**
     * Valider un nouveau parent
     */
    private function validateNewParent(array $parentData): array
    {
        $errors = [];
        
        if (empty($parentData['nom'])) {
            $errors[] = 'Le nom est obligatoire';
        }
        
        if (empty($parentData['prenom'])) {
            $errors[] = 'Le prénom est obligatoire';
        }
        
        if (empty($parentData['telephone'])) {
            $errors[] = 'Le téléphone est obligatoire';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
}
