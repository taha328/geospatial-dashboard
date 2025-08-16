import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ActifService } from '../gestion_des_actifs/services/actif.service';
import { PortefeuilleService } from '../gestion_des_actifs/services/portefeuille.service';

async function ajouterActifsSurCarte() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const actifService = app.get(ActifService);
  const portefeuilleService = app.get(PortefeuilleService);

  console.log('🏗️ Ajout d\'actifs géolocalisés sur la carte...');

  try {
    // Récupérer la hiérarchie existante
    const hierarchie = await portefeuilleService.getHierarchy();
    
    // Coordonnées du Port de Tunis (exemple)
    const portCenter = { lat: 36.8065, lng: 10.1815 };
    
    // Actifs à ajouter avec leurs positions GPS
    const actifsAAjouter = [
      // Zone Terminal A
      {
        nom: 'Bollard A1',
        type: 'bollards',
        code: 'BOL-A1',
        description: 'Bollard d\'amarrage principal Terminal A',
        statutOperationnel: 'operationnel',
        etatGeneral: 'bon',
        latitude: portCenter.lat + 0.001,
        longitude: portCenter.lng + 0.002,
        specifications: {
          capacite: '50 tonnes',
          materiau: 'Acier galvanisé',
          anneePose: 2020
        }
      },
      {
        nom: 'Bollard A2',
        type: 'bollards',
        code: 'BOL-A2',
        description: 'Bollard d\'amarrage secondaire Terminal A',
        statutOperationnel: 'operationnel',
        etatGeneral: 'bon',
        latitude: portCenter.lat + 0.001,
        longitude: portCenter.lng + 0.004,
        specifications: {
          capacite: '50 tonnes',
          materiau: 'Acier galvanisé',
          anneePose: 2020
        }
      },
      {
        nom: 'Défense A1',
        type: 'defenses',
        code: 'DEF-A1',
        description: 'Défense pneumatique Terminal A',
        statutOperationnel: 'operationnel',
        etatGeneral: 'moyen',
        latitude: portCenter.lat + 0.0005,
        longitude: portCenter.lng + 0.003,
        specifications: {
          diametre: '2.5m',
          pression: '0.8 bar',
          type: 'Pneumatique'
        }
      },
      {
        nom: 'Grue Mobile GM1',
        type: 'grues',
        code: 'GRU-GM1',
        description: 'Grue mobile de 40 tonnes',
        statutOperationnel: 'operationnel',
        etatGeneral: 'bon',
        latitude: portCenter.lat - 0.001,
        longitude: portCenter.lng + 0.005,
        specifications: {
          capacite: '40 tonnes',
          hauteur: '35m',
          portee: '30m',
          marque: 'Liebherr'
        }
      },
      {
        nom: 'Éclairage LED E1',
        type: 'eclairage',
        code: 'ECL-E1',
        description: 'Mât d\'éclairage LED haute puissance',
        statutOperationnel: 'operationnel',
        etatGeneral: 'bon',
        latitude: portCenter.lat + 0.002,
        longitude: portCenter.lng + 0.001,
        specifications: {
          puissance: '500W',
          type: 'LED',
          hauteur: '12m'
        }
      },
      
      // Zone Terminal B
      {
        nom: 'Bollard B1',
        type: 'bollards',
        code: 'BOL-B1',
        description: 'Bollard d\'amarrage Terminal B',
        statutOperationnel: 'maintenance',
        etatGeneral: 'moyen',
        latitude: portCenter.lat - 0.002,
        longitude: portCenter.lng - 0.001,
        specifications: {
          capacite: '60 tonnes',
          materiau: 'Acier inoxydable',
          anneePose: 2018
        }
      },
      {
        nom: 'Signalisation S1',
        type: 'signalisation',
        code: 'SIG-S1',
        description: 'Panneau d\'information Terminal B',
        statutOperationnel: 'operationnel',
        etatGeneral: 'bon',
        latitude: portCenter.lat - 0.0015,
        longitude: portCenter.lng - 0.0005,
        specifications: {
          type: 'Panneau LED',
          taille: '2x1m',
          langues: ['FR', 'AR', 'EN']
        }
      },
      {
        nom: 'Grue Portique GP1',
        type: 'grues',
        code: 'GRU-GP1',
        description: 'Grue portique à conteneurs',
        statutOperationnel: 'operationnel',
        etatGeneral: 'bon',
        latitude: portCenter.lat - 0.0025,
        longitude: portCenter.lng + 0.003,
        specifications: {
          capacite: '65 tonnes',
          hauteur: '45m',
          portee: '40m',
          type: 'Portique'
        }
      },
      
      // Zone problématique (pour les anomalies)
      {
        nom: 'Bollard C1',
        type: 'bollards',
        code: 'BOL-C1',
        description: 'Bollard endommagé nécessitant réparation',
        statutOperationnel: 'hors_service',
        etatGeneral: 'mauvais',
        latitude: portCenter.lat + 0.003,
        longitude: portCenter.lng - 0.002,
        specifications: {
          capacite: '50 tonnes',
          materiau: 'Acier (corrodé)',
          anneePose: 2015,
          probleme: 'Corrosion avancée'
        }
      },
      {
        nom: 'Éclairage E2',
        type: 'eclairage',
        code: 'ECL-E2',
        description: 'Mât d\'éclairage défaillant',
        statutOperationnel: 'alerte',
        etatGeneral: 'mauvais',
        latitude: portCenter.lat + 0.0025,
        longitude: portCenter.lng - 0.0015,
        specifications: {
          puissance: '300W',
          type: 'Halogène',
          hauteur: '10m',
          probleme: 'Clignotement intermittent'
        }
      }
    ];

    // Trouver un groupe d'actifs pour associer les nouveaux actifs
    let groupeActifId = null;
    
    if (hierarchie.length > 0) {
      const portefeuille = hierarchie[0];
      if (portefeuille.children && portefeuille.children.length > 0) {
        const famille = portefeuille.children[0];
        if (famille.children && famille.children.length > 0) {
          const groupe = famille.children[0];
          groupeActifId = groupe.id;
        }
      }
    }

    // Ajouter chaque actif
    for (const actifData of actifsAAjouter) {
      const actif = await actifService.create({
        ...actifData,
        groupeActifId: groupeActifId || undefined,

        dateMiseEnService: new Date(),
        fournisseur: 'Port Authority Equipment',
        valeurAcquisition: Math.random() * 100000 + 50000 // Valeur aléatoire
      });
      
      console.log(`✅ Actif ajouté: ${actif.nom} (${actif.code}) - ${actif.latitude}, ${actif.longitude}`);
    }

    console.log(`🎉 ${actifsAAjouter.length} actifs ajoutés avec succès sur la carte !`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des actifs:', error);
  }

  await app.close();
}

// Exécuter le script
ajouterActifsSurCarte();
