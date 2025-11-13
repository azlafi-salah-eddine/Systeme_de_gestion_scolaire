<?php

namespace App\Http\Controllers;

use App\Http\Requests\Professeur\StoreProfesseurRequest;
use App\Http\Requests\Professeur\UpdateProfesseurRequest;
use App\Http\Resources\ClasseResource;
use App\Http\Resources\MatiereResource;
use App\Http\Resources\ProfesseurResource;
use App\Models\Professeur;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class ProfesseurController extends Controller
{
    public function __construct()
    {
        // Authorization is handled per-action to allow public read access
        // $this->authorizeResource(Professeur::class, 'professeur');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        
        $query = Professeur::active(); // Use active scope by default

        // Les professeurs ne peuvent voir que leur propre profil
        if ($currentUser && $currentUser->hasRole('professeur')) {
            // Charger le rôle pour avoir accès à la relation
            $currentUser->load('role');
            
            // Trouver le professeur associé via nom + prénom
            $professeur = Professeur::where('nom', $currentUser->nom)
                ->where('prenom', $currentUser->prenom)
                ->first();
            if ($professeur) {
                $query->where('id', $professeur->id);
            } else {
                // Si pas de professeur associé, retourner une liste vide
                return response()->json([
                    'success' => true,
                    'data' => [],
                    'meta' => [
                        'current_page' => 1,
                        'per_page' => 15,
                        'total' => 0,
                        'last_page' => 1,
                    ],
                ]);
            }
        }

        if ($request->filled('active')) {
            if ($request->boolean('active')) {
                $query = Professeur::active();
            } else {
                $query = Professeur::inactive();
            }
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                    ->orWhere('prenom', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('telephone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('with')) {
            $with = array_filter(array_map('trim', explode(',', (string) $request->input('with'))));
            $allowed = ['classes', 'matieres'];
            $with = array_values(array_intersect($with, $allowed));
            if (!empty($with)) {
                $query->with($with);
            }
        }

        $perPage = (int) $request->input('per_page', 15);
        $professeurs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => ProfesseurResource::collection($professeurs->items()),
            'meta' => [
                'current_page' => $professeurs->currentPage(),
                'per_page' => $professeurs->perPage(),
                'total' => $professeurs->total(),
                'last_page' => $professeurs->lastPage(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreProfesseurRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            
            // Vérifier que le rôle professeur existe
            $role = Role::where('type', 'professeur')->first();
            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le rôle professeur n\'existe pas. Veuillez créer le rôle d\'abord.',
                ], 422);
            }

            // Générer le mot de passe automatiquement: 4 lettres majuscules + 4 chiffres
            $password = $this->generatePassword();

            // Générer l'email de connexion automatiquement avec le format prof000000001@ecole.ma
            $loginEmail = $this->generateEmail();

            $result = DB::transaction(function () use ($data, $role, $loginEmail, $password) {
                // Créer le User avec le rôle professeur (email de connexion généré)
                $user = User::create([
                    'nom' => $data['nom'],
                    'prenom' => $data['prenom'],
                    'email' => $loginEmail, // Email de connexion généré automatiquement
                    'password' => Hash::make($password),
                    'temp_password' => $password, // Stocker le mot de passe en clair
                    'telephone' => $data['telephone'] ?? null,
                    'role_id' => $role->id,
                    'active' => $data['active'] ?? true,
                ]);
                // Le rôle est déjà assigné via role_id dans User::create

                // Créer le Professeur avec l'email de contact (optionnel, saisi par l'utilisateur)
                // L'email de contact reste dans $data['email'] s'il est fourni, sinon null
                $professeurData = $data;
                // $professeurData['email'] peut être null ou l'email de contact saisi
                $professeur = Professeur::create($professeurData);

                return [
                    'user' => $user,
                    'professeur' => $professeur,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Professeur créé avec succès',
                'data' => new ProfesseurResource($result['professeur']),
                'credentials' => [
                    'email' => $loginEmail, // Email de connexion (généré)
                    'password' => $password,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de professeur: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'data' => $request->validated() ?? null,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du professeur: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Génère un email unique pour un professeur avec le format prof000000001@ecole.ma
     * Cet email sera utilisé à la fois dans la table users (pour la connexion) 
     * et dans la table professeurs
     */
    private function generateEmail(): string
    {
        $prefix = 'prof';
        
        // Utiliser une transaction pour éviter les collisions en cas de créations simultanées
        return DB::transaction(function () use ($prefix) {
            // Récupérer le numéro maximum directement avec une requête SQL optimisée
            // Chercher dans les deux tables (users et professeurs)
            $maxFromUsers = DB::table('users')
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->where('roles.type', 'professeur')
                ->where('users.email', 'like', $prefix . '%@ecole.ma')
                ->selectRaw('MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(users.email, "@", 1), ?, -1) AS UNSIGNED)) as max_num', [$prefix])
                ->value('max_num') ?? 0;
            
            $maxFromProfesseurs = DB::table('professeurs')
                ->where('email', 'like', $prefix . '%@ecole.ma')
                ->selectRaw('MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(email, "@", 1), ?, -1) AS UNSIGNED)) as max_num', [$prefix])
                ->value('max_num') ?? 0;
            
            // Prendre le maximum des deux
            $maxNumber = max($maxFromUsers, $maxFromProfesseurs);
            
            // Le prochain numéro est le maximum + 1
            $nextNumber = $maxNumber + 1;
            
            // Formater avec zéros à gauche (9 chiffres: 000000001 à 999999999)
            $numbers = str_pad((string)$nextNumber, 9, '0', STR_PAD_LEFT);
            $email = $prefix . $numbers . '@ecole.ma';
            
            // Vérifier que l'email n'existe pas (sécurité supplémentaire en cas de collision)
            $maxAttempts = 100;
            $attempt = 0;
            while ((User::where('email', $email)->exists() || Professeur::where('email', $email)->exists()) && $attempt < $maxAttempts) {
                $nextNumber++;
                $numbers = str_pad((string)$nextNumber, 9, '0', STR_PAD_LEFT);
                $email = $prefix . $numbers . '@ecole.ma';
                $attempt++;
            }
            
            // Si on dépasse le maximum, utiliser timestamp comme fallback (très rare)
            if ($attempt >= $maxAttempts) {
                $numbers = substr(time(), -9);
                $email = $prefix . $numbers . '@ecole.ma';
                if (User::where('email', $email)->exists() || Professeur::where('email', $email)->exists()) {
                    $email = $prefix . time() . '@ecole.ma';
                }
            }
            
            return $email;
        });
    }

    /**
     * Génère un mot de passe aléatoire
     */
    private function generatePassword(): string
    {
        // Générer 4 lettres majuscules aléatoires
        $letters = '';
        for ($i = 0; $i < 4; $i++) {
            $letters .= chr(rand(65, 90)); // A-Z
        }
        
        // Générer 4 chiffres aléatoires
        $numbers = '';
        for ($i = 0; $i < 4; $i++) {
            $numbers .= rand(0, 9);
        }
        
        return $letters . $numbers;
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Professeur $professeur): JsonResponse
    {
        $currentUser = $request->user();
        
        // Les professeurs ne peuvent pas accéder à cette route (même leur propre profil)
        if ($currentUser && $currentUser->hasRole('professeur')) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé. Cette ressource est réservée aux administrateurs.',
            ], 403);
        }
        
        // Ensure we only show active professors by default
        if (!$professeur->isActive()) {
            // Si c'est un admin, permettre de voir les professeurs inactifs
            if (!$currentUser || !$currentUser->isAdmin()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Professeur non trouvé ou supprimé',
                ], 404);
            }
        }

        if ($request->filled('with')) {
            $with = array_filter(array_map('trim', explode(',', (string) $request->input('with'))));
            $allowed = ['classes', 'matieres'];
            $with = array_values(array_intersect($with, $allowed));
            if (!empty($with)) {
                $professeur->load($with);
            }
        }

        // Récupérer le User associé via nom + prénom + rôle professeur
        // L'email de contact peut être différent de l'email de connexion
        $user = null;
        $professeurRole = Role::where('type', 'professeur')->first();
        if ($professeurRole) {
            $user = User::where('nom', $professeur->nom)
                ->where('prenom', $professeur->prenom)
                ->where('role_id', $professeurRole->id)
                ->with('role')
                ->first();
        }

        $professeurData = new ProfesseurResource($professeur);
        $professeurArray = $professeurData->toArray($request);
        
        // Ajouter les informations du user si disponible
        if ($user) {
            $professeurArray['user'] = [
                'id' => $user->id,
                'email' => $user->email,
                'temp_password' => $user->temp_password,
                'created_at' => $user->created_at?->format('Y-m-d H:i:s'),
                'updated_at' => $user->updated_at?->format('Y-m-d H:i:s'),
                'roles' => $user->role ? [
                    [
                        'id' => $user->role->id,
                        'type' => $user->role->type,
                    ]
                ] : [],
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $professeurArray,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProfesseurRequest $request, Professeur $professeur): JsonResponse
    {
        // Ensure we only update active professors
        if (!$professeur->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Professeur non trouvé ou supprimé',
            ], 404);
        }

        $professeur->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Professeur mis à jour avec succès',
            'data' => new ProfesseurResource($professeur->fresh()),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Professeur $professeur): JsonResponse
    {
        DB::transaction(function () use ($professeur) {
            // Soft delete le professeur
            $professeur->softDelete();

            // Trouver le User associé via nom + prénom + rôle professeur
            $professeurRole = Role::where('type', 'professeur')->first();
            if ($professeurRole) {
                $user = User::where('nom', $professeur->nom)
                    ->where('prenom', $professeur->prenom)
                    ->where('role_id', $professeurRole->id)
                    ->first();
                if ($user) {
                    // Mettre active à 0 dans users
                    $user->update(['active' => false]);
                    
                    // Supprimer toutes les sessions de l'utilisateur pour le déconnecter
                    DB::table('sessions')
                        ->where('user_id', $user->id)
                        ->delete();
                    
                    // Le rôle est géré via role_id dans users, pas besoin de supprimer dans role_user
                    // On peut mettre role_id à null si nécessaire
                    // $user->update(['role_id' => null]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Professeur "' . $professeur->nom_complet . '" a été supprimé avec succès',
        ]);
    }

    /**
     * Restore a soft deleted professeur
     */
    public function restore(Professeur $professeur): JsonResponse
    {
        // Check if the professeur is actually deleted
        if ($professeur->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Professeur déjà actif',
            ], 400);
        }

        DB::transaction(function () use ($professeur) {
            // Restaurer le professeur
            $professeur->restore();

            // Trouver le User associé via nom + prénom + rôle professeur
            $professeurRole = Role::where('type', 'professeur')->first();
            if ($professeurRole) {
                $user = User::where('nom', $professeur->nom)
                    ->where('prenom', $professeur->prenom)
                    ->where('role_id', $professeurRole->id)
                    ->first();
                if ($user) {
                    // Mettre active à 1 dans users
                    $user->update(['active' => true]);
                    
                    // Réattacher le rôle professeur via role_id
                    $professeurRole = Role::where('type', 'professeur')->first();
                    if ($professeurRole) {
                        $user->update(['role_id' => $professeurRole->id]);
                    }
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Professeur "' . $professeur->nom_complet . '" a été restauré avec succès',
            'data' => new ProfesseurResource($professeur->fresh()),
        ]);
    }

    /**
     * Relations: classes
     */
    public function classes(Professeur $professeur): JsonResponse
    {
        // Ensure we only show classes for active professors
        if (!$professeur->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Professeur non trouvé ou supprimé',
            ], 404);
        }

        $this->authorize('view', $professeur);

        $classes = $professeur->classes()->with(['matieres'])->get();

        return response()->json([
            'success' => true,
            'data' => ClasseResource::collection($classes),
        ]);
    }

    /**
     * Relations: matieres
     */
    public function matieres(Professeur $professeur): JsonResponse
    {
        // Ensure we only show matieres for active professors
        if (!$professeur->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Professeur non trouvé ou supprimé',
            ], 404);
        }

        $this->authorize('view', $professeur);

        $matieres = $professeur->matieres()->get();

        return response()->json([
            'success' => true,
            'data' => MatiereResource::collection($matieres),
        ]);
    }

    /**
     * Liste publique des professeurs pour les emplois du temps
     */
    public function listForTimetable(): JsonResponse
    {
        $professeurs = Professeur::where('active', true)
            ->select('id', 'nom', 'prenom', 'email', 'telephone')
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $professeurs,
            'message' => 'Liste des professeurs récupérée avec succès'
        ]);
    }

    /**
     * Réinitialiser le mot de passe d'un professeur
     */
    public function resetPassword(Professeur $professeur): JsonResponse
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

        // Trouver le User associé via nom + prénom + rôle professeur
        $professeurRole = Role::where('type', 'professeur')->first();
        $user = null;
        if ($professeurRole) {
            $user = User::where('nom', $professeur->nom)
                ->where('prenom', $professeur->prenom)
                ->where('role_id', $professeurRole->id)
                ->first();
        }
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun utilisateur associé à ce professeur'
            ], 404);
        }

        // Générer un nouveau mot de passe
        $password = $this->generatePassword();

        // Mettre à jour le mot de passe (hashé) et temp_password (en clair)
        $user->update([
            'password' => Hash::make($password),
            'temp_password' => $password,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe réinitialisé avec succès',
            'data' => [
                'password' => $password,
            ]
        ]);
    }
}
