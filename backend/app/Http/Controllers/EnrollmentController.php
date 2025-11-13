<?php

namespace App\Http\Controllers;

use App\Http\Requests\Enrollment\StoreEnrollmentRequest;
use App\Http\Resources\EleveResource;
use App\Models\Eleve;
use App\Models\ParentEleve;
use App\Models\Classe;
use App\Models\Cantine;
use App\Models\Transport;
use App\Rules\ValidPhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\FileNamingService;

class EnrollmentController extends Controller
{
    /**
     * Complete enrollment process
     */
    public function store(StoreEnrollmentRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            
            $validated = $request->validated();

            // Traiter l'upload de la photo si présent
            if ($request->hasFile('photo')) {
                $uploadedPath = $request->file('photo')->store('eleves', 'public');
                $validated['photo'] = $uploadedPath;
            } elseif (isset($validated['photo']) && is_string($validated['photo']) && Str::startsWith($validated['photo'], 'data:image')) {
                [$meta, $content] = explode(',', $validated['photo'], 2);
                if (preg_match('/data:image\/(\w+);base64/', $meta, $matches)) {
                    $extension = strtolower($matches[1]);
                } else {
                    $extension = 'png';
                }
                $binary = base64_decode($content, true);
                if ($binary !== false) {
                    $filename = FileNamingService::generateStudentPhotoFilename(
                        $validated['nom_fr'],
                        $validated['prenom_fr'],
                        $validated['cne'] ?? '',
                        $extension
                    );
                    // Générer un nom unique si le fichier existe déjà
                    $filename = FileNamingService::generateUniqueFilename($filename);
                    Storage::disk('public')->put($filename, $binary);
                    $validated['photo'] = $filename;
                } else {
                    unset($validated['photo']);
                }
            }
            
            // Create student
            $eleve = Eleve::create([
                'nom_fr' => $validated['nom_fr'],
                'prenom_fr' => $validated['prenom_fr'],
                'nom_ar' => $validated['nom_ar'] ?? null,
                'prenom_ar' => $validated['prenom_ar'] ?? null,
                'date_naissance' => $validated['date_naissance'],
                'lieu_naissance_fr' => $validated['lieu_naissance_fr'] ?? null,
                'lieu_naissance_ar' => $validated['lieu_naissance_ar'] ?? null,
                'sexe' => $validated['sexe'],
                'cne' => $validated['cne'] ?? null,
                'cin' => $validated['cin'] ?? null,
                'photo' => $validated['photo'] ?? null,
                'adresse' => $validated['adresse'] ?? null,
                'nationalite' => $validated['nationalite'] ?? 'Marocaine',
                'active' => true,
            ]);
            
            // Assign to class
            if (isset($validated['classe_id'])) {
                $classe = Classe::findOrFail($validated['classe_id']);
                
                // Check if class is full
                if ($classe->est_complete) {
                    throw ValidationException::withMessages([
                        'classe_id' => ['La classe est complète. Impossible d\'inscrire plus d\'élèves.'],
                    ]);
                }
                
                $eleve->update(['classe_id' => $classe->id]);
            }
            
            // Assign parents
            if (isset($validated['pere_id'])) {
                $this->assignParent($eleve, $validated['pere_id'], 'pere');
            }
            
            if (isset($validated['mere_id'])) {
                $this->assignParent($eleve, $validated['mere_id'], 'mere');
            }
            
            if (isset($validated['tuteur_id'])) {
                $this->assignParent($eleve, $validated['tuteur_id'], 'tuteur');
            }
            
            // Assign to cantine
            if (isset($validated['cantine_id'])) {
                $cantine = Cantine::findOrFail($validated['cantine_id']);
                $cantine->eleves()->attach($eleve->id, [
                    'date_inscription' => now(),
                ]);
            }
            
            // Assign to transport
            if (isset($validated['transport_id'])) {
                $transport = Transport::findOrFail($validated['transport_id']);
                $transport->eleves()->attach($eleve->id, [
                    'date_inscription' => now(),
                ]);
            }
            
            // Store medical information
            if (isset($validated['medical'])) {
                $this->storeMedicalInfo($eleve, $validated['medical']);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Inscription réussie',
                'eleve' => new EleveResource($eleve->load(['classe', 'parents']))
            ], 201);
            
        } catch (ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get enrollment statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_eleves' => Eleve::count(),
            'eleves_actifs' => Eleve::where('active', true)->count(),
            'eleves_par_classe' => Classe::withCount('eleves')->get()->map(function ($classe) {
                return [
                    'classe' => $classe->nom_complet,
                    'count' => $classe->eleves_count
                ];
            }),
            'inscriptions_ce_mois' => Eleve::whereMonth('created_at', now()->month)->count(),
            'cantines_utilisees' => Cantine::withCount('eleves')->get()->map(function ($cantine) {
                return [
                    'cantine' => $cantine->nom,
                    'count' => $cantine->eleves_count
                ];
            }),
            'transports_utilises' => Transport::withCount('eleves')->get()->map(function ($transport) {
                return [
                    'transport' => $transport->nom,
                    'count' => $transport->eleves_count
                ];
            }),
        ];
        
        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
    
    /**
     * Get enrollment options (classes, cantines, transports, parents)
     */
    public function options(): JsonResponse
    {
        $options = [
            'classes' => Classe::where('active', true)
                ->with(['niveau', 'annee_scolaire'])
                ->get()
                ->map(function ($classe) {
                    return [
                        'id' => $classe->id,
                        'nom' => $classe->nom_complet,
                        'niveau' => $classe->niveau?->nom,
                        'annee_scolaire' => $classe->annee_scolaire?->nom,
                        'places_disponibles' => $classe->effectif_max - $classe->eleves()->count(),
                    ];
                }),
            'cantines' => Cantine::where('active', true)->get(['id', 'nom', 'prix']),
            'transports' => Transport::where('active', true)->get(['id', 'nom', 'prix']),
            'parents' => ParentEleve::orderBy('nom')->get(['id', 'nom', 'prenom', 'type', 'telephone', 'email']),
        ];
        
        return response()->json([
            'success' => true,
            'data' => $options
        ]);
    }
    
    /**
     * Search parents for enrollment
     */
    public function searchParents(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        
        if (strlen($query) < 2) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }
        
        $parents = ParentEleve::where(function ($q) use ($query) {
            $q->where('nom', 'like', "%{$query}%")
              ->orWhere('prenom', 'like', "%{$query}%")
              ->orWhere('telephone', 'like', "%{$query}%")
              ->orWhere('email', 'like', "%{$query}%");
        })->limit(10)->get(['id', 'nom', 'prenom', 'type', 'telephone', 'email']);
        
        return response()->json([
            'success' => true,
            'data' => $parents
        ]);
    }
    
    /**
     * Assign parent to student
     */
    private function assignParent(Eleve $eleve, int $parentId, string $relation): void
    {
        $parent = ParentEleve::findOrFail($parentId);
        
        // Check if parent is already assigned
        if ($eleve->parents()->where('parent_id', $parentId)->exists()) {
            return;
        }
        
        $eleve->parents()->attach($parentId, [
            'relation' => $relation,
            'contact_principal' => $relation === 'pere', // Father is primary contact by default
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
    
    /**
     * Store enrollment step 2 - optimized for existing parents
     */
    public function storeStep2(Request $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            
            $validated = $request->validate([
                // Student data
                'nom_fr' => 'required|string|max:255',
                'prenom_fr' => 'required|string|max:255',
                'nom_ar' => 'nullable|string|max:255',
                'prenom_ar' => 'nullable|string|max:255',
                'date_naissance' => 'required|date',
                'lieu_naissance_fr' => 'nullable|string|max:255',
                'lieu_naissance_ar' => 'nullable|string|max:255',
                'sexe' => 'required|in:M,F',
                'cne' => 'nullable|string|unique:eleves,cne',
                'cin' => 'nullable|string|unique:eleves,cin',
                'photo' => ['nullable', new ValidPhoto(1048576, ['image/jpeg', 'image/png'])],
                'adresse' => 'nullable|string',
                'nationalite' => 'nullable|string|max:255',
                
                // Medical info
                'groupe_sanguin' => 'nullable|string|max:10',
                'allergies' => 'nullable|string',
                'maladies_chroniques' => 'nullable|string',
                'medicaments' => 'nullable|string',
                'infos_sante' => 'nullable|string',
                'personne_urgence' => 'nullable|string|max:255',
                'telephone_urgence' => 'nullable|string|max:20',
                
                // Parent associations (existing parents)
                'parents' => 'nullable|array',
                'parents.*.parent_id' => 'required|exists:parents,id',
                'parents.*.relation' => 'required|string|in:pere,mere,tuteur',
                'parents.*.contact_principal' => 'nullable|boolean',
                
                // Assignments
                'classe_id' => 'nullable|exists:classes,id',
                'cantine_id' => 'nullable|exists:cantines,id',
                'transport_id' => 'nullable|exists:transports,id',
            ]);
            
            // Create student - seulement les champs qui existent dans la table
            $eleveData = [
                'nom_fr' => $validated['nom_fr'],
                'prenom_fr' => $validated['prenom_fr'],
                'nom_ar' => $validated['nom_ar'] ?? null,
                'prenom_ar' => $validated['prenom_ar'] ?? null,
                'date_naissance' => $validated['date_naissance'],
                'lieu_naissance_fr' => $validated['lieu_naissance_fr'] ?? null,
                'lieu_naissance_ar' => $validated['lieu_naissance_ar'] ?? null,
                'sexe' => $validated['sexe'],
                'cne' => $validated['cne'] ?? null,
                'cin' => $validated['cin'] ?? null,
                'photo' => $validated['photo'] ?? null,
                'adresse' => $validated['adresse'] ?? null,
                'groupe_sanguin' => $validated['groupe_sanguin'] ?? null,
                'allergies' => $validated['allergies'] ?? null,
                'infos_sante' => $validated['infos_sante'] ?? null,
                'date_inscription' => now()->toDateString(),
            ];
            
            // Ajouter classe_id si fourni
            if (isset($validated['classe_id']) && $validated['classe_id']) {
                $eleveData['classe_id'] = $validated['classe_id'];
            }
            
            $eleve = Eleve::create($eleveData);
            
            // Assign parents with relations
            if (isset($validated['parents']) && is_array($validated['parents'])) {
                foreach ($validated['parents'] as $parentData) {
                    $this->assignParentEnhanced(
                        $eleve, 
                        $parentData['parent_id'], 
                        $parentData['relation'],
                        $parentData['contact_principal'] ?? ($parentData['relation'] === 'pere')
                    );
                }
            }
            
            // Assign to class
            if (isset($validated['classe_id'])) {
                $classe = Classe::findOrFail($validated['classe_id']);
                
                // Check if class is full
                if ($classe->est_complete) {
                    throw ValidationException::withMessages([
                        'classe_id' => ['La classe est complète. Impossible d\'inscrire plus d\'élèves.'],
                    ]);
                }
                
                $eleve->update(['classe_id' => $classe->id]);
            }
            
            // Assign to cantine
            if (isset($validated['cantine_id'])) {
                $eleve->cantines()->attach($validated['cantine_id'], [
                    'date_inscription' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            
            // Assign to transport
            if (isset($validated['transport_id'])) {
                $eleve->transports()->attach($validated['transport_id'], [
                    'date_inscription' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            
            DB::commit();
            
            // Load the complete student with relationships
            $eleve->load(['parents', 'classe', 'cantines', 'transports']);
            
            return response()->json([
                'success' => true,
                'message' => 'Inscription réalisée avec succès',
                'eleve' => $eleve
            ], 201);
            
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Assign parent to student (enhanced version)
     */
    private function assignParentEnhanced(Eleve $eleve, int $parentId, string $relation, bool $contactPrincipal = false): void
    {
        $parent = ParentEleve::findOrFail($parentId);
        
        // Check if parent is already assigned
        if ($eleve->parents()->where('parent_id', $parentId)->exists()) {
            return;
        }
        
        // If this parent should be the main contact, remove main contact flag from others
        if ($contactPrincipal) {
            $eleve->parents()->updateExistingPivot(
                $eleve->parents()->pluck('parent_id')->toArray(),
                ['contact_principal' => false]
            );
        }
        
        $eleve->parents()->attach($parentId, [
            'relation' => $relation,
            'contact_principal' => $contactPrincipal,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Store medical information
     */
    private function storeMedicalInfo(Eleve $eleve, array $medical): void
    {
        // This would typically be stored in a separate medical_info table
        // For now, we'll store it as JSON in the eleve table
        $eleve->update([
            'medical_info' => json_encode($medical)
        ]);
    }
}
