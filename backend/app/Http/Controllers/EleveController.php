<?php

namespace App\Http\Controllers;

use App\Models\Eleve;
use Illuminate\Support\Facades\Schema;
use App\Models\ParentEleve;
use App\Models\Classe;
use App\Http\Requests\Eleve\StoreEleveRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\FileNamingService;
use App\Services\StudentPhotoService;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class EleveController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Toujours charger classe.niveau pour afficher le niveau dans le tableau
            $query = Eleve::with(['classe', 'classe.niveau', 'parents']);

            // Filter by active status (default to active only)
            $activeFilter = $request->get('active', 'true');
            if ($activeFilter !== 'all') {
                $query->where('active', $activeFilter === 'true');
            }

            // Si c'est un professeur, filtrer par ses classes uniquement
            $currentUser = $request->user();
            if ($currentUser && $currentUser->hasRole('professeur')) {
                $professeur = $currentUser->getProfesseur();
                
                if ($professeur) {
                    // Récupérer les IDs des classes du professeur
                    $classeIds = $professeur->classes()->pluck('classes.id')->toArray();
                    
                    // Si le professeur n'a pas de classes, retourner une liste vide
                    if (empty($classeIds)) {
                        $perPage = min($request->get('per_page', 10), 100);
                        return response()->json([
                            'success' => true,
                            'data' => [],
                            'pagination' => [
                                'current_page' => 1,
                                'last_page' => 1,
                                'per_page' => $perPage,
                                'total' => 0,
                            ],
                        ]);
                    }
                    
                    // Filtrer les élèves pour ses classes uniquement
                    $query->whereIn('classe_id', $classeIds);
                } else {
                    // Si pas de professeur trouvé, retourner liste vide
                    $perPage = min($request->get('per_page', 10), 100);
                    return response()->json([
                        'success' => true,
                        'data' => [],
                        'pagination' => [
                            'current_page' => 1,
                            'last_page' => 1,
                            'per_page' => $perPage,
                            'total' => 0,
                        ],
                    ]);
                }
            }

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nom_fr', 'like', "%{$search}%")
                      ->orWhere('prenom_fr', 'like', "%{$search}%")
                      ->orWhere('nom_ar', 'like', "%{$search}%")
                      ->orWhere('prenom_ar', 'like', "%{$search}%")
                      ->orWhere('matricule', 'like', "%{$search}%")
                      ->orWhere('cne', 'like', "%{$search}%")
                      ->orWhere('cin', 'like', "%{$search}%");
                });
            }

            // Filter by affectation status (has_classe) - doit être appliqué en premier
            $hasClasseFilter = null;
            if ($request->filled('has_classe')) {
                $hasClasse = $request->input('has_classe');
                if ($hasClasse === 'true' || $hasClasse === true) {
                    $hasClasseFilter = 'affecte';
                    $query->whereNotNull('classe_id');
                } elseif ($hasClasse === 'false' || $hasClasse === false) {
                    $hasClasseFilter = 'non_affecte';
                    $query->whereNull('classe_id');
                }
            }

            // Filter by class
            // Si on filtre par "affecté", appliquer le filtre classe
            // Si on filtre par "tous", inclure les affectés de cette classe ET tous les non affectés
            // Si on filtre par "non affecté", ne pas appliquer ce filtre
            if ($request->has('classe_id') && $request->classe_id && $hasClasseFilter !== 'non_affecte') {
                if ($hasClasseFilter === 'affecte') {
                    // Seulement les affectés de cette classe
                $query->where('classe_id', $request->classe_id);
                } else {
                    // "Tous" : inclure les affectés de cette classe ET tous les non affectés
                    $query->where(function ($q) use ($request) {
                        $q->where('classe_id', $request->classe_id)
                          ->orWhereNull('classe_id');
                    });
                }
            }

            // Filter by niveau (through classe relationship)
            // Si on filtre par "affecté", appliquer le filtre niveau
            // Si on filtre par "tous", inclure les affectés de ce niveau ET tous les non affectés
            // Si on filtre par "non affecté", ne pas appliquer ce filtre
            if ($request->has('niveau') && $request->niveau && $hasClasseFilter !== 'non_affecte') {
                if ($hasClasseFilter === 'affecte') {
                    // Seulement les affectés de ce niveau
                $query->whereHas('classe', function ($q) use ($request) {
                        $q->whereHas('niveau', function ($niveauQuery) use ($request) {
                            $niveauQuery->where('nom', $request->niveau);
                        });
                    });
                } else {
                    // "Tous" : inclure les affectés de ce niveau ET tous les non affectés
                    $query->where(function ($q) use ($request) {
                        $q->whereHas('classe', function ($classeQuery) use ($request) {
                            $classeQuery->whereHas('niveau', function ($niveauQuery) use ($request) {
                                $niveauQuery->where('nom', $request->niveau);
                            });
                        })->orWhereNull('classe_id');
                    });
                }
            }

            // Filter by annee_scolaire_id (through classe relationship)
            // Si on filtre par "non affecté", ne pas appliquer ce filtre
            // Si on filtre par "affecté" ou "tous", appliquer le filtre mais inclure les non affectés si "tous"
            if ($request->filled('annee_scolaire_id') && $hasClasseFilter !== 'non_affecte') {
                $anneeScolaireId = $request->input('annee_scolaire_id');
                if ($hasClasseFilter === 'affecte') {
                    // Seulement les affectés de cette année
                    $query->whereHas('classe', function ($q) use ($anneeScolaireId) {
                        $q->where('annee_scolaire_id', $anneeScolaireId);
                    });
                } else {
                    // "Tous" : inclure les affectés de cette année ET les non affectés
                    $query->where(function ($q) use ($anneeScolaireId) {
                        $q->whereHas('classe', function ($classeQuery) use ($anneeScolaireId) {
                            $classeQuery->where('annee_scolaire_id', $anneeScolaireId);
                        })->orWhereNull('classe_id');
                    });
                }
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'nom_fr');
            $sortOrder = $request->get('sort_order', 'asc');
            
            if (in_array($sortBy, ['nom_fr', 'prenom_fr', 'date_naissance', 'created_at', 'matricule'])) {
                $query->orderBy($sortBy, $sortOrder);
            } else {
                $query->orderBy('nom_fr', 'asc');
            }

            // Pagination with optimized query
            $perPage = min($request->get('per_page', 10), 100); // Max 100 per page, default 10
            $eleves = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => \App\Http\Resources\EleveResource::collection($eleves->items()),
                'pagination' => [
                    'current_page' => $eleves->currentPage(),
                    'last_page' => $eleves->lastPage(),
                    'per_page' => $eleves->perPage(),
                    'total' => $eleves->total(),
                    'from' => $eleves->firstItem(),
                    'to' => $eleves->lastItem(),
                ],
                'filters' => [
                    'search' => $request->get('search'),
                    'classe_id' => $request->get('classe_id'),
                    'niveau' => $request->get('niveau'),
                    'active' => $activeFilter,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des élèves',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreEleveRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            // Utiliser les données validées directement
            $data = $validated;

            // Traiter l'upload de la photo - sera fait après la création de l'élève
            $photoData = null;
            $photoFile = null;
            
            if ($request->hasFile('photo')) {
                $photoFile = $request->file('photo');
                unset($data['photo']); // Supprimer de data pour traiter après création
            } elseif (isset($validated['photo']) && is_string($validated['photo']) && Str::startsWith($validated['photo'], 'data:image')) {
                $photoData = $validated['photo'];
                unset($data['photo']); // Supprimer de data pour traiter après création
            }

            // Valeurs par défaut pour éviter les NULL indésirables
            $stringDefaults = [
                'adresse','ancienne_ecole','type_ecole','statut_ecole','nationalite','infos_sante',
                'allergies','maladies_chroniques','medicaments','personne_urgence','telephone_urgence',
                'lieu_naissance_fr','lieu_naissance_ar','nom_ar','prenom_ar'
            ];
            foreach ($stringDefaults as $key) {
                if (!array_key_exists($key, $data) || $data[$key] === null) {
                    $data[$key] = '';
                }
            }
            if (!array_key_exists('groupe_sanguin', $data) || $data['groupe_sanguin'] === null) {
                $data['groupe_sanguin'] = 'O+'; // défaut raisonnable
            }

            // Normalisations
            foreach (['nom_fr','prenom_fr','nom_ar','prenom_ar','lieu_naissance_fr','lieu_naissance_ar','adresse','ancienne_ecole','nationalite','cne','cin','infos_sante','allergies','maladies_chroniques','medicaments'] as $k) {
                if (array_key_exists($k, $data) && is_string($data[$k])) {
                    $data[$k] = trim($data[$k]);
                }
            }
            // Générer un matricule si absent
            if (!array_key_exists('matricule', $data) || empty($data['matricule'])) {
                $prefix = 'ELV';
                $year = now()->format('y');
                
                // Logique intelligente : commencer par le dernier matricule + 1
                $lastEleve = \App\Models\Eleve::where('matricule', 'like', $prefix . $year . '%')
                    ->orderBy('matricule', 'desc')
                    ->first();
                
                if ($lastEleve && preg_match('/' . $prefix . $year . '(\d{5})/', $lastEleve->matricule, $matches)) {
                    // Incrémenter le dernier numéro
                    $nextNumber = (int)$matches[1] + 1;
                    $candidate = $prefix . $year . str_pad((string)$nextNumber, 5, '0', STR_PAD_LEFT);
                } else {
                    // Premier élève de l'année
                    $candidate = $prefix . $year . '00001';
                }
                
                // Vérifier l'unicité (sécurité)
                $counter = 0;
                while (\App\Models\Eleve::where('matricule', $candidate)->exists() && $counter < 1000) {
                    $nextNumber = (int)substr($candidate, -5) + 1;
                    $candidate = $prefix . $year . str_pad((string)$nextNumber, 5, '0', STR_PAD_LEFT);
                    $counter++;
                }
                
                $data['matricule'] = $candidate;
            } else {
                $data['matricule'] = strtoupper(trim((string)$data['matricule']));
            }
            if (array_key_exists('langues', $data)) {
                if (is_string($data['langues'])) {
                    // Try to decode stringified array
                    $decoded = json_decode($data['langues'], true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $data['langues'] = $decoded;
                    }
                }
            } else {
                // Default empty array
                $data['langues'] = [];
            }

            if (!array_key_exists('date_inscription', $data) || empty($data['date_inscription'])) {
                $data['date_inscription'] = now()->toDateString();
            }

            $eleve = Eleve::create($data);
            $eleve->refresh();

            // Créer le compte utilisateur pour l'élève (login)
            try {
                $roleEleve = Role::where('type', 'eleve')->first();
                if ($roleEleve) {
                    $emailLogin = strtoupper($eleve->matricule) . '@ecole.ma';
                    // Mot de passe: 4 lettres maj + 4 chiffres
                    $passwordPlain = self::generateSimplePassword();
                    // Eviter collision email
                    if (!User::where('email', $emailLogin)->exists()) {
                        User::create([
                            'nom' => $eleve->nom_fr ?? $eleve->nom_ar ?? '',
                            'prenom' => $eleve->prenom_fr ?? $eleve->prenom_ar ?? '',
                            'email' => $emailLogin,
                            'password' => Hash::make($passwordPlain),
                            'temp_password' => $passwordPlain,
                            'telephone' => $eleve->telephone_urgence ?? null,
                            'role_id' => $roleEleve->id,
                            'active' => true,
                        ]);
                        $credentials = ['email' => $emailLogin, 'password' => $passwordPlain];
                    } else {
                        $credentials = ['email' => $emailLogin, 'password' => null];
                    }
                }
            } catch (\Throwable $e) {
                // Ne pas bloquer la création élève si la création user échoue
                Log::warning('Création user élève échouée: '.$e->getMessage());
            }

            // Traiter la photo après création de l'élève
            $photoService = new StudentPhotoService();
            try {
                if ($photoFile) {
                    // Upload depuis un fichier
                    $photoPath = $photoService->saveProfilePhotoFromFile($eleve, $photoFile);
                    $eleve->update(['photo' => $photoPath]);
                } elseif ($photoData) {
                    // Upload depuis base64
                    $photoPath = $photoService->saveProfilePhotoFromBase64($eleve, $photoData);
                    $eleve->update(['photo' => $photoPath]);
                }
            } catch (\Exception $e) {
                // Si erreur photo, continuer sans photo
                // L'erreur est silencieuse pour ne pas bloquer l'inscription
            }

            // Affecter la classe si fournie
            if (array_key_exists('classe_id', $data) && !empty($data['classe_id'])) {
                $eleve->update(['classe_id' => $data['classe_id']]);
            }

            // Inscrire à la cantine si fournie (via pivot)
            if (array_key_exists('cantine_id', $validated) && !empty($validated['cantine_id'])) {
                try {
                    $eleve->cantines()->syncWithoutDetaching([$validated['cantine_id'] => ['date_inscription' => now()]]);
                } catch (\Throwable $ignored) {}
            }

            // Inscrire au transport si fourni (via pivot)
            if (array_key_exists('transport_id', $validated) && !empty($validated['transport_id'])) {
                try {
                    $eleve->transports()->syncWithoutDetaching([$validated['transport_id'] => ['date_inscription' => now()]]);
                } catch (\Throwable $ignored) {}
            }

            // Charger prudemment les relations; ne pas échouer la requête si une relation pose problème
            try {
                $eleve->load(['parents', 'classe', 'cantine', 'transport']);
            } catch (\Throwable $ignored) {}

            return response()->json([
                'success' => true,
                'message' => 'Élève créé avec succès',
                'eleve' => (new \App\Http\Resources\EleveResource($eleve->load(['classe'])))->resolve(),
                'credentials' => $credentials ?? null
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'élève',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Eleve $eleve): JsonResponse
    {
        try {
            $eleve->load(['parents', 'classe', 'cantine', 'transport.chauffeur']);
            
            // Transform the data to match frontend expectations
            $eleveData = $eleve->toArray();
            
            // Transform parents into pere, mere, tuteur format
            $pere = null;
            $mere = null;
            $tuteur = null;
            
            foreach ($eleve->parents as $parent) {
                $parentData = [
                    'nom' => $parent->nom,
                    'prenom' => $parent->prenom,
                    'telephone' => $parent->telephone,
                    'profession' => $parent->profession,
                    'email' => $parent->email
                ];
                
                switch ($parent->pivot->relation) {
                    case 'pere':
                        $pere = $parentData;
                        break;
                    case 'mere':
                        $mere = $parentData;
                        break;
                    case 'tuteur':
                        $tuteur = array_merge($parentData, ['relation' => $parent->pivot->relation]);
                        break;
                }
            }
            
            // Transform transport data
            $transport_info = null;
            if ($eleve->transport) {
                $chauffeur = $eleve->transport->chauffeur;
                $transport_info = [
                    'souscrit' => true,
                    'ligne' => $eleve->transport->ligne ?? '',
                    'chauffeur' => $chauffeur ? ($chauffeur->prenom . ' ' . $chauffeur->nom) : '',
                    'telephone_chauffeur' => $chauffeur ? $chauffeur->telephone : '',
                    'heure_depart' => '07:30', // Default value since field doesn't exist
                    'heure_retour' => '16:45' // Default value since field doesn't exist
                ];
            } else {
                // Show default transport info even when no transport is assigned
                $transport_info = [
                    'souscrit' => false,
                    'ligne' => 'Aucune ligne assignée',
                    'chauffeur' => 'Aucun chauffeur assigné',
                    'telephone_chauffeur' => '',
                    'heure_depart' => '',
                    'heure_retour' => ''
                ];
            }
            
            // Récupérer le compte utilisateur associé (rôle élève)
            $userData = null;
            try {
                $roleEleve = \App\Models\Role::where('type', 'eleve')->first();
                if ($roleEleve) {
                    $loginEmail = strtoupper($eleve->matricule) . '@ecole.ma';
                    $user = \App\Models\User::where('role_id', $roleEleve->id)
                        ->where('email', $loginEmail)
                        ->first();
                    if (!$user) {
                        // Fallback par nom/prénom FR
                        $user = \App\Models\User::where('role_id', $roleEleve->id)
                            ->where('nom', $eleve->nom_fr)
                            ->where('prenom', $eleve->prenom_fr)
                            ->first();
                    }
                    if ($user) {
                        $userData = [
                            'id' => $user->id,
                            'email' => $user->email,
                            'temp_password' => $user->temp_password,
                            'created_at' => $user->created_at?->format('Y-m-d H:i:s'),
                            'updated_at' => $user->updated_at?->format('Y-m-d H:i:s'),
                        ];
                    }
                }
            } catch (\Throwable $ignored) {}

            // Transform cantine data
            $cantine_info = null;
            if ($eleve->cantine) {
                $cantine_info = [
                    'souscrit' => true,
                    'nom' => $eleve->cantine->nom,
                    'regime' => 'Normal', // Default value since cantine model doesn't have this field
                    'allergies_alimentaires' => 'Aucune', // Default value
                    'repas_speciaux' => 'Non' // Default value
                ];
            }
            
            // Add transformed data to the response
            $eleveData['pere'] = $pere;
            $eleveData['mere'] = $mere;
            $eleveData['tuteur'] = $tuteur;
            $eleveData['transport_info'] = $transport_info;
            $eleveData['cantine_info'] = $cantine_info;
            
            return response()->json([
                'success' => true,
                'eleve' => $eleveData,
                'user' => $userData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de l\'élève',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Eleve $eleve): JsonResponse
    {
        try {
            $oldMatricule = $eleve->matricule;
            $validated = $request->validate([
                'nom_fr' => 'sometimes|required|string|max:100',
                'prenom_fr' => 'sometimes|required|string|max:100',
                'nom_ar' => 'nullable|string|max:100',
                'prenom_ar' => 'nullable|string|max:100',
                'date_naissance' => 'sometimes|required|date',
                'lieu_naissance_fr' => 'nullable|string|max:100',
                'lieu_naissance_ar' => 'nullable|string|max:100',
                'sexe' => 'sometimes|required|in:M,F',
                'cne' => 'nullable|string|max:20',
                'cin' => 'nullable|string|max:20',
                'photo' => 'nullable',
                'adresse' => 'nullable|string|max:255',
                'nationalite' => 'nullable|string|max:100',
                'ancienne_ecole' => 'nullable|string|max:255',
                'type_ecole' => 'nullable|string|max:50',
                'statut_ecole' => 'nullable|string|max:50',
                'langues' => 'nullable|array',
                'groupe_sanguin' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
                'allergies' => 'nullable|string',
                'maladies_chroniques' => 'nullable|string',
                'medicaments' => 'nullable|string',
                'infos_sante' => 'nullable|string',
                'personne_urgence' => 'nullable|string|max:100',
                'telephone_urgence' => 'nullable|string|max:20',
                'classe_id' => 'nullable|integer|exists:classes,id',
                'cantine_id' => 'nullable|integer|exists:cantines,id',
                'transport_id' => 'nullable|integer|exists:transports,id',
                'active' => 'boolean',
            ]);

            // Traiter l'upload de la photo si présent
            if ($request->hasFile('photo')) {
                $uploadedPath = $request->file('photo')->store('eleves', 'public');
                $validated['photo'] = $uploadedPath;
            } elseif (array_key_exists('photo', $validated) && is_string($validated['photo']) && Str::startsWith($validated['photo'], 'data:image')) {
                [$meta, $content] = explode(',', $validated['photo'], 2);
                if (preg_match('/data:image\/(\w+);base64/', $meta, $matches)) {
                    $extension = strtolower($matches[1]);
                } else {
                    $extension = 'png';
                }
                $binary = base64_decode($content, true);
                if ($binary !== false) {
                    // Supprimer l'ancienne photo si elle existe
                    if (!empty($eleve->photo)) {
                        FileNamingService::deleteOldPhoto($eleve->photo);
                    }
                    
                    $filename = FileNamingService::generateStudentPhotoFilename(
                        $validated['nom_fr'] ?? $eleve->nom_fr,
                        $validated['prenom_fr'] ?? $eleve->prenom_fr,
                        $validated['cne'] ?? $eleve->cne,
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

            // Extraire les champs spéciaux avant de les retirer de validated
            $classeId = $request->input('classe_id');
            $cantineId = $request->input('cantine_id');
            $transportId = $request->input('transport_id');
            
            // Retirer les champs spéciaux de validated pour éviter les conflits
            // Ces champs seront traités séparément après la mise à jour de base
            unset($validated['classe_id'], $validated['cantine_id'], $validated['transport_id']);

            // Mettre à jour les champs de base
            $eleve->update($validated);

            // Si le matricule a changé, synchroniser l'email du user élève
            if ($oldMatricule && $eleve->matricule && strtoupper($oldMatricule) !== strtoupper($eleve->matricule)) {
                try {
                    $roleEleve = Role::where('type', 'eleve')->first();
                    if ($roleEleve) {
                        $oldEmail = strtoupper($oldMatricule) . '@ecole.ma';
                        $newEmail = strtoupper($eleve->matricule) . '@ecole.ma';
                        $user = User::where('role_id', $roleEleve->id)->where('email', $oldEmail)->first();
                        if ($user && !User::where('email', $newEmail)->exists()) {
                            $user->update(['email' => $newEmail]);
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning('Sync email user élève échouée: '.$e->getMessage());
                }
            }

            // Gérer l'affectation à la classe si fournie
            if ($request->has('classe_id')) {
                if ($classeId === null || $classeId === '') {
                    // Retirer l'affectation (mettre à null)
                    $eleve->update(['classe_id' => null]);
                } else {
                    // Vérifier que la classe existe et n'est pas complète
                    $classe = Classe::find($classeId);
                    if ($classe) {
                        if ($classe->est_complete && $eleve->classe_id !== $classe->id) {
                            throw ValidationException::withMessages([
                                'classe_id' => ['La classe est complète. Impossible d\'inscrire plus d\'élèves.'],
                            ]);
                        }
                        $eleve->update(['classe_id' => $classeId]);
                    }
                }
            }

            // Gérer la cantine (relation pivot) - utiliser sync pour éviter les doublons
            if ($request->has('cantine_id')) {
                try {
                    if ($cantineId !== null && $cantineId !== '') {
                        $eleve->cantines()->sync([$cantineId => ['date_inscription' => now()]]);
                    } else {
                        $eleve->cantines()->detach();
                    }
                } catch (\Throwable $e) {
                    // Ignorer les erreurs de relation pivot pour ne pas bloquer la mise à jour
                    Log::warning('Erreur lors de la mise à jour de la cantine pour l\'élève ' . $eleve->id . ': ' . $e->getMessage());
                }
            }

            // Gérer le transport (relation pivot) - utiliser sync pour éviter les doublons
            if ($request->has('transport_id')) {
                try {
                    if ($transportId !== null && $transportId !== '') {
                        $eleve->transports()->sync([$transportId => ['date_inscription' => now()]]);
                    } else {
                        $eleve->transports()->detach();
                    }
                } catch (\Throwable $e) {
                    // Ignorer les erreurs de relation pivot pour ne pas bloquer la mise à jour
                    Log::warning('Erreur lors de la mise à jour du transport pour l\'élève ' . $eleve->id . ': ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Élève mis à jour avec succès',
                'eleve' => $eleve->load(['parents', 'classe', 'cantine', 'transport'])
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'élève',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Eleve $eleve): JsonResponse
    {
        DB::transaction(function () use ($eleve) {
            // Soft delete l'élève
            $eleve->softDelete();

            // Trouver le User associé via email (matricule@ecole.ma) ou nom + prénom + rôle élève
            $eleveRole = Role::where('type', 'eleve')->first();
            if ($eleveRole) {
                $user = null;
                
                // Essayer d'abord par email (matricule@ecole.ma)
                if ($eleve->matricule) {
                    $loginEmail = strtolower($eleve->matricule) . '@ecole.ma';
                    $user = User::where('role_id', $eleveRole->id)
                        ->where('email', $loginEmail)
                        ->first();
                }
                
                // Fallback par nom/prénom FR si email ne fonctionne pas
                if (!$user && $eleve->nom_fr && $eleve->prenom_fr) {
                    $user = User::where('role_id', $eleveRole->id)
                        ->where('nom', $eleve->nom_fr)
                        ->where('prenom', $eleve->prenom_fr)
                        ->first();
                }
                
                if ($user) {
                    // Mettre active à 0 dans users
                    $user->update(['active' => false]);
                    
                    // Supprimer toutes les sessions de l'utilisateur pour le déconnecter
                    DB::table('sessions')
                        ->where('user_id', $user->id)
                        ->delete();
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Élève "' . ($eleve->nom_fr ?? '') . ' ' . ($eleve->prenom_fr ?? '') . '" a été supprimé avec succès',
        ]);
    }

    /**
     * Restore a soft deleted eleve
     */
    public function restore(Eleve $eleve): JsonResponse
    {
        // Check if the eleve is actually deleted
        if ($eleve->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Élève déjà actif',
            ], 400);
        }

        DB::transaction(function () use ($eleve) {
            // Restaurer l'élève
            $eleve->restore();

            // Trouver le User associé via email (matricule@ecole.ma) ou nom + prénom + rôle élève
            $eleveRole = Role::where('type', 'eleve')->first();
            if ($eleveRole) {
                $user = null;
                
                // Essayer d'abord par email (matricule@ecole.ma)
                if ($eleve->matricule) {
                    $loginEmail = strtolower($eleve->matricule) . '@ecole.ma';
                    $user = User::where('role_id', $eleveRole->id)
                        ->where('email', $loginEmail)
                        ->first();
                }
                
                // Fallback par nom/prénom FR si email ne fonctionne pas
                if (!$user && $eleve->nom_fr && $eleve->prenom_fr) {
                    $user = User::where('role_id', $eleveRole->id)
                        ->where('nom', $eleve->nom_fr)
                        ->where('prenom', $eleve->prenom_fr)
                        ->first();
                }
                
                if ($user) {
                    // Mettre active à 1 dans users
                    $user->update(['active' => true]);
                    
                    // S'assurer que le rôle élève est bien assigné
                    $user->update(['role_id' => $eleveRole->id]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Élève "' . ($eleve->nom_fr ?? '') . ' ' . ($eleve->prenom_fr ?? '') . '" a été restauré avec succès',
            'data' => new \App\Http\Resources\EleveResource($eleve->fresh()),
        ]);
    }

    /**
     * Get parents of a specific student
     */
    public function parents(Eleve $eleve): JsonResponse
    {
        try {
            $parents = $eleve->parents;
            
            return response()->json([
                'success' => true,
                'parents' => $parents
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des parents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Attach a parent to a student with relation and contact settings
     */
    public function attachParent(Request $request, Eleve $eleve): JsonResponse
    {
        try {
            $validated = $request->validate([
                'parent_id' => 'required|exists:parents,id',
                'relation' => 'nullable|string|in:pere,mere,tuteur',
                'contact_principal' => 'nullable|boolean'
            ]);

            $parent = ParentEleve::findOrFail($validated['parent_id']);
            
            // Check if parent is already attached
            if ($eleve->parents()->where('parent_id', $parent->id)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce parent est déjà associé à cet élève'
                ], 422);
            }

            // Determine relation and contact_principal automatically if not provided
            $relation = $validated['relation'] ?? $this->determineRelation($parent);
            $contactPrincipal = $validated['contact_principal'] ?? ($relation === 'pere');

            // If this parent should be the main contact, remove main contact flag from others
            if ($contactPrincipal) {
                $eleve->parents()->updateExistingPivot(
                    $eleve->parents()->pluck('parent_id')->toArray(),
                    ['contact_principal' => false]
                );
            }

            $eleve->parents()->attach($parent->id, [
                'relation' => $relation,
                'contact_principal' => $contactPrincipal,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Load the updated parents with pivot data
            $parents = $eleve->parents()->withPivot('relation', 'contact_principal')->get();

            return response()->json([
                'success' => true,
                'message' => 'Parent associé avec succès',
                'parents' => $parents
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'association du parent',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Determine the relation based on parent's type or name
     */
    private function determineRelation(ParentEleve $parent): string
    {
        // If parent has a type field, use it
        if (isset($parent->type) && in_array($parent->type, ['pere', 'mere', 'tuteur'])) {
            return $parent->type;
        }

        // Otherwise, try to guess from name patterns (basic heuristic)
        $nom = strtolower($parent->nom ?? '');
        $prenom = strtolower($parent->prenom ?? '');
        
        // Look for female indicators in Arabic/French names
        $femaleIndicators = ['fatima', 'aicha', 'khadija', 'nadia', 'marie', 'sarah', 'sophie'];
        foreach ($femaleIndicators as $indicator) {
            if (strpos($prenom, $indicator) !== false) {
                return 'mere';
            }
        }
        
        // Default to father if no clear indication
        return 'pere';
    }

    /**
     * Get filter options for students listing
     */
    public function filterOptions(): JsonResponse
    {
        try {
            // Récupérer les niveaux depuis la table niveaux
            $niveaux = DB::table('niveaux')
                ->where('active', true)
                ->select('nom as niveau')
                ->orderBy('nom')
                ->pluck('niveau')
                ->values();

            // Récupérer les classes avec leurs niveaux
            $classes = Classe::where('active', true)
                ->with('niveau:id,nom')
                ->select('id', 'nom', 'niveau_id', 'section')
                ->orderBy('niveau_id')
                ->orderBy('nom')
                ->get()
                ->map(function ($classe) {
                    return [
                        'id' => $classe->id,
                        'nom' => $classe->nom,
                        'niveau' => $classe->niveau ? $classe->niveau->nom : null,
                        'nom_complet' => ($classe->niveau ? $classe->niveau->nom . ' - ' : '') . $classe->nom,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'niveaux' => $niveaux,
                    'classes' => $classes,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur dans filterOptions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des options de filtrage',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notes of a specific student
     */
    public function notes(Eleve $eleve): JsonResponse
    {
        try {
            $currentUser = request()->user();
            
            // Si c'est un élève, vérifier qu'il accède uniquement à ses propres notes
            if ($currentUser && $currentUser->hasRole('eleve')) {
                $userEleve = $currentUser->getEleve();
                if (!$userEleve || $userEleve->id !== $eleve->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous n\'avez pas accès à ces notes'
                    ], 403);
                }
            }
            
            $notes = $eleve->notes()->with(['matiere', 'controle'])->get();
            
            return response()->json([
                'success' => true,
                'notes' => $notes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des notes',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Upload or update student profile photo
     */
    public function uploadPhoto(Request $request, Eleve $eleve): JsonResponse
    {
        try {
            $request->validate([
                'photo' => 'required'
            ]);

            $photoService = new StudentPhotoService();
            
            if ($request->hasFile('photo')) {
                // Upload depuis un fichier
                $photoPath = $photoService->saveProfilePhotoFromFile($eleve, $request->file('photo'));
            } elseif ($request->has('photo') && is_string($request->photo)) {
                // Upload depuis base64
                $photoPath = $photoService->saveProfilePhotoFromBase64($eleve, $request->photo);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Format de photo non supporté'
                ], 400);
            }

            // Mettre à jour l'élève avec le nouveau chemin
            $eleve->update(['photo' => $photoPath]);

            return response()->json([
                'success' => true,
                'message' => 'Photo de profil mise à jour avec succès',
                'photo_url' => $photoService->getProfilePhotoUrl($eleve),
                'photo_path' => $photoPath
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload de la photo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete student profile photo
     */
    public function deletePhoto(Eleve $eleve): JsonResponse
    {
        try {
            $photoService = new StudentPhotoService();
            $deleted = $photoService->deleteProfilePhoto($eleve);

            if ($deleted) {
                // Mettre à jour l'élève (supprimer le chemin)
                $eleve->update(['photo' => null]);

                return response()->json([
                    'success' => true,
                    'message' => 'Photo de profil supprimée avec succès'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune photo à supprimer'
                ], 404);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la photo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student profile photo URL
     */
    public function getPhotoUrl(Eleve $eleve): JsonResponse
    {
        try {
            $photoService = new StudentPhotoService();
            $photoUrl = $photoService->getProfilePhotoUrl($eleve);

            return response()->json([
                'success' => true,
                'photo_url' => $photoUrl,
                'has_photo' => $photoUrl !== null
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la photo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if CNE or CIN already exists
     */
    public function checkDuplicate(Request $request): JsonResponse
    {
        $cne = $request->query('cne');
        $cin = $request->query('cin');
        
        if (!$cne && !$cin) {
            return response()->json(['exists' => false]);
        }
        
        $query = Eleve::query();
        
        if ($cne && $cin) {
            // Si on vérifie les deux, chercher un élève qui a soit le même CNE soit le même CIN
            $query->where(function($q) use ($cne, $cin) {
                $q->where('cne', $cne)->orWhere('cin', $cin);
            });
        } elseif ($cne) {
            // Vérifier seulement le CNE
            $query->where('cne', $cne);
        } elseif ($cin) {
            // Vérifier seulement le CIN
            $query->where('cin', $cin);
        }
        
        $exists = $query->exists();
        
        return response()->json(['exists' => $exists], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Réinitialiser le mot de passe du compte élève associé
     */
    public function resetPassword(Eleve $eleve): JsonResponse
    {
        // Vérifier si l'utilisateur actuel est admin ou super admin
        $currentUser = request()->user();
        $isAdmin = $currentUser && ($currentUser->isSuperAdmin() || $currentUser->isAdmin());
        if (!$isAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les administrateurs peuvent réinitialiser les mots de passe'
            ], 403);
        }

        try {
            $roleEleve = \App\Models\Role::where('type', 'eleve')->first();
            if (!$roleEleve) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rôle élève introuvable'
                ], 404);
            }

            $loginEmail = strtoupper($eleve->matricule) . '@ecole.ma';
            $user = \App\Models\User::where('role_id', $roleEleve->id)
                ->where('email', $loginEmail)
                ->first();
            if (!$user) {
                $user = \App\Models\User::where('role_id', $roleEleve->id)
                    ->where('nom', $eleve->nom_fr)
                    ->where('prenom', $eleve->prenom_fr)
                    ->first();
            }

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun utilisateur associé à cet élève'
                ], 404);
            }

            $password = self::generateSimplePassword();
            $user->update([
                'password' => \Illuminate\Support\Facades\Hash::make($password),
                'temp_password' => $password,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe réinitialisé avec succès',
                'data' => [ 'password' => $password ]
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réinitialisation du mot de passe'
            ], 500);
        }
    }

    // Helpers
    private static function generateSimplePassword(): string
    {
        $letters = '';
        for ($i = 0; $i < 4; $i++) {
            $letters .= chr(random_int(65, 90)); // A-Z
        }
        $digits = str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        return $letters . $digits;
    }
}