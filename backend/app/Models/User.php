<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\SoftDeleteActive;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeleteActive;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'password',
        'temp_password',
        'role_id',
        'telephone',
        'active',
    ];


    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'active' => 'boolean',
        ];
    }

    /**
     * Le rôle principal de l'utilisateur (relation directe)
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Vérifier si l'utilisateur a un rôle spécifique (via role_id)
     */
    public function hasRole(string $role): bool
    {
        if (!$this->role_id) {
            return false;
        }
        // Charger le rôle s'il n'est pas déjà chargé
        if (!$this->relationLoaded('role')) {
            $this->load('role');
        }
        return $this->role && $this->role->type === $role;
    }

    /**
     * Vérifier si l'utilisateur a au moins un des rôles spécifiés
     */
    public function hasAnyRole(array $roles): bool
    {
        if (!$this->role_id) {
            return false;
        }
        // Charger le rôle s'il n'est pas déjà chargé
        if (!$this->relationLoaded('role')) {
            $this->load('role');
        }
        return $this->role && in_array($this->role->type, $roles);
    }

    /**
     * Vérifier si l'utilisateur est admin
     */
    public function isAdmin(): bool
    {
        return $this->hasAnyRole(['admin', 'super_admin']);
    }

    /**
     * Vérifier si l'utilisateur est super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    /**
     * Assigner un rôle à l'utilisateur (via role_id)
     */
    public function assignRole(string $role): void
    {
        $roleModel = Role::where('type', $role)->first();
        if ($roleModel) {
            $this->update(['role_id' => $roleModel->id]);
        }
    }

    /**
     * Retirer un rôle de l'utilisateur
     */
    public function removeRole(string $role): void
    {
        if ($this->hasRole($role)) {
            $this->update(['role_id' => null]);
        }
    }

    /**
     * Récupérer le professeur associé à cet utilisateur
     * Utilise l'email en priorité, sinon nom et prénom
     */
    public function getProfesseur(): ?\App\Models\Professeur
    {
        if (!$this->hasRole('professeur')) {
            return null;
        }

        // Essayer d'abord par email (plus fiable)
        if ($this->email) {
            $professeur = \App\Models\Professeur::where('email', $this->email)->first();
            if ($professeur) {
                return $professeur;
            }
        }

        // Sinon, essayer par nom et prénom
        if ($this->nom && $this->prenom) {
            return \App\Models\Professeur::where('nom', $this->nom)
                ->where('prenom', $this->prenom)
                ->first();
        }

        return null;
    }

    /**
     * Récupérer l'élève associé à cet utilisateur
     * Utilise l'email (matricule@ecole.ma) en priorité, sinon nom et prénom
     */
    public function getEleve(): ?\App\Models\Eleve
    {
        if (!$this->hasRole('eleve')) {
            return null;
        }

        // Essayer d'abord par email: [matricule]@ecole.ma
        if ($this->email && str_contains($this->email, '@')) {
            $localPart = explode('@', $this->email)[0];
            if ($localPart) {
                $eleve = \App\Models\Eleve::where('matricule', strtoupper($localPart))->first();
                if ($eleve) {
                    return $eleve;
                }
            }
        }

        // Fallback: tenter par nom/prénom FR si disponibles
        if ($this->nom && $this->prenom) {
            $eleve = \App\Models\Eleve::where('nom_fr', $this->nom)
                ->where('prenom_fr', $this->prenom)
                ->first();
            if ($eleve) {
                return $eleve;
            }
        }

        return null;
    }
}
