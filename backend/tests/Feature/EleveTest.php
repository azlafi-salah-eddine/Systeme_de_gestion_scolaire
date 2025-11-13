<?php

namespace Tests\Feature;

use App\Models\Classe;
use App\Models\Eleve;
use App\Models\ParentEleve;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EleveTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $professeur;
    private User $parent;
    private Role $adminRole;
    private Role $professeurRole;
    private Role $parentRole;
    private Classe $classe;

    protected function setUp(): void
    {
        parent::setUp();

        // Créer les rôles
        $this->adminRole = Role::create([
            'nom' => 'admin',
            'description' => 'Administrateur'
        ]);

        $this->professeurRole = Role::create([
            'nom' => 'professeur',
            'description' => 'Professeur'
        ]);

        $this->parentRole = Role::create([
            'nom' => 'parent',
            'description' => 'Parent'
        ]);

        // Créer l'admin
        $this->admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
        ]);
        $this->admin->roles()->attach($this->adminRole);

        // Créer un professeur
        $this->professeur = User::create([
            'name' => 'Professeur User',
            'email' => 'prof@example.com',
            'password' => bcrypt('password123'),
        ]);
        $this->professeur->roles()->attach($this->professeurRole);

        // Créer un parent
        $this->parent = User::create([
            'name' => 'Parent User',
            'email' => 'parent@example.com',
            'password' => bcrypt('password123'),
        ]);
        $this->parent->roles()->attach($this->parentRole);

        // Créer une classe
        $this->classe = Classe::create([
            'niveau' => '6ème',
            'annee_scolaire' => '2024-2025',
            'section' => 'A',
            'active' => true
        ]);
    }

    public function test_admin_can_view_all_eleves(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/v1/eleves');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_eleve(): void
    {
        Sanctum::actingAs($this->admin);

        $eleveData = [
            'nom' => 'Doe',
            'prenom' => 'John',
            'date_naissance' => '2010-05-15',
            'matricule' => 'ELE001',
            'cne' => 'CNE001',
            'adresse' => '123 Rue Test',
            'date_inscription' => '2024-09-01',
            'classe_id' => $this->classe->id,
            'active' => true
        ];

        $response = $this->postJson('/api/v1/eleves', $eleveData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'eleve' => [
                        'id',
                        'nom',
                        'prenom',
                        'matricule',
                        'cne'
                    ]
                ]);

        $this->assertDatabaseHas('eleves', [
            'nom' => 'Doe',
            'prenom' => 'John',
            'matricule' => 'ELE001'
        ]);
    }

    public function test_admin_can_view_eleve_details(): void
    {
        Sanctum::actingAs($this->admin);

        $eleve = Eleve::create([
            'nom' => 'Doe',
            'prenom' => 'John',
            'date_naissance' => '2010-05-15',
            'matricule' => 'ELE001',
            'cne' => 'CNE001',
            'adresse' => '123 Rue Test',
            'date_inscription' => '2024-09-01',
            'classe_id' => $this->classe->id,
            'active' => true
        ]);

        $response = $this->getJson('/api/v1/eleves/' . $eleve->id);

        $response->assertStatus(200)
                ->assertJson([
                    'eleve' => [
                        'id' => $eleve->id,
                        'nom' => 'Doe',
                        'prenom' => 'John'
                    ]
                ]);
    }

    public function test_admin_can_update_eleve(): void
    {
        Sanctum::actingAs($this->admin);

        $eleve = Eleve::create([
            'nom' => 'Doe',
            'prenom' => 'John',
            'date_naissance' => '2010-05-15',
            'matricule' => 'ELE001',
            'cne' => 'CNE001',
            'adresse' => '123 Rue Test',
            'date_inscription' => '2024-09-01',
            'classe_id' => $this->classe->id,
            'active' => true
        ]);

        $updateData = [
            'nom' => 'Smith',
            'adresse' => '456 Nouvelle Rue'
        ];

        $response = $this->putJson('/api/v1/eleves/' . $eleve->id, $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'eleve' => [
                        'nom' => 'Smith',
                        'adresse' => '456 Nouvelle Rue'
                    ]
                ]);
    }

    public function test_admin_can_delete_eleve(): void
    {
        Sanctum::actingAs($this->admin);

        $eleve = Eleve::create([
            'nom' => 'Doe',
            'prenom' => 'John',
            'date_naissance' => '2010-05-15',
            'matricule' => 'ELE001',
            'cne' => 'CNE001',
            'adresse' => '123 Rue Test',
            'date_inscription' => '2024-09-01',
            'classe_id' => $this->classe->id,
            'active' => true
        ]);

        $response = $this->deleteJson('/api/v1/eleves/' . $eleve->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('eleves', ['id' => $eleve->id]);
    }

    public function test_eleve_validation_requires_required_fields(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/v1/eleves', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['nom', 'prenom', 'date_naissance', 'matricule', 'cne', 'adresse', 'date_inscription']);
    }

    public function test_eleve_matricule_must_be_unique(): void
    {
        Sanctum::actingAs($this->admin);

        // Créer un premier élève
        Eleve::create([
            'nom' => 'Doe',
            'prenom' => 'John',
            'date_naissance' => '2010-05-15',
            'matricule' => 'ELE001',
            'cne' => 'CNE001',
            'adresse' => '123 Rue Test',
            'date_inscription' => '2024-09-01',
            'classe_id' => $this->classe->id,
            'active' => true
        ]);

        // Tenter de créer un élève avec le même matricule
        $response = $this->postJson('/api/v1/eleves', [
            'nom' => 'Smith',
            'prenom' => 'Jane',
            'date_naissance' => '2010-06-15',
            'matricule' => 'ELE001', // Même matricule
            'cne' => 'CNE002',
            'adresse' => '456 Rue Test',
            'date_inscription' => '2024-09-01',
            'classe_id' => $this->classe->id,
            'active' => true
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['matricule']);
    }
}
