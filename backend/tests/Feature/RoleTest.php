<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $regularUser;
    private Role $adminRole;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer le rôle admin
        $this->adminRole = Role::create([
            'nom' => 'admin',
            'description' => 'Administrateur'
        ]);

        // Créer l'admin
        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
        ]);
        $this->admin->roles()->attach($this->adminRole);

        // Créer un utilisateur régulier
        $this->regularUser = User::create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'password' => bcrypt('password123'),
        ]);
    }

    public function test_admin_can_view_all_roles(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/roles');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'nom',
                            'description'
                        ]
                    ]
                ]);
    }

    public function test_non_admin_cannot_view_roles(): void
    {
        Sanctum::actingAs($this->regularUser);

        $response = $this->getJson('/api/roles');

        $response->assertStatus(403);
    }

    public function test_admin_can_create_role(): void
    {
        Sanctum::actingAs($this->admin);

        $roleData = [
            'nom' => 'new_role',
            'description' => 'Description du nouveau rôle'
        ];

        $response = $this->postJson('/api/roles', $roleData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'role' => [
                        'id',
                        'nom',
                        'description'
                    ]
                ]);

        $this->assertDatabaseHas('roles', [
            'nom' => 'new_role',
            'description' => 'Description du nouveau rôle'
        ]);
    }

    public function test_admin_can_update_role(): void
    {
        Sanctum::actingAs($this->admin);

        $role = Role::create([
            'nom' => 'test_role',
            'description' => 'Rôle de test'
        ]);

        $updateData = [
            'description' => 'Description mise à jour'
        ];

        $response = $this->putJson('/api/roles/' . $role->id, $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'role' => [
                        'description' => 'Description mise à jour'
                    ]
                ]);
    }

    public function test_admin_can_delete_role(): void
    {
        Sanctum::actingAs($this->admin);

        $role = Role::create([
            'nom' => 'deletable_role',
            'description' => 'Rôle à supprimer'
        ]);

        $response = $this->deleteJson('/api/roles/' . $role->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    public function test_admin_cannot_delete_role_with_users(): void
    {
        Sanctum::actingAs($this->admin);

        $role = Role::create([
            'nom' => 'used_role',
            'description' => 'Rôle utilisé'
        ]);

        // Attacher un utilisateur au rôle
        $this->regularUser->roles()->attach($role);

        $response = $this->deleteJson('/api/roles/' . $role->id);

        $response->assertStatus(422)
                ->assertJson([
                    'message' => 'Impossible de supprimer ce rôle car il est attribué à des utilisateurs'
                ]);

        $this->assertDatabaseHas('roles', ['id' => $role->id]);
    }

    public function test_role_validation_requires_name(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/roles', [
            'description' => 'Description sans nom'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['nom']);
    }

    public function test_role_name_must_be_unique(): void
    {
        Sanctum::actingAs($this->admin);

        // Créer un premier rôle
        Role::create([
            'nom' => 'duplicate_role',
            'description' => 'Premier rôle'
        ]);

        // Tenter de créer un rôle avec le même nom
        $response = $this->postJson('/api/roles', [
            'nom' => 'duplicate_role',
            'description' => 'Deuxième rôle'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['nom']);
    }
}
