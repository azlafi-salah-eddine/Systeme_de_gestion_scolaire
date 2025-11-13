<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Crée les rôles de base nécessaires pour le système
     */
    public function run(): void
    {
        $roles = [
            [
                'type' => 'super_admin',
                'active' => true,
            ],
            [
                'type' => 'admin',
                'active' => true,
            ],
            [
                'type' => 'professeur',
                'active' => true,
            ],
            [
                'type' => 'eleve',
                'active' => true,
            ],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['type' => $role['type']],
                $role
            );
        }

        $this->command->info('Rôles créés: super_admin, admin, professeur, eleve');
    }
}
