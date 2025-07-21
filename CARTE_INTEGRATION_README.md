# 🗺️ Carte Interactive Géospatiale - Intégration avec la Gestion des Actifs Portuaires

## 🎯 Objectif
Intégrer la carte interactive géospatiale avec le système de gestion des actifs portuaires pour permettre :
- 📍 Visualisation des actifs sur la carte avec leurs statuts
- 🚨 Signalement d'anomalies directement depuis la carte
- 📊 Affichage d'indicateurs clés de performance intégrés
- 🔄 Synchronisation temps réel entre la carte et le système d'actifs

## 🔧 Nouvelles Fonctionnalités Implémentées

### 🏗️ Backend (NestJS)

#### 1. **Entité Anomalie Enrichie**
```typescript
// Ajout de coordonnées géographiques
@Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
latitude: number;

@Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
longitude: number;
```

#### 2. **Service d'Intégration Carte**
- `CarteIntegrationService` : Centralise la logique métier
- Extraction des actifs géolocalisés
- Agrégation des statistiques
- Gestion des icônes et couleurs selon les statuts

#### 3. **Endpoints API Carte**
```typescript
GET /api/carte/actifs           // Actifs pour la carte
GET /api/carte/anomalies        // Anomalies géolocalisées
GET /api/carte/dashboard        // Dashboard intégré
POST /api/carte/signaler-anomalie // Signalement depuis la carte
```

### 🎨 Frontend (Angular)

#### 1. **Service d'Intégration Carte**
```typescript
interface ActifPourCarte {
  id: number;
  nom: string;
  typeActif: string;
  statutOperationnel: string;
  latitude: number;
  longitude: number;
  iconType: string;
  statusColor: string;
  // ... autres propriétés
}
```

#### 2. **Composant Signalement d'Anomalie**
- Formulaire réactif avec validation
- Sélection du type d'anomalie et priorité
- Géolocalisation automatique depuis la carte
- Retour visuel et gestion d'erreurs

#### 3. **Composant KPI Carte**
- Statistiques des actifs en temps réel
- Répartition par statut et famille
- Indicateurs d'anomalies par priorité
- Interface responsive et animations

## 📍 Types d'Actifs Portuaires Gérés

### 🏗️ **Ouvrages d'Amarrage et d'Accostage**
- **Bollards** : Points d'amarrage fixes
- **Défenses** : Protection des navires et quais
- **Quais** : Infrastructures d'accostage
- **Terminaux** : Zones de traitement

### 🔧 **Équipements Portuaires**
- **Grues** : Manutention de conteneurs
- **Entrepôts** : Stockage de marchandises
- **Véhicules** : Transport interne
- **Conteneurs** : Unités de chargement

## 🎨 Système de Visualisation

### 🎯 **Icônes par Type d'Actif**
```typescript
const iconMap = {
  'bollard': 'anchor',      // ⚓ Ancre
  'defense': 'shield',      // 🛡️ Bouclier
  'quai': 'dock',          // 🚢 Quai
  'grue': 'crane',         // 🏗️ Grue
  'terminal': 'building',   // 🏢 Bâtiment
  'entrepot': 'warehouse',  // 🏭 Entrepôt
  'vehicule': 'truck'       // 🚚 Camion
};
```

### 🌈 **Couleurs par Statut**
```typescript
const statusColors = {
  'operationnel': '#28a745',    // ✅ Vert
  'maintenance': '#ffc107',     // ⚠️ Jaune
  'hors_service': '#dc3545',    // ❌ Rouge
  'inactif': '#6c757d'          // ⚪ Gris
};
```

## 🚨 Système de Signalement d'Anomalies

### 📝 **Types d'Anomalies**
- **Structurel** : Dommages aux infrastructures
- **Mécanique** : Défaillances d'équipements
- **Électrique** : Problèmes électriques
- **Sécurité** : Risques pour la sécurité
- **Autre** : Anomalies diverses

### 🔥 **Niveaux de Priorité**
- **Critique** 🔴 : Intervention immédiate
- **Élevée** 🟠 : Traitement rapide
- **Moyenne** 🟡 : Planification normale
- **Faible** 🟢 : Maintenance préventive

## 📊 Indicateurs Clés de Performance

### 📈 **Métriques Actifs**
- Total d'actifs géolocalisés
- Répartition par statut opérationnel
- Distribution par famille d'actifs
- Taux de disponibilité

### 🚨 **Métriques Anomalies**
- Nombre total d'anomalies
- Répartition par priorité
- Classification par type
- Évolution temporelle

## 🗺️ Intégration Cartographique

### 🎯 **Fonctionnalités Carte**
1. **Visualisation des Actifs**
   - Clustering automatique
   - Pop-ups informatifs
   - Filtrage par statut/type

2. **Signalement d'Anomalies**
   - Clic sur carte pour coordonnées
   - Formulaire contextuel
   - Validation temps réel

3. **Tableau de Bord Intégré**
   - KPI en temps réel
   - Légendes interactives
   - Actualisation automatique

## 🔄 Flux de Données

```
1. Utilisateur clique sur la carte
2. Coordonnées capturées automatiquement
3. Formulaire de signalement pré-rempli
4. Validation et envoi vers backend
5. Stockage en base avec géolocalisation
6. Mise à jour des KPI en temps réel
7. Affichage sur la carte avec symbologie
```

## 🚀 Utilisation

### 🎯 **Pour Signaler une Anomalie**
1. Cliquer sur la carte à l'emplacement concerné
2. Remplir le formulaire de signalement
3. Sélectionner le type et la priorité
4. Soumettre le signalement
5. Confirmation et affichage immédiat

### 📊 **Pour Consulter les KPI**
1. Panneau KPI affiché en permanence
2. Statistiques mises à jour en temps réel
3. Répartitions visuelles par catégorie
4. Bouton d'actualisation manuelle

## 📚 Données d'Exemple

Le système inclut des données de test pour :
- **50+ actifs** géolocalisés dans le port
- **Familles d'actifs** : Quais, Grues, Défenses, Bollards
- **Anomalies** de différents types et priorités
- **Coordonnées** réalistes du port de Tunis

## 🎨 Interface Utilisateur

### 🎯 **Composants Principaux**
- **Carte OpenLayers** avec overlays actifs/anomalies
- **Panneau KPI** avec statistiques visuelles
- **Formulaire de signalement** réactif et validé
- **Légendes interactives** pour navigation

### 🌈 **Design System**
- Palette de couleurs cohérente
- Icônes FontAwesome standardisées
- Animations fluides et feedback visuel
- Interface responsive mobile/desktop

## 🔧 Configuration

### 🗄️ **Base de Données**
```sql
-- Nouvelles colonnes pour anomalies géolocalisées
ALTER TABLE anomalies ADD COLUMN latitude DECIMAL(10,7);
ALTER TABLE anomalies ADD COLUMN longitude DECIMAL(10,7);
```

### 🌐 **Endpoints API**
```typescript
// Configuration des nouveaux endpoints
const apiRoutes = {
  actifs: '/api/carte/actifs',
  anomalies: '/api/carte/anomalies',
  dashboard: '/api/carte/dashboard',
  signaler: '/api/carte/signaler-anomalie'
};
```

## 🎯 Prochaines Étapes

1. **Intégration complète** avec le composant carte existant
2. **Tests** de l'API et des composants
3. **Optimisation** des performances de clustering
4. **Notifications** en temps réel pour nouvelles anomalies
5. **Export** des données vers formats standards

Cette intégration transforme la carte en un outil opérationnel complet pour la gestion des actifs portuaires ! 🚢⚓🏗️
