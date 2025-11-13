<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $regularUser;
    private Role $adminRole;
    private Role $userRole;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer les rôles
        $this->adminRole = Role::create([
            'nom' => 'admin',
            'description' => 'Administrateur'
        ]);

        $this->userRole = Role::create([
            'nom' => 'professeur',
            'description' => 'Professeur'
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
        $this->regularUser->roles()->attach($this->userRole);
    }

    public function test_admin_can_view_all_users(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/users');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'email',
                            'roles'
                        ]
                    ]
                ]);
    }

    public function test_non_admin_cannot_view_all_users(): void
    {
        Sanctum::actingAs($this->regularUser);

        $response = $this->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_admin_can_create_user(): void
    {
        Sanctum::actingAs($this->admin);

        $userData = [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '0612345678',
            'roles' => ['professeur']
        ];

        $response = $this->postJson('/api/users', $userData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'phone',
                        'roles'
                    ]
                ]);

        $this->assertDatabaseHas('users', [
            'name' => 'New User',
            'email' => 'newuser@example.com'
        ]);
    }

    public function test_regular_user_cannot_create_user(): void
    {
        Sanctum::actingAs($this->regularUser);

        $userData = [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'roles' => ['professeur']
        ];

        $response = $this->postJson('/api/users', $userData);

        $response->assertStatus(403);
    }

    public function test_user_can_view_own_profile(): void
    {
        Sanctum::actingAs($this->regularUser);

        $response = $this->getJson('/api/users/' . $this->regularUser->id);

        $response->assertStatus(200)
                ->assertJson([
                    'user' => [
                        'id' => $this->regularUser->id,
                        'name' => $this->regularUser->name,
                        'email' => $this->regularUser->email
                    ]
                ]);
    }

    public function test_admin_can_view_any_user_profile(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/users/' . $this->regularUser->id);

        $response->assertStatus(200);
    }

    public function test_user_cannot_view_other_user_profile(): void
    {
        Sanctum::actingAs($this->regularUser);

        $response = $this->getJson('/api/users/' . $this->admin->id);

        $response->assertStatus(403);
    }

    public function test_admin_can_update_user(): void
    {
        Sanctum::actingAs($this->admin);

        $updateData = [
            'name' => 'Updated Name',
            'phone' => '0987654321'
        ];

        $response = $this->putJson('/api/users/' . $this->regularUser->id, $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'user' => [
                        'name' => 'Updated Name',
                        'phone' => '0987654321'
                    ]
                ]);
    }

    public function test_user_can_update_own_profile(): void
    {
        Sanctum::actingAs($this->regularUser);

        $updateData = [
            'name' => 'My Updated Name'
        ];

        $response = $this->putJson('/api/users/' . $this->regularUser->id, $updateData);

        $response->assertStatus(200);
    }

    public function test_admin_can_delete_user(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->deleteJson('/api/users/' . $this->regularUser->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $this->regularUser->id]);
    }

    public function test_admin_cannot_delete_self(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->deleteJson('/api/users/' . $this->admin->id);

        $response->assertStatus(403);
    }
}
