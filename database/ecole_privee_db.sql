-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 13 nov. 2025 à 15:54
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `ecole_privee_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `absences`
--

CREATE TABLE `absences` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `eleve_id` bigint(20) UNSIGNED NOT NULL,
  `annee_scolaire_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date` date NOT NULL,
  `motif` varchar(255) NOT NULL,
  `justifie` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `professeur_id` bigint(20) UNSIGNED DEFAULT NULL,
  `heure_debut` time DEFAULT NULL,
  `heure_fin` time DEFAULT NULL,
  `justification` text DEFAULT NULL,
  `piece_jointe` varchar(255) DEFAULT NULL,
  `matiere_id` bigint(20) UNSIGNED DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `accompagnateurs`
--

CREATE TABLE `accompagnateurs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `telephone` varchar(20) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `activites`
--

CREATE TABLE `activites` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `capacite` int(11) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date DEFAULT NULL,
  `heure_debut` time DEFAULT NULL,
  `heure_fin` time DEFAULT NULL,
  `lieu` varchar(255) NOT NULL,
  `prix` decimal(8,2) NOT NULL DEFAULT 0.00,
  `type` enum('sport','culturel','artistique','scientifique','social','autre') NOT NULL,
  `responsable_id` bigint(20) UNSIGNED DEFAULT NULL,
  `annee_scolaire_id` bigint(20) UNSIGNED DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `annees_scolaires`
--

CREATE TABLE `annees_scolaires` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(255) DEFAULT NULL,
  `date_debut` date DEFAULT NULL,
  `date_fin` date DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `cantines`
--

CREATE TABLE `cantines` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `capacite` int(11) NOT NULL,
  `localisation` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `chauffeurs`
--

CREATE TABLE `chauffeurs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `telephone` varchar(20) NOT NULL,
  `permis` varchar(50) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `classes`
--

CREATE TABLE `classes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(50) DEFAULT NULL,
  `niveau_id` bigint(20) UNSIGNED NOT NULL,
  `section` varchar(10) DEFAULT NULL,
  `capacite` int(10) UNSIGNED NOT NULL DEFAULT 30,
  `annee_scolaire_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `controles`
--

CREATE TABLE `controles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `libelle` varchar(255) NOT NULL,
  `debut_controle` datetime DEFAULT NULL,
  `fin_controle` datetime DEFAULT NULL,
  `matiere_id` bigint(20) UNSIGNED DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `professeur_id` bigint(20) UNSIGNED DEFAULT NULL,
  `periode_id` bigint(20) UNSIGNED DEFAULT NULL,
  `annee_scolaire_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `eleves`
--

CREATE TABLE `eleves` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom_fr` varchar(100) NOT NULL,
  `nom_ar` varchar(100) NOT NULL,
  `prenom_fr` varchar(100) NOT NULL,
  `prenom_ar` varchar(100) NOT NULL,
  `date_naissance` date NOT NULL,
  `lieu_naissance_fr` varchar(150) NOT NULL,
  `lieu_naissance_ar` varchar(150) NOT NULL,
  `sexe` char(1) NOT NULL,
  `matricule` varchar(20) DEFAULT NULL,
  `adresse` text NOT NULL,
  `ancienne_ecole` varchar(255) DEFAULT NULL,
  `type_ecole` varchar(50) DEFAULT NULL,
  `statut_ecole` varchar(50) DEFAULT NULL,
  `nationalite` varchar(100) DEFAULT NULL,
  `langues` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`langues`)),
  `photo` varchar(255) DEFAULT NULL,
  `cne` varchar(20) DEFAULT NULL,
  `cin` varchar(20) DEFAULT NULL,
  `infos_sante` text DEFAULT NULL,
  `groupe_sanguin` varchar(5) DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `maladies_chroniques` text DEFAULT NULL,
  `medicaments` text DEFAULT NULL,
  `personne_urgence` varchar(255) DEFAULT NULL,
  `telephone_urgence` varchar(20) DEFAULT NULL,
  `classe_id` bigint(20) UNSIGNED DEFAULT NULL,
  `date_inscription` date NOT NULL DEFAULT '2025-09-21',
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `cantine_id` bigint(20) UNSIGNED DEFAULT NULL,
  `transport_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `eleve_activite`
--

CREATE TABLE `eleve_activite` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `activite_id` bigint(20) UNSIGNED NOT NULL,
  `eleve_id` bigint(20) UNSIGNED NOT NULL,
  `date_inscription` date NOT NULL,
  `statut` enum('inscrit','present','absent','exclu') NOT NULL DEFAULT 'inscrit',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `eleve_cantine`
--

CREATE TABLE `eleve_cantine` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cantine_id` bigint(20) UNSIGNED NOT NULL,
  `eleve_id` bigint(20) UNSIGNED NOT NULL,
  `date_inscription` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `eleve_parent`
--

CREATE TABLE `eleve_parent` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `eleve_id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` bigint(20) UNSIGNED NOT NULL,
  `relation` varchar(255) NOT NULL DEFAULT 'tuteur',
  `contact_principal` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `eleve_transport`
--

CREATE TABLE `eleve_transport` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `transport_id` bigint(20) UNSIGNED NOT NULL,
  `eleve_id` bigint(20) UNSIGNED NOT NULL,
  `date_inscription` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `emplois_du_temps`
--

CREATE TABLE `emplois_du_temps` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `classe_id` bigint(20) UNSIGNED NOT NULL,
  `annee_scolaire_id` bigint(20) UNSIGNED DEFAULT NULL,
  `professeur_id` bigint(20) UNSIGNED NOT NULL,
  `matiere_id` bigint(20) UNSIGNED NOT NULL,
  `salle_id` bigint(20) UNSIGNED NOT NULL,
  `jour` enum('lundi','mardi','mercredi','jeudi','vendredi','samedi') NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `frais_scolaires`
--

CREATE TABLE `frais_scolaires` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(255) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `montant_mensuel` decimal(10,2) NOT NULL,
  `niveau_id` bigint(20) UNSIGNED DEFAULT NULL,
  `annee_scolaire_id` bigint(20) UNSIGNED NOT NULL,
  `obligatoire` tinyint(1) NOT NULL DEFAULT 1,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `historique_paiements`
--

CREATE TABLE `historique_paiements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `paiement_eleve_id` bigint(20) UNSIGNED NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `date_paiement` date NOT NULL,
  `mode_paiement` varchar(255) NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `utilisateur_id` bigint(20) UNSIGNED DEFAULT NULL,
  `annee_scolaire_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `matieres`
--

CREATE TABLE `matieres` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `code` varchar(10) DEFAULT NULL,
  `coleur` char(7) DEFAULT NULL,
  `coefficient` decimal(8,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `niveau_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `menus`
--

CREATE TABLE `menus` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cantine_id` bigint(20) UNSIGNED NOT NULL,
  `jour` enum('lundi','mardi','mercredi','jeudi','vendredi','samedi') NOT NULL,
  `plat_principal` varchar(255) DEFAULT NULL,
  `entree` varchar(255) DEFAULT NULL,
  `dessert` varchar(255) DEFAULT NULL,
  `boisson` varchar(100) DEFAULT NULL,
  `date_menu` datetime DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `repas` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `niveaux`
--

CREATE TABLE `niveaux` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `bareme` decimal(5,2) NOT NULL DEFAULT 20.00,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notes`
--

CREATE TABLE `notes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `eleve_id` bigint(20) UNSIGNED NOT NULL,
  `matiere_id` bigint(20) UNSIGNED DEFAULT NULL,
  `professeur_id` bigint(20) UNSIGNED DEFAULT NULL,
  `controle_id` bigint(20) UNSIGNED DEFAULT NULL,
  `periode_id` bigint(20) UNSIGNED DEFAULT NULL,
  `note` decimal(5,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `annee_scolaire_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `paiements_eleves`
--

CREATE TABLE `paiements_eleves` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `eleve_id` bigint(20) UNSIGNED NOT NULL,
  `frais_scolaire_id` bigint(20) UNSIGNED NOT NULL,
  `mois` varchar(255) NOT NULL,
  `montant_du` decimal(10,2) NOT NULL,
  `montant_paye` decimal(10,2) NOT NULL DEFAULT 0.00,
  `montant_restant` decimal(10,2) NOT NULL,
  `statut` enum('en_attente','partiel','regle','en_retard') NOT NULL DEFAULT 'en_attente',
  `date_echeance` date DEFAULT NULL,
  `annee_scolaire_id` bigint(20) UNSIGNED NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `parents`
--

CREATE TABLE `parents` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `telephone` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `adresse` varchar(255) NOT NULL,
  `profession` varchar(100) DEFAULT NULL,
  `type` enum('pere','mere','tuteur') NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `periodes`
--

CREATE TABLE `periodes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `annee_scolaire_id` bigint(20) UNSIGNED NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `professeurs`
--

CREATE TABLE `professeurs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `diplome` varchar(100) NOT NULL,
  `anciennete` int(11) NOT NULL,
  `telephone` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `adresse` varchar(255) NOT NULL,
  `date_embauche` date NOT NULL,
  `salaire` decimal(10,2) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `roles`
--

CREATE TABLE `roles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `roles`
--

INSERT INTO `roles` (`id`, `created_at`, `updated_at`, `type`, `active`) VALUES
(1, '2025-09-21 22:13:05', '2025-09-21 22:13:05', 'admin', 1),
(2, '2025-09-21 22:13:05', '2025-09-21 22:13:05', 'professeur', 1),
(6, '2025-09-23 15:29:18', '2025-09-23 15:29:18', 'super_admin', 1),
(7, '2025-11-04 18:31:16', '2025-11-04 18:31:16', 'eleve', 1);

-- --------------------------------------------------------

--
-- Structure de la table `salles`
--

CREATE TABLE `salles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `capacite` int(11) NOT NULL,
  `type` enum('classe','laboratoire','bibliotheque','salle_informatique','salle_art','gymnase','cantine','bureau') NOT NULL,
  `localisation` varchar(255) DEFAULT NULL,
  `equipements` text DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `sms_notifications`
--

CREATE TABLE `sms_notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `destinataire_type` varchar(255) NOT NULL,
  `destinataire_id` bigint(20) UNSIGNED NOT NULL,
  `telephone` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `statut` enum('en_attente','envoye','livre','echec') NOT NULL DEFAULT 'en_attente',
  `date_envoi` timestamp NULL DEFAULT NULL,
  `date_livraison` timestamp NULL DEFAULT NULL,
  `reference_sms` varchar(255) DEFAULT NULL,
  `erreur` text DEFAULT NULL,
  `type` enum('absence','note','paiement','activite','general') NOT NULL DEFAULT 'general',
  `urgent` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `transports`
--

CREATE TABLE `transports` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ligne` varchar(100) NOT NULL,
  `matricule` varchar(50) NOT NULL,
  `capacite` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `chauffeur_id` bigint(20) UNSIGNED DEFAULT NULL,
  `accompagnateur_id` bigint(20) UNSIGNED DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(255) DEFAULT NULL,
  `prenom` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `telephone` varchar(255) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `password` varchar(255) NOT NULL,
  `temp_password` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `role_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `nom`, `prenom`, `email`, `telephone`, `active`, `password`, `temp_password`, `created_at`, `updated_at`, `role_id`) VALUES
(3, 'Quis', 'autn', 'superadmin@ecole.ma', '+1 (975) 868-9638', 1, '$2y$12$JZo4Nb/MWmGZdACPHJ7O8OrHMvOdLQX28Qir7NAnl.BE7yCij.tdS', 'TAYA3961', '2025-09-23 15:29:18', '2025-11-07 11:12:48', 6);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `absences`
--
ALTER TABLE `absences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `absences_professeur_id_foreign` (`professeur_id`),
  ADD KEY `absences_matiere_id_foreign` (`matiere_id`),
  ADD KEY `idx_absences_eleve_id` (`eleve_id`),
  ADD KEY `idx_absences_date` (`date`),
  ADD KEY `idx_absences_active` (`active`),
  ADD KEY `absences_annee_scolaire_id_active_index` (`annee_scolaire_id`,`active`);

--
-- Index pour la table `accompagnateurs`
--
ALTER TABLE `accompagnateurs`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `activites`
--
ALTER TABLE `activites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activites_responsable_id_foreign` (`responsable_id`),
  ADD KEY `activites_annee_scolaire_id_foreign` (`annee_scolaire_id`);

--
-- Index pour la table `annees_scolaires`
--
ALTER TABLE `annees_scolaires`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Index pour la table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Index pour la table `cantines`
--
ALTER TABLE `cantines`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `chauffeurs`
--
ALTER TABLE `chauffeurs`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_classes_annee_scolaire_id` (`annee_scolaire_id`),
  ADD KEY `idx_classes_niveau_id` (`niveau_id`),
  ADD KEY `idx_classes_active` (`active`);

--
-- Index pour la table `controles`
--
ALTER TABLE `controles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `controles_matiere_id_foreign` (`matiere_id`) USING BTREE,
  ADD KEY `controles_professeur_id_foreign` (`professeur_id`),
  ADD KEY `controles_periode_id_foreign` (`periode_id`),
  ADD KEY `controles_annee_scolaire_id_active_index` (`annee_scolaire_id`,`active`);

--
-- Index pour la table `eleves`
--
ALTER TABLE `eleves`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `eleves_cne_unique` (`cne`),
  ADD UNIQUE KEY `eleves_cin_unique` (`cin`),
  ADD UNIQUE KEY `eleves_matricule_unique` (`matricule`),
  ADD KEY `eleves_cantine_id_foreign` (`cantine_id`),
  ADD KEY `eleves_transport_id_foreign` (`transport_id`),
  ADD KEY `idx_eleves_classe_id` (`classe_id`),
  ADD KEY `idx_eleves_active` (`active`),
  ADD KEY `idx_eleves_matricule` (`matricule`);

--
-- Index pour la table `eleve_activite`
--
ALTER TABLE `eleve_activite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `activite_eleve_activite_id_eleve_id_unique` (`activite_id`,`eleve_id`),
  ADD KEY `activite_eleve_eleve_id_foreign` (`eleve_id`);

--
-- Index pour la table `eleve_cantine`
--
ALTER TABLE `eleve_cantine`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cantine_eleve_cantine_id_eleve_id_unique` (`cantine_id`,`eleve_id`),
  ADD KEY `cantine_eleve_eleve_id_foreign` (`eleve_id`);

--
-- Index pour la table `eleve_parent`
--
ALTER TABLE `eleve_parent`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `eleve_parent_eleve_id_parent_id_unique` (`eleve_id`,`parent_id`),
  ADD KEY `eleve_parent_parent_id_foreign` (`parent_id`),
  ADD KEY `eleve_parent_eleve_id_relation_index` (`eleve_id`,`relation`),
  ADD KEY `eleve_parent_eleve_id_contact_principal_index` (`eleve_id`,`contact_principal`);

--
-- Index pour la table `eleve_transport`
--
ALTER TABLE `eleve_transport`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transport_eleve_transport_id_eleve_id_unique` (`transport_id`,`eleve_id`),
  ADD KEY `transport_eleve_eleve_id_foreign` (`eleve_id`);

--
-- Index pour la table `emplois_du_temps`
--
ALTER TABLE `emplois_du_temps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_salle_creneau` (`salle_id`,`jour`,`heure_debut`,`heure_fin`),
  ADD UNIQUE KEY `unique_classe_prof_matiere_creneau` (`classe_id`,`professeur_id`,`matiere_id`,`jour`,`heure_debut`,`heure_fin`),
  ADD KEY `emplois_du_temps_matiere_id_foreign` (`matiere_id`),
  ADD KEY `idx_emplois_du_temps_classe_id` (`classe_id`),
  ADD KEY `idx_emplois_du_temps_professeur_id` (`professeur_id`),
  ADD KEY `idx_emplois_du_temps_jour` (`jour`),
  ADD KEY `idx_emplois_du_temps_active` (`active`),
  ADD KEY `emplois_du_temps_annee_scolaire_id_active_index` (`annee_scolaire_id`,`active`);

--
-- Index pour la table `frais_scolaires`
--
ALTER TABLE `frais_scolaires`
  ADD PRIMARY KEY (`id`),
  ADD KEY `frais_scolaires_annee_scolaire_id_foreign` (`annee_scolaire_id`),
  ADD KEY `frais_scolaires_type_annee_scolaire_id_index` (`type`,`annee_scolaire_id`),
  ADD KEY `frais_scolaires_niveau_id_annee_scolaire_id_index` (`niveau_id`,`annee_scolaire_id`);

--
-- Index pour la table `historique_paiements`
--
ALTER TABLE `historique_paiements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `historique_paiements_utilisateur_id_foreign` (`utilisateur_id`),
  ADD KEY `historique_paiements_paiement_eleve_id_date_paiement_index` (`paiement_eleve_id`,`date_paiement`),
  ADD KEY `historique_paiements_annee_scolaire_id_date_paiement_index` (`annee_scolaire_id`,`date_paiement`);

--
-- Index pour la table `matieres`
--
ALTER TABLE `matieres`
  ADD PRIMARY KEY (`id`),
  ADD KEY `disciplines_niveau_id_foreign` (`niveau_id`);

--
-- Index pour la table `menus`
--
ALTER TABLE `menus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `menus_cantine_id_foreign` (`cantine_id`);

--
-- Index pour la table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `niveaux`
--
ALTER TABLE `niveaux`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `notes`
--
ALTER TABLE `notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notes_annee_scolaire_id_foreign` (`annee_scolaire_id`),
  ADD KEY `idx_notes_eleve_id` (`eleve_id`),
  ADD KEY `idx_notes_controle_id` (`controle_id`),
  ADD KEY `idx_notes_active` (`active`),
  ADD KEY `notes_periode_id_foreign` (`periode_id`),
  ADD KEY `notes_matiere_id_foreign` (`matiere_id`),
  ADD KEY `notes_professeur_id_foreign` (`professeur_id`);

--
-- Index pour la table `paiements_eleves`
--
ALTER TABLE `paiements_eleves`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `paiements_eleves_unique` (`eleve_id`,`frais_scolaire_id`,`mois`,`annee_scolaire_id`),
  ADD KEY `paiements_eleves_annee_scolaire_id_foreign` (`annee_scolaire_id`),
  ADD KEY `paiements_eleves_eleve_id_mois_annee_scolaire_id_index` (`eleve_id`,`mois`,`annee_scolaire_id`),
  ADD KEY `paiements_eleves_statut_annee_scolaire_id_index` (`statut`,`annee_scolaire_id`),
  ADD KEY `paiements_eleves_date_echeance_index` (`date_echeance`),
  ADD KEY `paiements_eleves_frais_scolaire_id_foreign` (`frais_scolaire_id`);

--
-- Index pour la table `parents`
--
ALTER TABLE `parents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `parents_email_unique` (`email`),
  ADD KEY `idx_parents_email` (`email`),
  ADD KEY `idx_parents_active` (`active`);

--
-- Index pour la table `periodes`
--
ALTER TABLE `periodes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `periodes_annee_scolaire_id_active_index` (`annee_scolaire_id`,`active`);

--
-- Index pour la table `professeurs`
--
ALTER TABLE `professeurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `professeurs_email_unique` (`email`),
  ADD KEY `idx_professeurs_email` (`email`),
  ADD KEY `idx_professeurs_active` (`active`);

--
-- Index pour la table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_type_unique` (`type`);

--
-- Index pour la table `salles`
--
ALTER TABLE `salles`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Index pour la table `sms_notifications`
--
ALTER TABLE `sms_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sms_notifications_destinataire_type_destinataire_id_index` (`destinataire_type`,`destinataire_id`),
  ADD KEY `sms_notifications_statut_index` (`statut`),
  ADD KEY `sms_notifications_date_envoi_index` (`date_envoi`),
  ADD KEY `sms_notifications_type_index` (`type`),
  ADD KEY `sms_notifications_telephone_index` (`telephone`);

--
-- Index pour la table `transports`
--
ALTER TABLE `transports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transports_matricule_unique` (`matricule`),
  ADD KEY `transports_chauffeur_id_foreign` (`chauffeur_id`),
  ADD KEY `transports_accompagnateur_id_foreign` (`accompagnateur_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_role_id_foreign` (`role_id`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_active` (`active`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `absences`
--
ALTER TABLE `absences`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `accompagnateurs`
--
ALTER TABLE `accompagnateurs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `activites`
--
ALTER TABLE `activites`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `annees_scolaires`
--
ALTER TABLE `annees_scolaires`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `cantines`
--
ALTER TABLE `cantines`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `chauffeurs`
--
ALTER TABLE `chauffeurs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `controles`
--
ALTER TABLE `controles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `eleves`
--
ALTER TABLE `eleves`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `eleve_activite`
--
ALTER TABLE `eleve_activite`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `eleve_cantine`
--
ALTER TABLE `eleve_cantine`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `eleve_parent`
--
ALTER TABLE `eleve_parent`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `eleve_transport`
--
ALTER TABLE `eleve_transport`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `emplois_du_temps`
--
ALTER TABLE `emplois_du_temps`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `frais_scolaires`
--
ALTER TABLE `frais_scolaires`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `historique_paiements`
--
ALTER TABLE `historique_paiements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `matieres`
--
ALTER TABLE `matieres`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `menus`
--
ALTER TABLE `menus`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `niveaux`
--
ALTER TABLE `niveaux`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notes`
--
ALTER TABLE `notes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `paiements_eleves`
--
ALTER TABLE `paiements_eleves`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `parents`
--
ALTER TABLE `parents`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `periodes`
--
ALTER TABLE `periodes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `professeurs`
--
ALTER TABLE `professeurs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `salles`
--
ALTER TABLE `salles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `sms_notifications`
--
ALTER TABLE `sms_notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `transports`
--
ALTER TABLE `transports`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `absences`
--
ALTER TABLE `absences`
  ADD CONSTRAINT `absences_annee_scolaire_id_foreign` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `absences_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `absences_professeur_id_foreign` FOREIGN KEY (`professeur_id`) REFERENCES `professeurs` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `activites`
--
ALTER TABLE `activites`
  ADD CONSTRAINT `activites_annee_scolaire_id_foreign` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `activites_responsable_id_foreign` FOREIGN KEY (`responsable_id`) REFERENCES `professeurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `classes_annee_scolaire_id_foreign` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `classes_niveau_id_foreign` FOREIGN KEY (`niveau_id`) REFERENCES `niveaux` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `controles`
--
ALTER TABLE `controles`
  ADD CONSTRAINT `controles_annee_scolaire_id_foreign` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `controles_discipline_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `controles_periode_id_foreign` FOREIGN KEY (`periode_id`) REFERENCES `periodes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `controles_professeur_id_foreign` FOREIGN KEY (`professeur_id`) REFERENCES `professeurs` (`id`);

--
-- Contraintes pour la table `eleves`
--
ALTER TABLE `eleves`
  ADD CONSTRAINT `eleves_cantine_id_foreign` FOREIGN KEY (`cantine_id`) REFERENCES `cantines` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `eleves_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `eleves_transport_id_foreign` FOREIGN KEY (`transport_id`) REFERENCES `transports` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `eleve_activite`
--
ALTER TABLE `eleve_activite`
  ADD CONSTRAINT `activite_eleve_activite_id_foreign` FOREIGN KEY (`activite_id`) REFERENCES `activites` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activite_eleve_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `eleve_cantine`
--
ALTER TABLE `eleve_cantine`
  ADD CONSTRAINT `cantine_eleve_cantine_id_foreign` FOREIGN KEY (`cantine_id`) REFERENCES `cantines` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cantine_eleve_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `eleve_parent`
--
ALTER TABLE `eleve_parent`
  ADD CONSTRAINT `eleve_parent_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `eleve_parent_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `eleve_transport`
--
ALTER TABLE `eleve_transport`
  ADD CONSTRAINT `transport_eleve_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transport_eleve_transport_id_foreign` FOREIGN KEY (`transport_id`) REFERENCES `transports` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `emplois_du_temps`
--
ALTER TABLE `emplois_du_temps`
  ADD CONSTRAINT `emplois_du_temps_annee_scolaire_id_foreign` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `emplois_du_temps_classe_id_foreign` FOREIGN KEY (`classe_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `emplois_du_temps_professeur_id_foreign` FOREIGN KEY (`professeur_id`) REFERENCES `professeurs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `emplois_du_temps_salle_id_foreign` FOREIGN KEY (`salle_id`) REFERENCES `salles` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `frais_scolaires`
--
ALTER TABLE `frais_scolaires`
  ADD CONSTRAINT `frais_scolaires_annee_scolaire_id_foreign` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `frais_scolaires_niveau_id_foreign` FOREIGN KEY (`niveau_id`) REFERENCES `niveaux` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `historique_paiements`
--
ALTER TABLE `historique_paiements`
  ADD CONSTRAINT `historique_paiements_annee_scolaire_id_foreign` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `historique_paiements_paiement_eleve_id_foreign` FOREIGN KEY (`paiement_eleve_id`) REFERENCES `paiements_eleves` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `historique_paiements_utilisateur_id_foreign` FOREIGN KEY (`utilisateur_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `matieres`
--
ALTER TABLE `matieres`
  ADD CONSTRAINT `disciplines_niveau_id_foreign` FOREIGN KEY (`niveau_id`) REFERENCES `niveaux` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `menus`
--
ALTER TABLE `menus`
  ADD CONSTRAINT `menus_cantine_id_foreign` FOREIGN KEY (`cantine_id`) REFERENCES `cantines` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `notes_annee_scolaire_id_foreign` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`),
  ADD CONSTRAINT `notes_controle_id_foreign` FOREIGN KEY (`controle_id`) REFERENCES `controles` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `notes_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notes_matiere_id_foreign` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `notes_periode_id_foreign` FOREIGN KEY (`periode_id`) REFERENCES `periodes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `notes_professeur_id_foreign` FOREIGN KEY (`professeur_id`) REFERENCES `professeurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `paiements_eleves`
--
ALTER TABLE `paiements_eleves`
  ADD CONSTRAINT `paiements_eleves_annee_scolaire_id_foreign` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `paiements_eleves_eleve_id_foreign` FOREIGN KEY (`eleve_id`) REFERENCES `eleves` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `paiements_eleves_frais_scolaire_id_foreign` FOREIGN KEY (`frais_scolaire_id`) REFERENCES `frais_scolaires` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `periodes`
--
ALTER TABLE `periodes`
  ADD CONSTRAINT `periodes_annee_scolaire_id_foreign` FOREIGN KEY (`annee_scolaire_id`) REFERENCES `annees_scolaires` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `transports`
--
ALTER TABLE `transports`
  ADD CONSTRAINT `transports_accompagnateur_id_foreign` FOREIGN KEY (`accompagnateur_id`) REFERENCES `accompagnateurs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `transports_chauffeur_id_foreign` FOREIGN KEY (`chauffeur_id`) REFERENCES `chauffeurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
