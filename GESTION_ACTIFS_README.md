# Système de Gestion des Actifs Portuaires

## 📋 Description

Ce système complet de gestion des actifs suit une structure hiérarchique pour l'administration des infrastructures portuaires. Il permet de gérer les actifs selon l'organisation suivante :

```
Portefeuille
└── Famille d'Actifs
    └── Groupe d'Actifs
        └── Actifs individuels
```

## 🏗️ Architecture

### Backend (NestJS + TypeORM + PostgreSQL)

#### Entités principales :
- **Portefeuille** : Container principal des actifs
- **FamilleActif** : Groupement logique par type d'actif
- **GroupeActif** : Sous-groupes d'actifs similaires
- **Actif** : Actif individuel avec coordonnées géographiques
- **Anomalie** : Gestion des incidents et anomalies
- **Maintenance** : Planification et suivi des maintenances

#### Structure hiérarchique :
```
/src/gestion_des_actifs/
├── entities/           # Entités TypeORM
├── controllers/        # Contrôleurs REST API
├── services/          # Logique métier
└── gestion_des_actifs.module.ts
```

### Frontend (Angular 18 Standalone)

#### Composant principal :
- **AssetManagementComponent** : Interface complète avec onglets
  - 📊 Dashboard KPI
  - 🌳 Vue hiérarchique
  - 🗺️ Carte interactive
  - 📝 Gestion des actifs

## 🚀 Installation et Configuration

### 1. Backend

```bash
cd back-end
npm install

# Configuration de la base de données PostgreSQL
# Modifier les paramètres dans src/app.module.ts

# Initialisation de la base de données avec des données de test
npm run db:init

# Démarrage du serveur de développement
npm run start:dev
```

### 2. Frontend

```bash
cd front-end/geo-dashboard
npm install

# Démarrage du serveur de développement
ng serve
```

## 📡 API Endpoints

### Portefeuilles
- `GET /portefeuilles` - Liste tous les portefeuilles
- `GET /portefeuilles/:id` - Détails d'un portefeuille
- `POST /portefeuilles` - Créer un portefeuille
- `PUT /portefeuilles/:id` - Modifier un portefeuille
- `DELETE /portefeuilles/:id` - Supprimer un portefeuille

### Familles d'Actifs
- `GET /familles-actifs` - Liste toutes les familles
- `GET /familles-actifs/portefeuille/:id` - Familles par portefeuille
- `POST /familles-actifs` - Créer une famille
- `PUT /familles-actifs/:id` - Modifier une famille
- `DELETE /familles-actifs/:id` - Supprimer une famille

### Groupes d'Actifs
- `GET /groupes-actifs` - Liste tous les groupes
- `GET /groupes-actifs/famille/:id` - Groupes par famille
- `POST /groupes-actifs` - Créer un groupe
- `PUT /groupes-actifs/:id` - Modifier un groupe
- `DELETE /groupes-actifs/:id` - Supprimer un groupe

### Actifs
- `GET /actifs` - Liste tous les actifs
- `GET /actifs/groupe/:id` - Actifs par groupe
- `GET /actifs/:id/statistiques` - Statistiques d'un actif
- `PUT /actifs/:id/statut` - Modifier le statut d'un actif
- `POST /actifs` - Créer un actif
- `PUT /actifs/:id` - Modifier un actif
- `DELETE /actifs/:id` - Supprimer un actif

## 🎯 Fonctionnalités Principales

### Dashboard KPI
- Nombre total d'actifs par statut
- Répartition par famille d'actifs
- Anomalies en cours
- Maintenances planifiées

### Vue Hiérarchique
- Navigation arborescente interactive
- Sélection et filtrage par niveau
- Badges de statut visuels

### Carte Interactive
- Visualisation géographique des actifs
- Clustering automatique
- Pop-ups informatifs
- Intégration OpenLayers

### Gestion des Actifs
- Formulaires de création/modification
- Gestion des statuts (Actif, Inactif, Maintenance, Hors Service)
- Upload de documents
- Historique des modifications

## 🔧 Configuration

### Base de données
Modifier les paramètres dans `back-end/src/app.module.ts` :

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'your_password',
  database: 'your_database',
  // ...
})
```

### Variables d'environnement
Créer un fichier `.env` dans le dossier backend :

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=your_database
```

## 📊 Données de Test

Le système inclut un script de génération de données de test qui crée :
- 2 portefeuilles (Infrastructure Portuaire, Équipements Mobiles)
- 6 familles d'actifs (Quais, Grues, etc.)
- 12 groupes d'actifs
- 50+ actifs individuels
- Anomalies et maintenances associées

Exécuter : `npm run db:init`

## 🌐 Technologies Utilisées

### Backend
- **NestJS** - Framework Node.js
- **TypeORM** - ORM pour TypeScript
- **PostgreSQL** - Base de données relationnelle
- **Class Validator** - Validation des données

### Frontend
- **Angular 18** - Framework frontend
- **TypeScript** - Langage de programmation
- **SCSS** - Préprocesseur CSS
- **OpenLayers** - Cartographie interactive
- **Angular Material** - Composants UI (optionnel)

## 📝 Structure des Données

### Exemple de structure hiérarchique :

```json
{
  "portefeuille": {
    "nom": "Infrastructure Portuaire",
    "familles": [
      {
        "nom": "Quais et Terminaux",
        "groupes": [
          {
            "nom": "Quais Conteneurs",
            "actifs": [
              {
                "nom": "Quai C1",
                "type": "Infrastructure",
                "statut": "Actif",
                "coordonnees": {
                  "latitude": 36.8065,
                  "longitude": 10.1815
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## 🔒 Sécurité

- Validation des données côté serveur
- Gestion des erreurs robuste
- Protection contre les injections SQL (TypeORM)
- Validation des types TypeScript

## 🚧 Développement Futur

- [ ] Authentification et autorisation
- [ ] Export de données (Excel, PDF)
- [ ] Notifications en temps réel
- [ ] Interface mobile responsive
- [ ] Intégration IoT pour monitoring
- [ ] Rapports avancés et analytics
- [ ] Workflow d'approbation
- [ ] Gestion documentaire avancée

## 📞 Support

Pour toute question ou problème, consultez la documentation ou contactez l'équipe de développement.
