# 🏗️ Guide Complet : Actifs Portuaires sur la Carte

## 📋 **Qu'est-ce qu'un Actif Portuaire ?**

Un **actif portuaire** est un **équipement physique** ou une **infrastructure** qui :
- 🏗️ A une **valeur économique** pour le port
- 📍 Possède une **localisation géographique** précise
- 🔧 Nécessite une **maintenance** régulière
- 📊 Doit être **surveillé** et **géré**

## 🏭 **Types d'Actifs Portuaires**

### ⚓ **Équipements d'Amarrage**
- **Bollards** : Points d'amarrage solides pour les navires
- **Bittes** : Pièces métalliques pour fixer les cordages
- **Cabestan** : Treuils pour manipuler les amarres

### 🛡️ **Équipements de Protection**
- **Défenses** : Coussins pneumatiques ou en caoutchouc
- **Pare-battages** : Protection contre les chocs
- **Systèmes anti-abordage** : Dispositifs de sécurité

### 🏗️ **Équipements de Manutention**
- **Grues mobiles** : Grues sur roues ou chenilles
- **Grues portiques** : Grues fixes pour conteneurs
- **Portiques** : Structures de levage
- **Convoyeurs** : Systèmes de transport automatisé

### 💡 **Équipements d'Infrastructure**
- **Éclairage** : Mâts et projecteurs
- **Signalisation** : Panneaux et feux
- **Systèmes électriques** : Transformateurs, câbles
- **Systèmes de communication** : Antennes, équipements radio

## 🗺️ **Comment Ajouter des Actifs à la Carte ?**

### **Étape 1 : Initialiser la Base de Données**
```bash
# Démarrer le backend
cd back-end
npm install
npm run start:dev

# Dans un autre terminal
npm run db:init  # Initialiser la base de données
```

### **Étape 2 : Ajouter des Actifs Géolocalisés**
```bash
# Ajouter des actifs avec coordonnées GPS
npm run add-actifs
```

### **Étape 3 : Démarrer le Frontend**
```bash
# Démarrer l'interface
cd front-end/geo-dashboard
npm install
ng serve
```

### **Étape 4 : Voir les Actifs sur la Carte**
1. Aller à **http://localhost:4200/map**
2. Cocher **"Afficher les Actifs"** dans le panneau
3. Les actifs apparaissent avec leurs icônes

## 🎯 **Fonctionnalités de la Carte**

### 📍 **Visualisation des Actifs**
- **Icônes différenciées** selon le type d'actif
- **Couleurs** selon le statut opérationnel
- **Clustering** automatique pour éviter la surcharge
- **Pop-ups informatifs** au clic

### 🚨 **Signalement d'Anomalies**
- **Clic sur la carte** pour signaler une anomalie
- **Formulaire contextuel** avec géolocalisation
- **Types d'anomalies** : Structurel, Mécanique, Électrique, Sécurité
- **Niveaux de priorité** : Critique, Élevée, Moyenne, Faible

### 📊 **Indicateurs Temps Réel**
- **Nombre d'actifs** par statut
- **Répartition** par type d'équipement
- **Anomalies actives** et leur priorité
- **Maintenances planifiées**

## 🔧 **Statuts des Actifs**

### ✅ **Opérationnel** (Vert)
- L'actif fonctionne normalement
- Disponible pour utilisation
- Maintenance à jour

### ⚠️ **Maintenance** (Jaune)
- Maintenance préventive en cours
- Indisponible temporairement
- Retour en service planifié

### ❌ **Hors Service** (Rouge)
- Actif défaillant ou endommagé
- Indisponible pour utilisation
- Réparation nécessaire

### 🔔 **Alerte** (Orange)
- Problème détecté nécessitant attention
- Fonctionnel mais surveillé
- Intervention recommandée

## 🎨 **Interface Utilisateur**

### 🗺️ **Carte Interactive**
```
┌─────────────────────────────────────────┐
│ 🏗️ Gestion des Actifs                   │
│ ┌─────────────────────────────────────┐ │
│ │ ☑️ Afficher les Actifs             │ │
│ │ ☑️ Afficher les Anomalies          │ │
│ │ 📝 Signaler Anomalie               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│    🗺️ CARTE INTERACTIVE                 │
│     ⚓ Bollards                         │
│     🛡️ Défenses                        │
│     🏗️ Grues                           │
│     💡 Éclairage                       │
│     🚥 Signalisation                   │
│                                         │
└─────────────────────────────────────────┘
```

### 📊 **Tableau de Bord d'Actifs**
```
┌─────────────────────────────────────────┐
│ 📊 Indicateurs Clés de Performance     │
│ ┌─────────┬─────────┬─────────┬───────┐ │
│ │ 🟢 45   │ 🟡 12   │ 🔴 3    │ 🟠 2  │ │
│ │ Opérat. │ Maint.  │ H.S.    │ Alerte│ │
│ └─────────┴─────────┴─────────┴───────┘ │
│                                         │
│ 🚨 Anomalies Récentes                   │
│ • Bollard A1 - Corrosion détectée      │
│ • Éclairage E2 - Clignotement          │
│ • Défense D3 - Pression faible         │
│                                         │
└─────────────────────────────────────────┘
```

## 🔄 **Flux de Travail**

### 1. **Signalement d'Anomalie**
```
Utilisateur clique sur carte
        ↓
Coordonnées GPS capturées
        ↓
Formulaire de signalement
        ↓
Anomalie enregistrée en base
        ↓
Visible sur tableau de bord
        ↓
Notification d'intervention
```

### 2. **Gestion des Maintenances**
```
Anomalie signalée
        ↓
Évaluation technique
        ↓
Planification maintenance
        ↓
Statut actif → Maintenance
        ↓
Intervention réalisée
        ↓
Statut → Opérationnel
```

## 📱 **Utilisation Mobile**

L'interface est **responsive** et fonctionne sur :
- 📱 **Smartphones** : Interface tactile optimisée
- 🖥️ **Tablettes** : Interface adaptée à l'écran tactile
- 💻 **Ordinateurs** : Interface complète avec toutes les fonctionnalités

## 🔍 **Exemple Pratique**

### **Scénario : Signaler un Bollard Endommagé**

1. **Ouvrir la carte** : http://localhost:4200/map
2. **Activer le mode signalement** : Cliquer sur "Signaler Anomalie"
3. **Cliquer sur l'emplacement** du bollard endommagé
4. **Remplir le formulaire** :
   - Titre : "Bollard A1 - Corrosion sévère"
   - Type : Structurel
   - Priorité : Élevée
   - Description : "Corrosion importante observée sur le bollard A1..."
5. **Valider** le signalement
6. **Voir l'anomalie** apparaître sur la carte et dans le tableau de bord

### **Résultat**
- 🚨 **Anomalie visible** sur la carte avec icône d'alerte
- 📊 **Statistiques mises à jour** dans le tableau de bord
- 📧 **Notification** aux équipes de maintenance
- 🗂️ **Historique** conservé pour suivi

## 🎯 **Avantages du Système**

### 📍 **Géolocalisation Précise**
- Localisation exacte des équipements
- Navigation facilitée pour les interventions
- Optimisation des trajets de maintenance

### 📊 **Suivi en Temps Réel**
- État opérationnel actualisé
- Indicateurs de performance
- Alertes automatiques

### 🔧 **Maintenance Préventive**
- Planification basée sur l'état réel
- Historique des interventions
- Optimisation des coûts

### 📱 **Interface Intuitive**
- Utilisation simple et rapide
- Signalement direct depuis le terrain
- Accès mobile pour les techniciens

Ce système transforme la gestion des actifs portuaires en un processus **moderne**, **efficace** et **géolocalisé** ! 🚢⚓🏗️
