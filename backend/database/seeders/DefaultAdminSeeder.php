<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class DefaultAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Crée le superadmin par défaut pour la première utilisation
     */
    public function run(): void
    {
        // Récupérer le rôle super_admin (doit être créé par RoleSeeder avant)
        $superAdminRole = Role::where('type', 'super_admin')->first();
        
        if (!$superAdminRole) {
            $this->command->error('Le rôle super_admin n\'existe pas. Veuillez exécuter RoleSeeder d\'abord.');
            return;
        }

        // Créer le super admin par défaut (unique superadmin)
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@ecole.ma'],
            [
                'nom' => 'Super',
                'prenom' => 'Admin',
                'email' => 'superadmin@ecole.ma',
                'password' => Hash::make('superadmin123'),
                'role_id' => $superAdminRole->id,
                'active' => true,
            ]
        );

        // S'assurer que le superadmin a bien le rôle super_admin
        if ($superAdmin->role_id !== $superAdminRole->id) {
            $superAdmin->update(['role_id' => $superAdminRole->id]);
        }

        $this->command->info('Super Admin créé: superadmin@ecole.ma / superadmin123');
        $this->command->info('Ce superadmin est le seul qui peut créer des administrateurs.');
    }
}
