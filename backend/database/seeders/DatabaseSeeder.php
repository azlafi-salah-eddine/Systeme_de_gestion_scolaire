<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * 
     * Exécute les seeders de base pour la première utilisation:
     * 1. RoleSeeder: Crée les rôles (super_admin, admin, professeur, eleve)
     * 2. DefaultAdminSeeder: Crée le superadmin par défaut
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,          // Crée les rôles de base
            DefaultAdminSeeder::class,  // Crée le superadmin par défaut
        ]);
    }
}
