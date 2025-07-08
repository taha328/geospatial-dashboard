# 🗺️ Système de Cartographie avec OpenLayers

Ce système permet d'afficher et de gérer des géométries stockées en base de données sur une carte interactive utilisant OpenLayers et ol-ext.

## 🚀 Fonctionnalités

### ✅ Fonctionnalités Cartographiques
- **Affichage de carte** avec fond OpenStreetMap
- **Visualisation des géométries** stockées en base de données
- **Dessin interactif** de nouvelles géométries
- **Modification** des géométries existantes
- **Suppression** des géométries sélectionnées
- **Stylisation** personnalisée (couleurs, opacité)

### ✅ Types de Géométries Supportés
- **Points** : Marqueurs avec coordonnées latitude/longitude
- **Polygones** : Zones fermées avec contours personnalisables
- **Cercles** : Zones circulaires avec rayon défini

### ✅ Fonctionnalités Backend
- **API REST** complète pour points et zones
- **Stockage PostgreSQL** avec TypeORM
- **Sérialisation GeoJSON** pour les géométries complexes
- **CORS** activé pour l'intégration frontend

## 🗂️ Structure du Projet

### Backend (NestJS)
```
back-end/src/
├── point/                 # Gestion des points
│   ├── point.entity.ts    # Entité Point avec coordonnées
│   ├── point.service.ts   # Service CRUD pour les points
│   ├── point.controller.ts # Contrôleur API REST
│   └── point.module.ts    # Module Point
├── zones/                 # Gestion des zones
│   ├── zone.entity.ts     # Entité Zone avec géométrie GeoJSON
│   ├── zones.service.ts   # Service CRUD pour les zones
│   ├── zones.controller.ts # Contrôleur API REST
│   └── zones.module.ts    # Module Zones
└── seed/                  # Données de test
    ├── seed.service.ts    # Service pour créer des données exemple
    └── seed.module.ts     # Module de données de test
```

### Frontend (Angular + OpenLayers)
```
front-end/src/app/
├── components/
│   └── map/               # Composant carte principal
│       ├── map.component.ts    # Logique de la carte
│       ├── map.component.html  # Interface utilisateur
│       └── map.component.scss  # Styles CSS
├── services/
│   ├── point.service.ts   # Service API pour les points
│   └── zone.service.ts    # Service API pour les zones
└── app.routes.ts          # Configuration des routes
```

## 🗄️ Base de Données

### Table `point`
```sql
CREATE TABLE point (
    id SERIAL PRIMARY KEY,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    description TEXT,
    color VARCHAR(7),
    type VARCHAR(20) DEFAULT 'point'
);
```

### Table `zone`
```sql
CREATE TABLE zone (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    geometry TEXT NOT NULL,  -- GeoJSON string
    description TEXT,
    color VARCHAR(7),
    opacity FLOAT DEFAULT 1.0
);
```

## 🔧 Installation et Configuration

### 1. Backend
```bash
cd back-end
npm install
npm run start:dev
```

### 2. Frontend
```bash
cd front-end/geo-dashboard
npm install
npm install ol ol-ext
ng serve
```

### 3. Base de Données
- PostgreSQL en cours d'exécution sur localhost:5432
- Base de données `db` créée
- Utilisateur `postgres` avec mot de passe `qawsed?`

## 🎯 Utilisation

### 1. Accès à la Carte
- Ouvrir `http://localhost:4200`
- Naviguer vers l'onglet "Carte"

### 2. Visualisation
- Les points et zones existants s'affichent automatiquement
- Différentes couleurs selon les propriétés définies
- Zoom et déplacement avec la souris

### 3. Création de Géométries
- **Sélectionner le type** : Point, Polygone, ou Cercle
- **Définir les propriétés** : nom, description, couleur, opacité
- **Cliquer "Commencer à dessiner"**
- **Dessiner sur la carte** selon le type sélectionné
- **Sauvegarde automatique** en base de données

### 4. Modification
- **Cliquer sur une géométrie** pour la sélectionner
- **Glisser-déposer** pour modifier la position/forme
- **Sauvegarde automatique** des modifications

### 5. Suppression
- **Sélectionner une géométrie** en cliquant dessus
- **Cliquer "Supprimer"** dans le panneau de contrôle
- **Confirmation** avant suppression définitive

## 📊 API Endpoints

### Points
- `GET /points` - Récupérer tous les points
- `GET /points/:id` - Récupérer un point spécifique
- `POST /points` - Créer un nouveau point
- `PUT /points/:id` - Mettre à jour un point
- `DELETE /points/:id` - Supprimer un point

### Zones
- `GET /zones` - Récupérer toutes les zones
- `GET /zones/:id` - Récupérer une zone spécifique
- `POST /zones` - Créer une nouvelle zone
- `PUT /zones/:id` - Mettre à jour une zone
- `DELETE /zones/:id` - Supprimer une zone

## 🎨 Personnalisation

### Styles des Géométries
- **Points** : Cercles avec couleur et bordure personnalisables
- **Polygones** : Remplissage semi-transparent avec contour
- **Sélection** : Surbrillance jaune pour les éléments sélectionnés

### Couleurs par Défaut
- **Rouge** `#ff0000` pour les nouveaux éléments
- **Opacité** 0.5 pour les zones
- **Personnalisable** via l'interface utilisateur

## 🌍 Projection et Coordonnées

- **Projection de la carte** : EPSG:3857 (Web Mercator)
- **Stockage des coordonnées** : EPSG:4326 (WGS84)
- **Conversion automatique** entre les projections
- **Format GeoJSON** pour les géométries complexes

## 🔄 Données de Test

Le système inclut des données de test pour Paris :
- **Points** : Tour Eiffel, Louvre, Notre-Dame, Arc de Triomphe
- **Zones** : Zone du Louvre, Zone Tour Eiffel
- **Utilisateurs** : Admin et éditeur de carte

## 🚀 Prochaines Étapes

### Fonctionnalités Avancées
- **Clustering** pour les points nombreux
- **Heatmaps** pour la visualisation de densité
- **Mesures** de distance et surface
- **Export** en formats KML/GeoJSON
- **Imports** de fichiers géospatiaux

### Améliorations UI/UX
- **Popup** d'information sur les géométries
- **Légende** de la carte
- **Couches** thématiques
- **Recherche** géographique
- **Historique** des modifications

## 🛠️ Technologies Utilisées

- **Frontend** : Angular 18, OpenLayers 7, ol-ext
- **Backend** : NestJS, TypeORM, PostgreSQL
- **Cartographie** : OpenStreetMap, projections Web Mercator
- **Formats** : GeoJSON, WKT
