# 🎓 Système de Gestion d'École Privée

Un système complet de gestion scolaire développé avec Laravel (backend) et React + TypeScript (frontend). Cette application permet de gérer tous les aspects d'une école privée : élèves, professeurs, classes, notes, absences, paiements, transport, cantine, et bien plus.

## ✨ Fonctionnalités

### 👥 Gestion des utilisateurs
- **Multi-rôles** : Super Admin, Admin, Professeur, Élève
- Authentification sécurisée avec sessions
- Gestion des profils utilisateurs
- Réinitialisation de mot de passe

### 🎓 Gestion académique
- **Élèves** : Inscription, dossiers complets, photos, historique
- **Professeurs** : Gestion des enseignants et leurs matières
- **Classes** : Organisation par niveaux et années scolaires
- **Matières** : Configuration des matières enseignées
- **Notes** : Saisie et consultation des notes par période
- **Contrôles** : Gestion des examens et évaluations
- **Absences** : Suivi des absences élèves et professeurs avec justificatifs

### 📅 Emplois du temps
- Création et gestion des emplois du temps par classe
- Visualisation pour les professeurs
- Consultation pour les élèves
- Gestion des salles et disponibilités

### 💰 Gestion financière
- **Frais scolaires** : Configuration des frais par niveau
- **Paiements** : Suivi des paiements des élèves
- **Historique** : Consultation de l'historique des transactions
- Génération de reçus PDF

### 🚌 Services
- **Transport** : Gestion des véhicules, chauffeurs et accompagnateurs
- **Cantine** : Menus, inscriptions, suivi
- **Activités** : Activités extra-scolaires

### 📊 Tableau de bord
- Statistiques en temps réel
- Vue d'ensemble par année scolaire
- Indicateurs clés de performance

### 🗑️ Gestion avancée
- Soft delete avec possibilité de restauration (Super Admin)
- Gestion des années scolaires
- Exports et impressions PDF
- Mode sombre / clair

## 🛠️ Technologies utilisées

### Backend
- **Framework** : Laravel 12.x
- **PHP** : 8.2+
- **Base de données** : MySQL / SQLite
- **Authentification** : Laravel Sanctum (Sessions)
- **API** : RESTful API
- **Queue** : Laravel Queue pour les tâches asynchrones

### Frontend
- **Framework** : React 19.x
- **Langage** : TypeScript 5.8+
- **Build Tool** : Vite 7.x
- **Routing** : React Router DOM 7.x
- **Styling** : Tailwind CSS 3.4
- **State Management** : React Context API
- **Forms** : React Hook Form + Yup
- **HTTP Client** : Axios
- **Icons** : React Icons, Lucide React
- **PDF** : jsPDF + html2canvas
- **UI Components** : Headless UI

## 📦 Prérequis

### Backend
- PHP >= 8.2
- Composer
- MySQL >= 8.0 ou SQLite
- Extensions PHP : PDO, mbstring, OpenSSL, JSON, BCMath

### Frontend
- Node.js >= 18.x
- npm ou yarn

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone <url-du-repository>
cd systeme-gestion-ecole
```

### 2. Installation du Backend

```bash
cd backend

# Installer les dépendances
composer install

# Copier le fichier d'environnement
cp .env.example .env

# Créer le lien symbolique pour le storage
php artisan storage:link
```

### 3. Installation du Frontend

```bash
cd ../frontend

# Installer les dépendances
npm install
```

## ⚙️ Configuration

### Backend (.env)

```env
APP_NAME="Système De Gestion Ecole"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Base de données
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ecole_privee_db
DB_USERNAME=root
DB_PASSWORD=

# Session
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false

# Queue
QUEUE_CONNECTION=database

# Mail (optionnel)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
```

### Frontend (.env)

```env
# API URL (optionnel, utilise le proxy Vite par défaut)
VITE_API_URL=http://localhost:8000/api
```

### Proxy Vite (vite.config.ts)

Le frontend est configuré pour utiliser un proxy vers le backend en développement :

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
},
```

## 🎯 Utilisation

### Démarrer le Backend

```bash
cd backend

# Méthode 1 : Serveur Laravel
php artisan serve

# Méthode 2 : Avec queue et logs (recommandé)
composer dev
```

Le backend sera accessible sur `http://localhost:8000`

### Démarrer le Frontend

```bash
cd frontend

# Mode développement
npm run dev

# Le frontend sera accessible sur http://localhost:3000
```

### Comptes par défaut

Après avoir exécuté :

**Super Admin**
- Email : `superadmin@ecole.ma`
- Mot de passe : `TAYA3961`


## 📁 Structure du projet

```
systeme-gestion-ecole/
├── backend/                    # Application Laravel
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/   # Contrôleurs API
│   │   │   ├── Middleware/    # Middlewares personnalisés
│   │   │   └── Resources/     # API Resources
│   │   ├── Models/            # Modèles Eloquent
│   │   ├── Services/          # Services métier
│   │   └── Traits/            # Traits réutilisables
│   ├── database/
│   │   ├── migrations/        # Migrations de base de données
│   │   └── seeders/           # Seeders
│   ├── routes/
│   │   └── api.php           # Routes API
│   └── storage/              # Fichiers uploadés
│
├── frontend/                  # Application React
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   ├── contexts/         # Context API (Auth, Theme, etc.)
│   │   ├── layouts/          # Layouts (MainLayout)
│   │   ├── pages/            # Pages de l'application
│   │   ├── services/         # Services API (Axios)
│   │   ├── types/            # Types TypeScript
│   │   └── utils/            # Utilitaires
│   ├── public/               # Fichiers statiques
│   └── vite.config.ts        # Configuration Vite
│
└── database/                  # Fichiers SQL (backup)
```

## 🔌 API Documentation

### Authentification

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "superadmin@ecole.ma",
  "password": "TAYA3961"
}
```


### Ressources principales

#### Élèves
- `GET /api/v1/eleves` - Liste des élèves
- `POST /api/v1/eleves` - Créer un élève
- `GET /api/v1/eleves/{id}` - Détails d'un élève
- `PUT /api/v1/eleves/{id}` - Modifier un élève
- `DELETE /api/v1/eleves/{id}` - Supprimer un élève
- `GET /api/v1/eleves/{id}/notes` - Notes d'un élève

#### Classes
- `GET /api/v1/classes` - Liste des classes
- `POST /api/v1/classes` - Créer une classe
- `GET /api/v1/classes/{id}` - Détails d'une classe
- `GET /api/v1/classes/{id}/emplois-du-temps` - Emploi du temps

#### Professeurs
- `GET /api/v1/professeurs` - Liste des professeurs
- `POST /api/v1/professeurs` - Créer un professeur
- `GET /api/v1/professeurs/{id}/timetable` - Emploi du temps du professeur

#### Notes
- `GET /api/v1/notes` - Liste des notes
- `POST /api/v1/notes` - Créer une note
- `PUT /api/v1/notes/{id}` - Modifier une note

#### Paiements
- `GET /api/v1/frais-scolaires` - Liste des frais
- `GET /api/v1/paiements-eleves` - Paiements des élèves
- `POST /api/v1/paiements-eleves/{id}/paiement` - Enregistrer un paiement

**Note** : Toutes les routes nécessitent une authentification sauf `/auth/login`

## 📱 Fonctionnalités par rôle

### Super Admin
- ✅ Toutes les fonctionnalités
- ✅ Gestion des administrateurs
- ✅ Gestion des années scolaires
- ✅ Restauration des données supprimées
- ✅ Configuration système

### Admin
- ✅ Gestion des élèves, professeurs, classes
- ✅ Gestion des notes et absences
- ✅ Gestion financière (frais, paiements)
- ✅ Gestion des services (transport, cantine)
- ✅ Consultation des statistiques

### Professeur
- ✅ Consultation de son emploi du temps
- ✅ Gestion des notes de ses classes
- ✅ Gestion des absences
- ✅ Consultation des informations élèves

### Élève
- ✅ Consultation de son emploi du temps
- ✅ Consultation de ses notes
- ✅ Consultation de ses contrôles
- ✅ Consultation des activités
- ✅ Espace personnel "Espace Élève"


## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteurs

- **AZLAFI_SALAH_EDDINE** - Développeur principal




