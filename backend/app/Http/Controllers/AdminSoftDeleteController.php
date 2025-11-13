<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Eleve;
use App\Models\Classe;
use App\Models\Professeur;
use App\Models\Matiere;
use App\Models\Niveau;
use App\Models\AnneeScolaire;
use App\Models\Note;
use App\Models\Absence;
use App\Models\Salle;
use App\Models\EmploiDuTemps;
use App\Models\Role;
use App\Models\ParentEleve;
use App\Models\Paiement;
use App\Models\Transport;
use App\Models\Cantine;
use App\Models\Menu;
use App\Models\Chauffeur;
use App\Models\Accompagnateur;
use App\Models\Activite;
use App\Traits\HandlesActiveRecords;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AdminSoftDeleteController extends Controller
{
    use HandlesActiveRecords;

    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!$request->user() || !$request->user()->isSuperAdmin()) {
                abort(403, 'Accès refusé. Seuls les super administrateurs peuvent accéder à cette fonctionnalité.');
            }
            return $next($request);
        });
    }

    public function index(Request $request): JsonResponse
    {
        $model = $request->input('model');
        
        // Gestion spéciale pour les emplois du temps (regroupés par classe)
        if ($model === 'emplois_du_temps') {
            return $this->getDeletedTimetablesByClass($request);
        }
        
        $models = [
            'users' => User::class,
            'eleves' => Eleve::class,
            'classes' => Classe::class,
            'professeurs' => Professeur::class,
            'matieres' => Matiere::class,
            'niveaux' => Niveau::class,
            'annees_scolaires' => AnneeScolaire::class,
            'notes' => Note::class,
            'absences' => Absence::class,
            'salles' => Salle::class,
            'emplois_du_temps' => EmploiDuTemps::class,
            'roles' => Role::class,
            'parents' => ParentEleve::class,
            'paiements' => Paiement::class,
            'transports' => Transport::class,
            'cantines' => Cantine::class,
            'menus' => Menu::class,
            'chauffeurs' => Chauffeur::class,
            'accompagnateurs' => Accompagnateur::class,
            'activites' => Activite::class,
        ];

        if (!$model || !isset($models[$model])) {
            return response()->json([
                'message' => 'Modèle non valide',
                'available_models' => array_keys($models)
            ], 400);
        }

        $modelClass = $models[$model];
        $query = $modelClass::inactive();

        // Pour les users, exclure les professeurs et les élèves (ne montrer que admin/super_admin)
        if ($model === 'users') {
            $professeurRole = Role::where('type', 'professeur')->first();
            $eleveRole = Role::where('type', 'eleve')->first();
            $excludedRoleIds = [];
            
            if ($professeurRole) {
                $excludedRoleIds[] = $professeurRole->id;
            }
            if ($eleveRole) {
                $excludedRoleIds[] = $eleveRole->id;
            }
            
            if (!empty($excludedRoleIds)) {
                $query->whereNotIn('role_id', $excludedRoleIds);
            }
            
            // Charger la relation role
            $query->with('role');
        }

        // Charger les relations spécifiques selon le modèle
        if ($model === 'eleves') {
            $query->with(['classe', 'classe.niveau', 'cantine', 'transport']);
        } elseif ($model === 'absences') {
            $query->with(['eleve', 'professeur', 'matiere']);
        } elseif ($model === 'activites') {
            $query->with(['responsable']);
        } elseif ($model === 'professeurs') {
            // Ne rien charger de spécial pour les professeurs, juste les données de la table professeurs
        }

        $perPage = (int) $request->input('per_page', 15);
        $results = $query->paginate($perPage);

        // Map items to a simplified representation with a computed name
        $items = array_map(function ($item) use ($model) {
            $name = null;
            switch ($model) {
                case 'users':
                    $name = $item->nom_complet ?? $item->name ?? $item->email ?? null;
                    break;
                case 'eleves':
                    $name = trim(($item->nom_fr ?? $item->nom ?? '') . ' ' . ($item->prenom_fr ?? $item->prenom ?? '')) ?: ($item->cne ?? null);
                    break;
                case 'classes':
                    $name = $item->nom ?? null;
                    break;
                case 'professeurs':
                    $name = trim(($item->nom ?? '') . ' ' . ($item->prenom ?? '')) ?: ($item->email ?? null);
                    break;
                case 'matieres':
                    $name = $item->nom ?? $item->code ?? null;
                    break;
                case 'niveaux':
                    $name = $item->nom ?? ('Niveau #' . $item->id);
                    break;
                case 'annees_scolaires':
                    $name = $item->nom ?? (isset($item->annee_debut, $item->annee_fin) ? ($item->annee_debut . '-' . $item->annee_fin) : null);
                    break;
                case 'notes':
                    $name = 'Note #' . $item->id;
                    break;
                case 'absences':
                    $name = 'Absence #' . $item->id;
                    break;
                case 'salles':
                    $name = $item->nom ?? null;
                    break;
                case 'roles':
                    $name = $item->type ?? ('Rôle #' . $item->id);
                    break;
                case 'parents':
                    $name = trim(($item->nom ?? '') . ' ' . ($item->prenom ?? '')) ?: ($item->telephone ?? null);
                    break;
                case 'paiements':
                    $name = 'Paiement #' . $item->id;
                    break;
                case 'transports':
                    $name = $item->ligne ?? ('Transport #' . $item->id);
                    break;
                case 'cantines':
                    $name = $item->nom ?? ('Cantine #' . $item->id);
                    break;
                case 'menus':
                    $name = $item->plat_principal ?? ('Menu #' . $item->id);
                    break;
                case 'chauffeurs':
                    $name = trim(($item->nom ?? '') . ' ' . ($item->prenom ?? '')) ?: ($item->telephone ?? null);
                    break;
                case 'accompagnateurs':
                    $name = trim(($item->nom ?? '') . ' ' . ($item->prenom ?? '')) ?: ($item->telephone ?? null);
                    break;
                case 'activites':
                    $name = $item->nom ?? ('Activité #' . $item->id);
                    break;
            }

            $data = [
                'id' => $item->id,
                'model' => $model,
                'name' => $name,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
            ];

            // Ajouter les données spécifiques selon le modèle
            if ($model === 'niveaux') {
                $data = array_merge($data, [
                    'nom' => $item->nom,
                    'description' => $item->description,
                    'active' => $item->active,
                ]);
            } elseif ($model === 'professeurs') {
                // Ajouter tous les champs du professeur pour l'affichage dans le modal
                $data = array_merge($data, [
                    'nom' => $item->nom,
                    'prenom' => $item->prenom,
                    'email' => $item->email,
                    'telephone' => $item->telephone,
                    'date_embauche' => $item->date_embauche,
                    'salaire' => $item->salaire,
                    'active' => $item->active,
                ]);
            }

            return $data;
        }, $results->items());

        return response()->json([
            'success' => true,
            'model' => $model,
            'data' => $items,
            'meta' => [
                'current_page' => $results->currentPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
                'last_page' => $results->lastPage(),
            ],
        ]);
    }

    public function show(Request $request): JsonResponse
    {
        $model = $request->input('model');
        $id = $request->input('id');

        // Gestion spéciale pour les emplois du temps (récupérer les détails d'une classe)
        if ($model === 'emplois_du_temps') {
            return $this->getTimetableDetailsByClass($id);
        }

        $models = [
            'users' => User::class,
            'eleves' => Eleve::class,
            'classes' => Classe::class,
            'professeurs' => Professeur::class,
            'matieres' => Matiere::class,
            'niveaux' => Niveau::class,
            'annees_scolaires' => AnneeScolaire::class,
            'notes' => Note::class,
            'absences' => Absence::class,
            'salles' => Salle::class,
            'emplois_du_temps' => EmploiDuTemps::class,
            'roles' => Role::class,
            'parents' => ParentEleve::class,
            'paiements' => Paiement::class,
            'transports' => Transport::class,
            'cantines' => Cantine::class,
            'menus' => Menu::class,
            'chauffeurs' => Chauffeur::class,
            'accompagnateurs' => Accompagnateur::class,
            'activites' => Activite::class,
        ];

        if (!$model || !isset($models[$model]) || !$id) {
            return response()->json([
                'success' => false,
                'message' => 'Paramètres invalides'
            ], 400);
        }

        $modelClass = $models[$model];
        $query = $modelClass::withoutGlobalScope('active');

        // Charger les relations spécifiques selon le modèle
        if ($model === 'absences') {
            $query->with(['eleve', 'professeur', 'matiere']);
        } elseif ($model === 'eleves') {
            $query->with(['classe', 'classe.niveau', 'cantine', 'transport']);
        } elseif ($model === 'activites') {
            $query->with(['responsable']);
        }

        $record = $query->find($id);

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Enregistrement introuvable'
            ], 404);
        }

        // Ajouter les données spécifiques selon le modèle
        $data = $record->toArray();
        
        // Pour les professeurs, ne montrer que les données de la table professeurs (pas le user associé)
        if ($model === 'professeurs') {
            // Garder uniquement les champs de la table professeurs
            $professeurFields = ['id', 'nom', 'prenom', 'email', 'telephone', 'date_embauche', 'salaire', 'active', 'created_at', 'updated_at'];
            $data = array_intersect_key($data, array_flip($professeurFields));
        }
        
        // Supprimer les objets de relations pour éviter les doublons
        if ($model === 'absences') {
            unset($data['eleve'], $data['professeur'], $data['matiere']);
            $data['eleve_nom'] = $record->eleve ? ($record->eleve->prenom_fr . ' ' . $record->eleve->nom_fr) : null;
            $data['professeur_nom'] = $record->professeur ? ($record->professeur->prenom . ' ' . $record->professeur->nom) : null;
            $data['matiere_nom'] = $record->matiere?->nom ?? null;
        } elseif ($model === 'activites') {
            unset($data['responsable']);
            $data['responsable_nom'] = $record->responsable ? trim(($record->responsable->prenom ?? '') . ' ' . ($record->responsable->nom ?? '')) : null;
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function restore(Request $request): JsonResponse
    {
        $model = $request->input('model');
        $id = $request->input('id');

        // Gestion spéciale pour les emplois du temps (restaurer toutes les séances d'une classe)
        if ($model === 'emplois_du_temps') {
            return $this->restoreTimetableByClass($id);
        }

        $models = [
            'users' => User::class,
            'eleves' => Eleve::class,
            'classes' => Classe::class,
            'professeurs' => Professeur::class,
            'matieres' => Matiere::class,
            'niveaux' => Niveau::class,
            'annees_scolaires' => AnneeScolaire::class,
            'notes' => Note::class,
            'absences' => Absence::class,
            'salles' => Salle::class,
            'emplois_du_temps' => EmploiDuTemps::class,
            'roles' => Role::class,
            'parents' => ParentEleve::class,
            'paiements' => Paiement::class,
            'transports' => Transport::class,
            'cantines' => Cantine::class,
            'menus' => Menu::class,
            'chauffeurs' => Chauffeur::class,
            'accompagnateurs' => Accompagnateur::class,
            'activites' => Activite::class,
        ];

        if (!$model || !isset($models[$model])) {
            return response()->json([
                'message' => 'Modèle non valide'
            ], 400);
        }

        $modelClass = $models[$model];
        $record = $modelClass::inactive()->find($id);

        if (!$record) {
            return response()->json([
                'message' => 'Enregistrement non trouvé ou déjà actif'
            ], 404);
        }

        try {
            // Gestion spéciale pour les professeurs : restaurer aussi le user associé
            if ($model === 'professeurs') {
                DB::transaction(function () use ($record) {
                    // Restaurer le professeur
                    $record->restore();

                    // Trouver le User associé via nom + prénom + rôle professeur
                    // L'email de contact peut être différent de l'email de connexion
                    $professeurRole = Role::where('type', 'professeur')->first();
                    if ($professeurRole) {
                        $user = User::where('nom', $record->nom)
                            ->where('prenom', $record->prenom)
                            ->where('role_id', $professeurRole->id)
                            ->first();
                        
                        if ($user) {
                            // Mettre active à 1 dans users
                            $user->update(['active' => true]);
                            
                            // S'assurer que le rôle professeur est bien assigné
                            $user->update(['role_id' => $professeurRole->id]);
                        }
                    }
                });
            } elseif ($model === 'eleves') {
                // Gestion spéciale pour les élèves : restaurer l'élève ET le user associé
                DB::transaction(function () use ($record) {
                    // Restaurer l'élève
                    $record->restore();

                    // Trouver le User associé via email (matricule@ecole.ma) ou nom + prénom + rôle élève
                    $eleveRole = Role::where('type', 'eleve')->first();
                    if ($eleveRole) {
                        $user = null;
                        
                        // Essayer d'abord par email (matricule@ecole.ma)
                        if ($record->matricule) {
                            $loginEmail = strtolower($record->matricule) . '@ecole.ma';
                            $user = User::where('role_id', $eleveRole->id)
                                ->where('email', $loginEmail)
                                ->first();
                        }
                        
                        // Fallback par nom/prénom FR si email ne fonctionne pas
                        if (!$user && $record->nom_fr && $record->prenom_fr) {
                            $user = User::where('role_id', $eleveRole->id)
                                ->where('nom', $record->nom_fr)
                                ->where('prenom', $record->prenom_fr)
                                ->first();
                        }
                        
                        if ($user) {
                            // Mettre active à 1 dans users (restaurer le compte)
                            $user->update(['active' => true]);
                            
                            // S'assurer que le rôle élève est bien assigné
                            $user->update(['role_id' => $eleveRole->id]);
                        }
                    }
                });
            } else {
                $record->restore();
            }

            // Générer un message personnalisé selon le type d'enregistrement
            $message = $this->getRestoreMessage($model, $record);

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $record
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la restauration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function forceDelete(Request $request): JsonResponse
    {
        $model = $request->input('model');
        $id = $request->input('id');

        // Gestion spéciale pour les emplois du temps (supprimer toutes les séances d'une classe)
        if ($model === 'emplois_du_temps') {
            return $this->forceDeleteTimetableByClass($id);
        }

        $models = [
            'users' => User::class,
            'eleves' => Eleve::class,
            'classes' => Classe::class,
            'professeurs' => Professeur::class,
            'matieres' => Matiere::class,
            'annees_scolaires' => AnneeScolaire::class,
            'notes' => Note::class,
            'absences' => Absence::class,
            'salles' => Salle::class,
            'emplois_du_temps' => EmploiDuTemps::class,
            'roles' => Role::class,
            'parents' => ParentEleve::class,
            'paiements' => Paiement::class,
            'transports' => Transport::class,
            'cantines' => Cantine::class,
            'menus' => Menu::class,
            'chauffeurs' => Chauffeur::class,
            'accompagnateurs' => Accompagnateur::class,
            'activites' => Activite::class,
        ];

        if (!$model || !isset($models[$model])) {
            return response()->json([
                'message' => 'Modèle non valide'
            ], 400);
        }

        $modelClass = $models[$model];
        $record = $modelClass::inactive()->find($id);

        if (!$record) {
            return response()->json([
                'message' => 'Enregistrement non trouvé'
            ], 404);
        }

        try {
            $record->delete(); // Suppression physique

            // Générer un message personnalisé selon le type d'enregistrement
            $message = $this->getForceDeleteMessage($model, $record);

            return response()->json([
                'success' => true,
                'message' => $message
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression définitive',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function stats(): JsonResponse
    {
        // Compter les emplois du temps par classe (pas par séance)
        $deletedSessions = EmploiDuTemps::inactive()->get();
        $groupedByClass = $deletedSessions->groupBy('classe_id');
        $timetablesCount = $groupedByClass->count();

        // Compter les users sans les professeurs et les élèves (seulement admin/super_admin)
        $professeurRole = Role::where('type', 'professeur')->first();
        $eleveRole = Role::where('type', 'eleve')->first();
        $excludedRoleIds = [];
        if ($professeurRole) {
            $excludedRoleIds[] = $professeurRole->id;
        }
        if ($eleveRole) {
            $excludedRoleIds[] = $eleveRole->id;
        }
        $usersCount = User::inactive()->whereNotIn('role_id', $excludedRoleIds)->count();

        $stats = [
            'users' => $usersCount,
            'eleves' => $this->safeInactiveCount(Eleve::class),
            'classes' => $this->safeInactiveCount(Classe::class),
            'professeurs' => $this->safeInactiveCount(Professeur::class),
            'matieres' => $this->safeInactiveCount(Matiere::class),
            'niveaux' => $this->safeInactiveCount(Niveau::class),
            'annees_scolaires' => $this->safeInactiveCount(AnneeScolaire::class),
            'notes' => $this->safeInactiveCount(Note::class),
            'absences' => $this->safeInactiveCount(Absence::class),
            'salles' => $this->safeInactiveCount(Salle::class),
            'emplois_du_temps' => $timetablesCount,
            'roles' => $this->safeInactiveCount(Role::class),
            'parents' => $this->safeInactiveCount(ParentEleve::class),
            'paiements' => $this->safeInactiveCount(Paiement::class),
            'transports' => $this->safeInactiveCount(Transport::class),
            'cantines' => $this->safeInactiveCount(Cantine::class),
            'menus' => $this->safeInactiveCount(Menu::class),
            'chauffeurs' => $this->safeInactiveCount(Chauffeur::class),
            'accompagnateurs' => $this->safeInactiveCount(Accompagnateur::class),
            'activites' => $this->safeInactiveCount(Activite::class),
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'total' => array_sum($stats)
        ]);
    }

    private function safeInactiveCount(string $modelClass): int
    {
        if (!class_exists($modelClass)) {
            return 0;
        }

        $model = new $modelClass;

        if (!Schema::hasColumn($model->getTable(), 'active')) {
            return 0;
        }

        return $modelClass::inactive()->count();
    }

    /**
     * Générer un message personnalisé pour la restauration
     */
    private function getRestoreMessage(string $model, $record): string
    {
        switch ($model) {
            case 'cantines':
                return 'Cantine "' . $record->nom . '" a été restaurée avec succès';
            case 'menus':
                return 'Menu "' . $record->plat_principal . '" du ' . $record->jour . ' a été restauré avec succès';
            case 'users':
                return 'Utilisateur "' . ($record->nom_complet ?? $record->name ?? $record->email) . '" a été restauré avec succès';
            case 'eleves':
                return 'Élève "' . trim(($record->nom ?? '') . ' ' . ($record->prenom ?? '')) . '" a été restauré avec succès';
            case 'classes':
                return 'Classe "' . $record->nom . '" a été restaurée avec succès';
            case 'professeurs':
                return 'Professeur "' . trim(($record->nom ?? '') . ' ' . ($record->prenom ?? '')) . '" a été restauré avec succès';
            case 'matieres':
                return 'Matière "' . ($record->nom ?? $record->code) . '" a été restaurée avec succès';
            case 'niveaux':
                return 'Niveau "' . $record->nom . '" a été restauré avec succès';
            case 'annees_scolaires':
                return 'Année scolaire "' . ($record->nom ?? ($record->annee_debut . '-' . $record->annee_fin)) . '" a été restaurée avec succès';
            case 'salles':
                return 'Salle "' . $record->nom . '" a été restaurée avec succès';
            case 'roles':
                return 'Rôle "' . $record->type . '" a été restauré avec succès';
            case 'parents':
                return 'Parent "' . trim(($record->nom ?? '') . ' ' . ($record->prenom ?? '')) . '" a été restauré avec succès';
            case 'transports':
                return 'Transport "' . ($record->ligne ?? 'Transport #' . $record->id) . '" a été restauré avec succès';
            case 'chauffeurs':
                return 'Chauffeur "' . trim(($record->nom ?? '') . ' ' . ($record->prenom ?? '')) . '" a été restauré avec succès';
            case 'accompagnateurs':
                return 'Accompagnateur "' . trim(($record->nom ?? '') . ' ' . ($record->prenom ?? '')) . '" a été restauré avec succès';
            case 'activites':
                return 'Activité "' . $record->nom . '" a été restaurée avec succès';
            default:
                return 'Enregistrement restauré avec succès';
        }
    }

    /**
     * Générer un message personnalisé pour la suppression définitive
     */
    private function getForceDeleteMessage(string $model, $record): string
    {
        switch ($model) {
            case 'cantines':
                return 'Cantine "' . $record->nom . '" a été supprimée définitivement';
            case 'menus':
                return 'Menu "' . $record->plat_principal . '" du ' . $record->jour . ' a été supprimé définitivement';
            case 'users':
                return 'Utilisateur "' . ($record->nom_complet ?? $record->name ?? $record->email) . '" a été supprimé définitivement';
            case 'eleves':
                return 'Élève "' . trim(($record->nom ?? '') . ' ' . ($record->prenom ?? '')) . '" a été supprimé définitivement';
            case 'classes':
                return 'Classe "' . $record->nom . '" a été supprimée définitivement';
            case 'professeurs':
                return 'Professeur "' . trim(($record->nom ?? '') . ' ' . ($record->prenom ?? '')) . '" a été supprimé définitivement';
            case 'matieres':
                return 'Matière "' . ($record->nom ?? $record->code) . '" a été supprimée définitivement';
            case 'niveaux':
                return 'Niveau "' . $record->nom . '" a été supprimé définitivement';
            case 'annees_scolaires':
                return 'Année scolaire "' . ($record->nom ?? ($record->annee_debut . '-' . $record->annee_fin)) . '" a été supprimée définitivement';
            case 'salles':
                return 'Salle "' . $record->nom . '" a été supprimée définitivement';
            case 'roles':
                return 'Rôle "' . $record->type . '" a été supprimé définitivement';
            case 'parents':
                return 'Parent "' . trim(($record->nom ?? '') . ' ' . ($record->prenom ?? '')) . '" a été supprimé définitivement';
            case 'transports':
                return 'Transport "' . ($record->ligne ?? 'Transport #' . $record->id) . '" a été supprimé définitivement';
            case 'chauffeurs':
                return 'Chauffeur "' . trim(($record->nom ?? '') . ' ' . ($record->prenom ?? '')) . '" a été supprimé définitivement';
            case 'accompagnateurs':
                return 'Accompagnateur "' . trim(($record->nom ?? '') . ' ' . ($record->prenom ?? '')) . '" a été supprimé définitivement';
            case 'activites':
                return 'Activité "' . $record->nom . '" a été supprimée définitivement';
            case 'emplois_du_temps':
                return 'Emploi du temps de la classe "' . ($record->classe_nom ?? 'Classe #' . $record->classe_id) . '" a été supprimé définitivement';
            default:
                return 'Enregistrement supprimé définitivement';
        }
    }

    /**
     * Récupérer les emplois du temps supprimés regroupés par classe
     */
    private function getDeletedTimetablesByClass(Request $request): JsonResponse
    {
        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 15);
        
        // Récupérer les séances supprimées avec les informations de classe
        $deletedSessions = EmploiDuTemps::inactive()
            ->with('classe')
            ->orderBy('updated_at', 'desc')
            ->get();
        
        // Regrouper par classe
        $groupedByClass = $deletedSessions->groupBy('classe_id');
        
        $classData = [];
        foreach ($groupedByClass as $classeId => $sessions) {
            $classe = $sessions->first()->classe;
            $classData[] = [
                'id' => $classeId,
                'model' => 'emplois_du_temps',
                'name' => $classe ? ($classe->nom_complet ?? $classe->nom) : "Classe #{$classeId}",
                'created_at' => $sessions->first()->created_at,
                'updated_at' => $sessions->first()->updated_at,
                'sessions_count' => $sessions->count(),
                'classe_nom' => $classe ? ($classe->nom_complet ?? $classe->nom) : "Classe #{$classeId}",
                'classe_niveau' => $classe ? $classe->niveau : null,
                'classe_section' => $classe ? $classe->section : null,
            ];
        }
        
        // Pagination manuelle
        $total = count($classData);
        $offset = ($page - 1) * $perPage;
        $paginatedData = array_slice($classData, $offset, $perPage);
        
        return response()->json([
            'success' => true,
            'model' => 'emplois_du_temps',
            'data' => $paginatedData,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => ceil($total / $perPage),
            ],
        ]);
    }

    /**
     * Restaurer toutes les séances d'une classe
     */
    private function restoreTimetableByClass(int $classeId): JsonResponse
    {
        $sessionsCount = EmploiDuTemps::where('classe_id', $classeId)
            ->inactive()
            ->update(['active' => true]);

        if ($sessionsCount === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune séance supprimée trouvée pour cette classe'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => "Emploi du temps de la classe restauré ({$sessionsCount} séances)"
        ]);
    }

    /**
     * Supprimer définitivement toutes les séances d'une classe
     */
    private function forceDeleteTimetableByClass(int $classeId): JsonResponse
    {
        $sessionsCount = EmploiDuTemps::where('classe_id', $classeId)
            ->inactive()
            ->count();

        if ($sessionsCount === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune séance supprimée trouvée pour cette classe'
            ], 404);
        }

        EmploiDuTemps::where('classe_id', $classeId)
            ->inactive()
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "Emploi du temps de la classe supprimé définitivement ({$sessionsCount} séances)"
        ]);
    }

    /**
     * Récupérer les détails d'un emploi du temps par classe
     */
    private function getTimetableDetailsByClass(int $classeId): JsonResponse
    {
        // Récupérer les séances supprimées de cette classe
        $sessions = EmploiDuTemps::where('classe_id', $classeId)
            ->inactive()
            ->with(['classe', 'matiere', 'professeur', 'salle'])
            ->orderBy('jour')
            ->orderBy('heure_debut')
            ->get();

        if ($sessions->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune séance supprimée trouvée pour cette classe'
            ], 404);
        }

        $classe = $sessions->first()->classe;
        
        // Créer un objet représentant l'emploi du temps de la classe
        $timetableData = [
            'id' => $classeId,
            'model' => 'emplois_du_temps',
            'name' => $classe ? ($classe->nom_complet ?? $classe->nom) : "Classe #{$classeId}",
            'created_at' => $sessions->first()->created_at,
            'updated_at' => $sessions->first()->updated_at,
            'sessions_count' => $sessions->count(),
            'classe_nom' => $classe ? ($classe->nom_complet ?? $classe->nom) : "Classe #{$classeId}",
            'classe_niveau' => $classe ? $classe->niveau : null,
            'classe_section' => $classe ? $classe->section : null,
            'sessions' => $sessions->map(function ($session) {
                return [
                    'id' => $session->id,
                    'jour' => $session->jour,
                    'heure_debut' => $session->heure_debut,
                    'heure_fin' => $session->heure_fin,
                    'matiere_nom' => $session->matiere ? $session->matiere->nom : 'N/A',
                    'professeur_nom' => $session->professeur ? trim($session->professeur->nom . ' ' . $session->professeur->prenom) : 'N/A',
                    'salle_nom' => $session->salle ? $session->salle->nom : 'N/A',
                ];
            })
        ];

        return response()->json([
            'success' => true,
            'data' => $timetableData,
        ]);
    }
}