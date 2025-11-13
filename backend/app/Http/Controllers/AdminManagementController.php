<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AdminManagementController extends Controller
{
    public function store(Request $request)
    {
        // Seul le superadmin peut créer des admins, et seulement des admins (pas de super_admin)
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les super administrateurs peuvent créer des administrateurs.',
            ], 403);
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'type' => 'required|in:admin',
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'telephone' => 'required|string|max:20|regex:/^[0-9]+$/',
            'active' => 'sometimes|boolean',
        ], [
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
            'telephone.required' => 'Le téléphone est obligatoire.',
            'telephone.regex' => 'Le téléphone doit contenir uniquement des chiffres.',
            'telephone.max' => 'Le téléphone ne peut pas dépasser 20 caractères.',
            'type.required' => 'Le type d\'administrateur est obligatoire.',
            'type.in' => 'Seuls les administrateurs peuvent être créés. Les super administrateurs ne peuvent pas être créés via cette interface.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $validator->validated();
            
            // Vérifier que le rôle existe
            $role = Role::where('type', $data['type'])->first();
            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le rôle ' . $data['type'] . ' n\'existe pas. Veuillez créer le rôle d\'abord.',
                ], 422);
            }

            // Générer l'email automatiquement (seulement pour admin, pas super_admin)
            $email = $this->generateEmail('admin');
            
            // Générer le mot de passe automatiquement: 4 lettres majuscules + 4 chiffres
            $password = $this->generatePassword();

            $user = DB::transaction(function () use ($data, $role, $email, $password) {
                $user = User::create([
                    'nom' => $data['nom'],
                    'prenom' => $data['prenom'],
                    'email' => $email,
                    'password' => Hash::make($password),
                    'temp_password' => $password, // Stocker le mot de passe en clair
                    'telephone' => $data['telephone'],
                    'role_id' => $role->id,
                    'active' => $data['active'] ?? true,
                ]);
                // Le rôle est déjà assigné via role_id dans User::create
                return $user;
            });

            return response()->json([
                'success' => true, 
                'data' => $user->load('role'),
                'credentials' => [
                    'email' => $email,
                    'password' => $password,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création d\'admin: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'data' => $data ?? null,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'administrateur: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function generateEmail(string $type): string
    {
        // Déterminer le préfixe selon le type
        $prefix = $type === 'super_admin' ? 'superadmin' : 'admin';
        
        // Utiliser une transaction pour éviter les collisions en cas de créations simultanées
        return DB::transaction(function () use ($prefix, $type) {
            // Récupérer le numéro maximum directement avec une requête SQL optimisée
            $maxNumber = DB::table('users')
                ->join('roles', 'users.role_id', '=', 'roles.id')
                ->where('roles.type', $type)
                ->where('users.email', 'like', $prefix . '%@ecole.ma')
                ->selectRaw('MAX(CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(users.email, "@", 1), ?, -1) AS UNSIGNED)) as max_num', [$prefix])
                ->value('max_num') ?? 0;
            
            // Le prochain numéro est le maximum + 1
            $nextNumber = $maxNumber + 1;
            
            // Formater avec zéros à gauche (9 chiffres: 000000001 à 999999999)
            $numbers = str_pad((string)$nextNumber, 9, '0', STR_PAD_LEFT);
            $email = $prefix . $numbers . '@ecole.ma';
            
            // Vérifier que l'email n'existe pas (sécurité supplémentaire en cas de collision)
            $maxAttempts = 100;
            $attempt = 0;
            while (User::where('email', $email)->exists() && $attempt < $maxAttempts) {
                $nextNumber++;
                $numbers = str_pad((string)$nextNumber, 9, '0', STR_PAD_LEFT);
                $email = $prefix . $numbers . '@ecole.ma';
                $attempt++;
            }
            
            // Si on dépasse le maximum, utiliser timestamp comme fallback (très rare)
            if ($attempt >= $maxAttempts) {
                $numbers = substr(time(), -9);
                $email = $prefix . $numbers . '@ecole.ma';
                if (User::where('email', $email)->exists()) {
                    $email = $prefix . time() . '@ecole.ma';
                }
            }
            
            return $email;
        });
    }

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

    public function show(User $user)
    {
        // Vérifier si l'utilisateur actuel est super admin
        $currentUser = request()->user();
        $isSuperAdmin = $currentUser && $currentUser->isSuperAdmin();
        
        $userData = $user->load('role')->toArray();
        
        // Retourner temp_password seulement si super admin
        if (!$isSuperAdmin) {
            unset($userData['temp_password']);
            unset($userData['password']);
        }
        
        return response()->json([
            'success' => true,
            'data' => $userData,
        ]);
    }

    public function update(Request $request, User $user)
    {
        // Seul le superadmin peut modifier des admins
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les super administrateurs peuvent modifier des administrateurs.',
            ], 403);
        }

        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            // L'email n'est pas modifiable car il est généré automatiquement
            'password' => 'sometimes|nullable|string|min:8',
            'telephone' => 'required|string|max:20|regex:/^[0-9]+$/',
        ], [
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
            'telephone.required' => 'Le téléphone est obligatoire.',
            'telephone.regex' => 'Le téléphone doit contenir uniquement des chiffres.',
            'telephone.max' => 'Le téléphone ne peut pas dépasser 20 caractères.',
        ]);

        // Empêcher la modification du rôle super_admin
        // Les superadmins ne peuvent pas être modifiés en admin, et les admins ne peuvent pas devenir superadmin
        if ($user->isSuperAdmin()) {
            // On ne peut pas modifier un superadmin (sauf si c'est le superadmin lui-même qui modifie ses propres infos)
            if ($currentUser->id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les super administrateurs ne peuvent pas être modifiés.',
                ], 422);
            }
        }

        DB::transaction(function () use ($user, $data) {
            $update = [];
            // Ne mettre à jour que nom, prenom et telephone (l'email est généré automatiquement et ne peut pas être modifié)
            foreach (['nom', 'prenom', 'telephone'] as $f) {
                if (array_key_exists($f, $data)) { 
                    $update[$f] = $data[$f]; 
                }
            }
            if (array_key_exists('password', $data) && $data['password']) {
                $update['password'] = Hash::make($data['password']);
            }
            if (!empty($update)) { 
                $user->update($update); 
            }
            // On ne modifie jamais le rôle ni l'email ici - les superadmins restent superadmins, les admins restent admins
            // L'email est généré automatiquement et ne peut pas être modifié
        });

        return response()->json(['success' => true, 'data' => $user->fresh()->load('role')]);
    }

    public function resetPassword(User $user)
    {
        // Seul le superadmin peut réinitialiser les mots de passe
        $currentUser = request()->user();
        if (!$currentUser || !$currentUser->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les super administrateurs peuvent réinitialiser les mots de passe'
            ], 403);
        }

        // Les superadmins peuvent réinitialiser le mot de passe des admins et le leur
        // Mais on ne permet pas à un superadmin de réinitialiser le mot de passe d'un autre superadmin
        if ($user->isSuperAdmin() && $currentUser->id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas réinitialiser le mot de passe d\'un autre super administrateur.'
            ], 422);
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

    public function destroy(User $user)
    {
        // Seul le superadmin peut supprimer des admins
        $currentUser = request()->user();
        if (!$currentUser || !$currentUser->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les super administrateurs peuvent supprimer des administrateurs.',
            ], 403);
        }

        // Empêcher la suppression du superadmin (il doit toujours en rester un)
        if ($user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer un super administrateur. Il doit toujours y avoir au moins un super administrateur.',
            ], 422);
        }

        // Empêcher la suppression de soi-même
        if ($user->id === $currentUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas supprimer votre propre compte.',
            ], 422);
        }

        // Soft delete : mettre active à false
        $user->softDelete();

        // Détruire toutes les sessions actives de cet utilisateur
        // Si les sessions sont stockées en base de données
        if (config('session.driver') === 'database' && Schema::hasTable('sessions')) {
            DB::table('sessions')
                ->where('user_id', $user->id)
                ->delete();
        }

        // Si les sessions sont stockées en fichiers, on ne peut pas les supprimer directement
        // Mais le middleware ApiAuth vérifiera l'état actif de l'utilisateur à chaque requête
        // et détruira la session automatiquement si l'utilisateur est inactif

        return response()->json([
            'success' => true,
            'message' => 'Administrateur supprimé avec succès. Toutes ses sessions ont été fermées.',
        ]);
    }
    public function index()
    {
        // Ne retourner que les admins normaux (pas les superadmins)
        // Le superadmin gère les admins, mais son propre profil ne doit pas apparaître dans la liste
        $adminRoleId = Role::where('type', 'admin')->value('id');
        
        if (!$adminRoleId) {
            return response()->json([
                'success' => true,
                'data' => [
                    'data' => [],
                ],
            ]);
        }
        
        $admins = User::where('role_id', $adminRoleId)
            ->with('role')
            ->get();

        // Transformer les données pour inclure role dans chaque admin
        $adminsData = $admins->map(function ($admin) {
            $adminArray = $admin->toArray();
            $adminArray['role'] = $admin->role ? [
                'id' => $admin->role->id,
                'type' => $admin->role->type,
                'active' => $admin->role->active,
            ] : null;
            return $adminArray;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'data' => $adminsData,
            ],
        ]);
    }

    // Ces méthodes ne sont plus utilisées - la gestion des admins se fait uniquement via store/destroy
    // Les superadmins ne peuvent pas être créés/modifiés/supprimés via l'interface
    // Seul le seeder crée le superadmin initial
}


