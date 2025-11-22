<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EleveController;
use App\Http\Controllers\ParentEleveController;
use App\Http\Controllers\ProfesseurController;
use App\Http\Controllers\ClasseController;
use App\Http\Controllers\AnneeScolaireClasseController;
use App\Http\Controllers\MatiereController;
use App\Http\Controllers\EmploiDuTempsController;
use App\Http\Controllers\CantineController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\SalleController;
use App\Http\Controllers\TransportController;
use App\Http\Controllers\ChauffeurController;
use App\Http\Controllers\AccompagnateurController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\ActiviteController;
use App\Http\Controllers\SmsController;
use App\Http\Controllers\AnneeScolaireController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\AdminSoftDeleteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AbsenceController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\NiveauController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Routes d'authentification (publiques)
Route::post('/auth/login', [AuthController::class, 'login'])->middleware(['api-session', 'clean.json']);

// Routes supprimées - déplacées dans la section protégée pour la sécurité

// Routes protégées par session
Route::middleware(['api-session', 'api.auth'])->group(function () {
    // Routes d'authentification
    Route::get('/auth/me', [AuthController::class, 'me'])->middleware('clean.json');
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('clean.json');
    Route::post('/auth/refresh', [AuthController::class, 'refresh'])->middleware('clean.json');
    
    // Routes pour le compte utilisateur
    Route::prefix('account')->group(function () {
        Route::get('/profile', [AccountController::class, 'profile'])->middleware('clean.json');
        Route::put('/profile', [AccountController::class, 'updateProfile'])->middleware('clean.json');
        Route::put('/password', [AccountController::class, 'updatePassword'])->middleware('clean.json');
        Route::get('/statistics', [AccountController::class, 'statistics'])->middleware('clean.json');
    });
    
    // Routes pour les utilisateurs
    Route::apiResource('users', UserController::class);
    Route::post('/users/{user}/restore', [UserController::class, 'restore'])->middleware('clean.json');
    
    // Routes pour les rôles (admin seulement)
    Route::middleware(['admin.only'])->group(function () {
        Route::apiResource('roles', RoleController::class);
    });

        // Gestion des administrateurs (super admin uniquement)
        Route::middleware(['superadmin.only'])->group(function () {
            Route::get('/admins', [\App\Http\Controllers\AdminManagementController::class, 'index'])->middleware('clean.json');
            Route::post('/admins', [\App\Http\Controllers\AdminManagementController::class, 'store'])->middleware('clean.json');
            Route::get('/admins/{user}', [\App\Http\Controllers\AdminManagementController::class, 'show'])->middleware('clean.json');
            Route::put('/admins/{user}', [\App\Http\Controllers\AdminManagementController::class, 'update'])->middleware('clean.json');
            Route::delete('/admins/{user}', [\App\Http\Controllers\AdminManagementController::class, 'destroy'])->middleware('clean.json');
            Route::post('/admins/{user}/reset-password', [\App\Http\Controllers\AdminManagementController::class, 'resetPassword'])->middleware('clean.json');
            
            // Gestion des enregistrements supprimés (soft delete)
            Route::prefix('deleted')->group(function () {
                Route::get('/', [AdminSoftDeleteController::class, 'index'])->middleware('clean.json');
                Route::get('/show', [AdminSoftDeleteController::class, 'show'])->middleware('clean.json');
                Route::get('/stats', [AdminSoftDeleteController::class, 'stats'])->middleware('clean.json');
                Route::post('/restore', [AdminSoftDeleteController::class, 'restore'])->middleware('clean.json');
                Route::delete('/force-delete', [AdminSoftDeleteController::class, 'forceDelete'])->middleware('clean.json');
            });
        });

    // Routes API v1 - Modules principaux
    Route::prefix('v1')->group(function () {
        
        // ============ DASHBOARD OPTIMISÉ ============
        Route::get('/dashboard/statistics', [DashboardController::class, 'statistics'])->middleware(['clean.json', 'annee.scolaire']);
        
        // ============ GESTION DES ANNÉES SCOLAIRES ============
        
        // Route publique pour l'année active (utilisée pour le filtrage)
        Route::get('/annees-scolaires/active', [AnneeScolaireController::class, 'active'])->middleware('clean.json');
        
        // Route pour récupérer les années scolaires avec statut=1 (accessible à tous les utilisateurs authentifiés)
        Route::get('/annees-scolaires/with-statut', [AnneeScolaireController::class, 'withStatut'])->middleware('clean.json');
        
        // Routes réservées au super admin uniquement
        Route::middleware(['superadmin.only'])->group(function () {
            Route::get('/annees-scolaires', [AnneeScolaireController::class, 'index'])->middleware('clean.json');
            Route::get('/annees-scolaires/{anneeScolaire}', [AnneeScolaireController::class, 'show'])->middleware('clean.json');
            Route::get('/annees-scolaires/{anneeScolaire}/statistics', [AnneeScolaireController::class, 'statistics'])->middleware('clean.json');
            Route::post('/annees-scolaires', [AnneeScolaireController::class, 'store'])->middleware('clean.json');
            Route::put('/annees-scolaires/{anneeScolaire}', [AnneeScolaireController::class, 'update'])->middleware('clean.json');
            Route::delete('/annees-scolaires/{anneeScolaire}', [AnneeScolaireController::class, 'destroy'])->middleware('clean.json');
            Route::put('/annees-scolaires/{anneeScolaire}/activer', [AnneeScolaireController::class, 'activer'])->middleware('clean.json');
        });
        
        // ============ ÉTAPE 2 FINALISÉE ============
        
        // Routes pour les élèves (routes spécifiques AVANT les routes de ressource)
        Route::get('/eleves/check-duplicate', [EleveController::class, 'checkDuplicate'])->middleware('clean.json');
        Route::get('/eleves/filter-options', [EleveController::class, 'filterOptions'])->middleware('clean.json');
        Route::apiResource('eleves', EleveController::class)->parameters(['eleves' => 'eleve']);
        Route::post('/eleves/{eleve}/restore', [EleveController::class, 'restore'])->middleware('clean.json');
        Route::post('/eleves/{eleve}/reset-password', [EleveController::class, 'resetPassword'])->middleware('clean.json');
        Route::get('/eleves/{eleve}/parents', [EleveController::class, 'parents']);
        Route::post('/eleves/{eleve}/parents', [EleveController::class, 'attachParent']);
        Route::get('/eleves/{eleve}/notes', [EleveController::class, 'notes']);
        
        // Routes pour la gestion des photos de profil
        Route::post('/eleves/{eleve}/photo', [EleveController::class, 'uploadPhoto']);
        Route::delete('/eleves/{eleve}/photo', [EleveController::class, 'deletePhoto']);
        Route::get('/eleves/{eleve}/photo-url', [EleveController::class, 'getPhotoUrl']);

        // Routes pour les parents
        Route::apiResource('parents', ParentEleveController::class);
        Route::post('/parents/{parent}/restore', [ParentEleveController::class, 'restore']);
        Route::get('/parents/{parent}/eleves', [ParentEleveController::class, 'eleves']);

        // Routes pour l'inscription complète
        Route::post('/enrollment', [EnrollmentController::class, 'store']);
        Route::post('/enrollment/step2', [EnrollmentController::class, 'storeStep2']); // Étape 2 avec parents existants
        Route::get('/enrollment/options', [EnrollmentController::class, 'options']);
        Route::get('/enrollment/statistics', [EnrollmentController::class, 'statistics']);
        Route::get('/enrollment/search-parents', [EnrollmentController::class, 'searchParents']);

        // Routes pour les professeurs
        Route::get('professeurs', [ProfesseurController::class, 'index'])->middleware('clean.json');
        Route::get('professeurs/{professeur}', [ProfesseurController::class, 'show'])->middleware('clean.json');
        Route::post('professeurs', [ProfesseurController::class, 'store']);
        Route::put('professeurs/{professeur}', [ProfesseurController::class, 'update']);
        Route::delete('professeurs/{professeur}', [ProfesseurController::class, 'destroy']);
        Route::post('professeurs/{professeur}/restore', [ProfesseurController::class, 'restore']);
        Route::post('professeurs/{professeur}/reset-password', [ProfesseurController::class, 'resetPassword']);
        Route::get('/professeurs/{professeur}/classes', [ProfesseurController::class, 'classes']);
        Route::get('/professeurs/{professeur}/matieres', [ProfesseurController::class, 'matieres']);

        // Routes pour les classes - Gestion complète
        Route::apiResource('classes', ClasseController::class)->parameters(['classes' => 'classe']);
        
        // Gestion des élèves dans les classes
        Route::get('/classes/{classe}/eleves', [ClasseController::class, 'eleves']);
        Route::post('/classes/{classe}/inscrire-eleve', [ClasseController::class, 'inscrireEleve']);
        Route::delete('/classes/{classe}/desinscrire-eleve/{eleve}', [ClasseController::class, 'desinscrireEleve']);
        
        // Gestion des professeurs dans les classes
        Route::get('/classes/{classe}/professeurs', [ClasseController::class, 'professeurs']);
        Route::post('/classes/{classe}/assigner-professeur', [ClasseController::class, 'assignerProfesseur']);
        Route::delete('/classes/{classe}/retirer-professeur/{professeur}', [ClasseController::class, 'retirerProfesseur']);
        Route::post('/classes/{classe}/professeur-principal', [ClasseController::class, 'definirProfesseurPrincipal']);
        
        // Gestion des matières dans les classes
        Route::get('/classes/{classe}/matieres', [ClasseController::class, 'matieres']);
        
        // Statistiques et rapports
        Route::get('/classes/{classe}/statistiques', [ClasseController::class, 'statistiques']);
        Route::post('/classes/{classe}/toggle-active', [ClasseController::class, 'toggleActive']);
        
        // Gestion par année scolaire
        Route::get('/annees-scolaires/{anneeScolaire}/classes', [ClasseController::class, 'parAnneeScolaire']);
        
        // Routes spécialisées pour la gestion des classes par année scolaire
        Route::prefix('annees-scolaires/{anneeScolaire}')->group(function () {
            Route::get('/classes-detaillees', [AnneeScolaireClasseController::class, 'index']);
            Route::post('/classes', [AnneeScolaireClasseController::class, 'store']);
            Route::post('/classes/dupliquer', [AnneeScolaireClasseController::class, 'dupliquer']);
            Route::get('/classes/statistiques', [AnneeScolaireClasseController::class, 'statistiques']);
            Route::post('/classes/archiver', [AnneeScolaireClasseController::class, 'archiver']);
            Route::post('/classes/reactiver', [AnneeScolaireClasseController::class, 'reactiver']);
        });

        // Routes pour les matières
        Route::apiResource('matieres', MatiereController::class);
        Route::get('/matieres/active', [MatiereController::class, 'active'])->middleware('clean.json');

        // Routes pour les périodes
        Route::apiResource('periodes', \App\Http\Controllers\PeriodeController::class)->middleware('clean.json');
        Route::get('/periodes/active', [\App\Http\Controllers\PeriodeController::class, 'active'])->middleware('clean.json');
        Route::get('/annees-scolaires/{anneeScolaireId}/periodes', [\App\Http\Controllers\PeriodeController::class, 'getByAnneeScolaire'])->middleware('clean.json');


        // Niveaux & Contrôles (listes pour formulaires)
        Route::apiResource('niveaux', NiveauController::class)->only(['index','store','show','update','destroy']);
        Route::apiResource('controles', \App\Http\Controllers\ControleController::class)->middleware('clean.json');
        
        // Contrôles pour une classe spécifique avec professeurs
        Route::get('/classes/{classeId}/controles', [\App\Http\Controllers\ControleController::class, 'getControlesForClasse'])->middleware('clean.json');
        
        


        // ============ ÉTAPE 3 - NOUVEAUX MODULES ============

        // 1. Gestion des Emplois du Temps
        Route::get('/professeurs/{professeur}/emplois-du-temps', [EmploiDuTempsController::class, 'professorSchedule']);
        
        // Routes pour les emplois du temps (sécurisées)
        Route::get('/professeurs-list', [ProfesseurController::class, 'listForTimetable'])->middleware('clean.json');
        Route::get('/matieres-list', [MatiereController::class, 'listForTimetable'])->middleware('clean.json');
        Route::get('/salles-list', [SalleController::class, 'listForTimetable'])->middleware('clean.json');
        Route::get('/classes/{classe}/emplois-du-temps', [EmploiDuTempsController::class, 'classeSchedule'])->middleware('clean.json');
        Route::delete('/classes/{classe}/emplois-du-temps', [EmploiDuTempsController::class, 'destroyByClasse']);
        
        // CRUD operations for timetables (sécurisées)
        Route::post('/emplois-du-temps', [EmploiDuTempsController::class, 'store']);
        Route::put('/emplois-du-temps/{emplois_du_temps}', [EmploiDuTempsController::class, 'update']);
        Route::delete('/emplois-du-temps/{emplois_du_temps}', [EmploiDuTempsController::class, 'destroy']);
        Route::post('/emplois-du-temps/{emplois_du_temps}/restore', [EmploiDuTempsController::class, 'restore'])->middleware('clean.json');

        // 2. Gestion Cantine & Menus
        Route::apiResource('cantines', CantineController::class);
        Route::apiResource('menus', MenuController::class);
        Route::post('/cantines/{cantine}/inscrire-eleve', [CantineController::class, 'inscrireEleve']);
        Route::delete('/cantines/{cantine}/desinscrire-eleve/{eleve}', [CantineController::class, 'desinscrireEleve']);

        // Salles
        Route::apiResource('salles', SalleController::class);
        Route::post('/salles/{salle}/restore', [SalleController::class, 'restore'])->middleware('clean.json');

        // 3. Gestion Transport Scolaire
        Route::apiResource('transports', TransportController::class);
        Route::apiResource('chauffeurs', ChauffeurController::class);
        Route::apiResource('accompagnateurs', AccompagnateurController::class);
        Route::post('/transports/{transport}/inscrire-eleve', [TransportController::class, 'inscrireEleve']);

        // 4. Gestion des Absences
        // Routes spécifiques AVANT la route resource pour éviter les conflits
        Route::get('/absences/consecutive-detection', [AbsenceController::class, 'getConsecutiveAbsencesDetection'])->middleware('clean.json');
        Route::get('/absences/export', [AbsenceController::class, 'export'])->middleware('clean.json');
        Route::get('/absences/stats', [AbsenceController::class, 'stats'])->middleware('clean.json');
        
        // Route resource pour les opérations CRUD
        Route::apiResource('absences', AbsenceController::class);
        
        // Routes spécifiques avec paramètres
        Route::post('/absences/{absence}/justify', [AbsenceController::class, 'justify'])->middleware('clean.json');
        Route::post('/absences/{absence}/unjustify', [AbsenceController::class, 'unjustify'])->middleware('clean.json');
        Route::get('/absences/{absence}/consecutive', [AbsenceController::class, 'getConsecutiveAbsences'])->middleware('clean.json');

        // 5. Gestion des Notes
        Route::get('/notes/statistics', [NoteController::class, 'statistics'])->middleware('clean.json');
        
        // Routes des frais scolaires et paiements
        Route::apiResource('frais-scolaires', \App\Http\Controllers\FraisScolaireController::class);
        Route::post('/frais-scolaires/generer-paiements', [\App\Http\Controllers\FraisScolaireController::class, 'genererPaiementsMensuels']);
        Route::get('/frais-scolaires/statistiques', [\App\Http\Controllers\FraisScolaireController::class, 'statistiques']);
        
        Route::apiResource('paiements-eleves', \App\Http\Controllers\PaiementEleveController::class)->except(['store', 'update', 'destroy']);
        Route::post('/paiements-eleves/{paiementEleve}/enregistrer-paiement', [\App\Http\Controllers\PaiementEleveController::class, 'enregistrerPaiement']);
        Route::get('/eleves/{eleve}/paiements', [\App\Http\Controllers\PaiementEleveController::class, 'paiementsEleve']);
        Route::get('/paiements-eleves/statistiques', [\App\Http\Controllers\PaiementEleveController::class, 'statistiques']);
Route::apiResource('notes', NoteController::class);
        
        Route::delete('/transports/{transport}/desinscrire-eleve/{eleve}', [TransportController::class, 'desinscrireEleve']);

        // 4. Gestion Paiements
        Route::apiResource('paiements', PaiementController::class);
        Route::get('/eleves/{eleve}/paiements', [PaiementController::class, 'elevePayments']);

        // 5. Gestion Activités Parascolaires
        Route::apiResource('activites', ActiviteController::class);
        Route::post('/activites/{activite}/restore', [ActiviteController::class, 'restore'])->middleware('clean.json');
        Route::post('/activites/{activite}/inscrire-eleve', [ActiviteController::class, 'inscrireEleve'])->middleware('clean.json');
        Route::delete('/activites/{activite}/desinscrire-eleve/{eleve}', [ActiviteController::class, 'desinscrireEleve'])->middleware('clean.json');
        Route::post('/activites/{activite}/eleves/{eleve}/presence', [ActiviteController::class, 'marquerPresence'])->middleware('clean.json');
        Route::get('/activites/{activite}/eleves', [ActiviteController::class, 'eleves'])->middleware('clean.json');
        Route::get('/activites/{activite}/statistiques', [ActiviteController::class, 'statistiques'])->middleware('clean.json');
        Route::get('/activites-options', [ActiviteController::class, 'options'])->middleware('clean.json');

        // 6. Notifications SMS (Admin uniquement)
        Route::middleware(['admin.only'])->group(function () {
            Route::post('/sms/send', [SmsController::class, 'send'])->middleware('clean.json');
            Route::get('/sms/history', [SmsController::class, 'history'])->middleware('clean.json');
        });

    });
});


