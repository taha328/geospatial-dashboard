import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actif } from '../gestion_des_actifs/entities/actif.entity';
import { GroupeActif } from '../gestion_des_actifs/entities/groupe-actif.entity';

async function createActifsWithGPS() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const actifRepository = app.get<Repository<Actif>>(getRepositoryToken(Actif));
  const groupeActifRepository = app.get<Repository<GroupeActif>>(getRepositoryToken(GroupeActif));

  console.log('🏗️ Création d\'actifs avec coordonnées GPS...');
  
  try {
    // Vérifier s'il y a déjà un groupe d'actifs, sinon en créer un
    let groupe = await groupeActifRepository.findOne({ where: {} });
    
    if (!groupe) {
      groupe = groupeActifRepository.create({
        nom: 'Équipements Port de Tunis',
        description: 'Groupe principal des équipements du port',
        code: 'GRP-PORT-001',
        type: 'grues',
        statut: 'actif'
      });
      await groupeActifRepository.save(groupe);
      console.log('📁 Groupe d\'actifs créé');
    }

    // Coordonnées du Port de Tunis
    const portCoordinates = {
      lat: 36.8065,
      lng: 10.1815
    };

    // Définir les actifs à créer
     const actifsToCreate = [
      {
        nom: 'Grue Portuaire A1',
        code: 'GR-A1-001', // <--- ADDED
        numeroSerie: 'SN-GR-A1-2020-001', // <--- ADDED
        description: 'Grue principale pour containers',
        type: 'Équipement de manutention',
        statut: 'operationnel',
        valeurAcquisition: 450000,
        dateAcquisition: new Date('2020-01-15'),
        dateFinGarantie: new Date('2022-01-14'), // <--- ADDED
        fournisseur: 'Liebherr', // <--- ADDED
        durableVieUtile: 25,
        offset: { lat: 0.001, lng: 0.002 }
      },
      {
        nom: 'Grue Portuaire A2',
        code: 'GR-A2-002', // <--- ADDED
        numeroSerie: 'SN-GR-A2-2020-002', // <--- ADDED
        description: 'Grue secondaire pour containers',
        type: 'Équipement de manutention',
        statut: 'operationnel',
        valeurAcquisition: 420000,
        dateAcquisition: new Date('2020-03-10'),
        dateFinGarantie: new Date('2022-03-09'), // <--- ADDED
        fournisseur: 'Konecranes', // <--- ADDED
        durableVieUtile: 25,
        offset: { lat: 0.0015, lng: 0.0025 }
      },
      {
        nom: 'Portique Roulant B1',
        code: 'PR-B1-001', // <--- ADDED
        numeroSerie: 'SN-PR-B1-2019-001', // <--- ADDED
        description: 'Portique pour manutention lourde',
        type: 'Équipement de manutention',
        statut: 'maintenance',
        valeurAcquisition: 280000,
        dateAcquisition: new Date('2019-08-20'),
        dateFinGarantie: new Date('2021-08-19'), // <--- ADDED
        fournisseur: 'ZPMC', // <--- ADDED
        durableVieUtile: 20,
        offset: { lat: -0.001, lng: 0.001 }
      },
      {
        nom: 'Chariot Élévateur C1',
        code: 'CE-C1-001', // <--- ADDED
        numeroSerie: 'SN-CE-C1-2021-001', // <--- ADDED
        description: 'Chariot élévateur 5 tonnes',
        type: 'Véhicule de service',
        statut: 'operationnel',
        valeurAcquisition: 35000,
        dateAcquisition: new Date('2021-05-12'),
        dateFinGarantie: null, // Example of null value if no warranty
        fournisseur: 'Toyota Material Handling', // <--- ADDED
        durableVieUtile: 10,
        offset: { lat: 0.0005, lng: -0.001 }
      },
      // ... Add the missing fields (code, numeroSerie, dateFinGarantie, fournisseur)
      // to the rest of the objects in the array in the same way.
      // Make sure every object in the array has these properties.
      {
        nom: 'Chariot Élévateur C2',
        code: 'CE-C2-002',
        numeroSerie: 'SN-CE-C2-2021-002',
        description: 'Chariot élévateur 3 tonnes',
        type: 'Véhicule de service',
        statut: 'operationnel',
        valeurAcquisition: 28000,
        dateAcquisition: new Date('2021-07-08'),
        dateFinGarantie: null,
        fournisseur: 'Toyota Material Handling',
        durableVieUtile: 10,
        offset: { lat: 0.0008, lng: -0.0015 }
      },
      {
        nom: 'Système Éclairage Zone A',
        code: 'ECL-A-001',
        numeroSerie: 'N/A',
        description: 'Éclairage LED haute performance',
        type: 'Infrastructure',
        statut: 'operationnel',
        valeurAcquisition: 75000,
        dateAcquisition: new Date('2022-02-14'),
        dateFinGarantie: new Date('2025-02-13'),
        fournisseur: 'Philips',
        durableVieUtile: 15,
        offset: { lat: 0.002, lng: 0.001 }
      },
      {
        nom: 'Bollards Quai Nord',
        code: 'BOL-N-001',
        numeroSerie: 'N/A',
        description: 'Bollards d\'amarrage renforcés',
        type: 'Infrastructure',
        statut: 'operationnel',
        valeurAcquisition: 45000,
        dateAcquisition: new Date('2020-11-30'),
        dateFinGarantie: null,
        fournisseur: 'Local Metalworks',
        durableVieUtile: 30,
        offset: { lat: 0.0012, lng: 0.003 }
      },
      {
        nom: 'Système Surveillance S1',
        code: 'SURV-S1-001',
        numeroSerie: 'SN-SURV-S1-2021-001',
        description: 'Caméras de surveillance HD',
        type: 'Sécurité',
        statut: 'operationnel',
        valeurAcquisition: 120000,
        dateAcquisition: new Date('2021-09-15'),
        dateFinGarantie: new Date('2023-09-14'),
        fournisseur: 'Bosch Security',
        durableVieUtile: 8,
        offset: { lat: -0.0005, lng: 0.0018 }
      },
      {
        nom: 'Générateur Secours G1',
        code: 'GEN-G1-001',
        numeroSerie: 'SN-GEN-G1-2020-001',
        description: 'Générateur diesel 500 kVA',
        type: 'Équipement électrique',
        statut: 'operationnel',
        valeurAcquisition: 85000,
        dateAcquisition: new Date('2020-06-25'),
        dateFinGarantie: new Date('2022-06-24'),
        fournisseur: 'Caterpillar',
        durableVieUtile: 20,
        offset: { lat: -0.0015, lng: -0.001 }
      },
      {
        nom: 'Balances Électroniques B1',
        code: 'BAL-B1-001',
        numeroSerie: 'SN-BAL-B1-2018-001',
        description: 'Balances pour containers',
        type: 'Équipement de mesure',
        statut: 'hors_service',
        valeurAcquisition: 25000,
        dateAcquisition: new Date('2018-03-10'),
        dateFinGarantie: new Date('2019-03-09'),
        fournisseur: 'Mettler Toledo',
        durableVieUtile: 12,
        offset: { lat: 0.0018, lng: -0.0008 }
      }
    ];


    // Créer les actifs
    console.log(`🏗️ Création de ${actifsToCreate.length} actifs...`);
    
    for (const actifData of actifsToCreate) {
      const latitude = portCoordinates.lat + actifData.offset.lat;
      const longitude = portCoordinates.lng + actifData.offset.lng;
      
      const actif = actifRepository.create({
        nom: actifData.nom,
        description: actifData.description,
        type: actifData.type,
        code: actifData.code,
        numeroSerie: actifData.numeroSerie,
        statutOperationnel: actifData.statut,
        valeurAcquisition: actifData.valeurAcquisition,
        dateMiseEnService: actifData.dateAcquisition,
        dateFinGarantie: actifData.dateFinGarantie ?? undefined,

        fournisseur: actifData.fournisseur,
        latitude: latitude,
        longitude: longitude,
        groupeActif: groupe
      });
      
      await actifRepository.save(actif);
      console.log(`✅ Actif créé: ${actif.nom} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
    }

    // Compter les actifs créés
    const totalActifs = await actifRepository.count({ where: { groupeActif: { id: groupe.id } } });
    const totalValueResult = await actifRepository
      .createQueryBuilder('actif')
      .select('SUM(actif.valeurAcquisition)', 'sum')
      .where('actif.groupeActifId = :id', { id: groupe.id })
      .getRawOne();

    console.log(`🎉 ${totalActifs} actifs créés avec succès !`);
    console.log(`💰 Valeur totale des actifs: ${(totalValueResult.sum || 0).toLocaleString('fr-FR')} MAD`);
    console.log(`📍 Tous les actifs sont géolocalisés autour du Port de Tunis`);
    console.log(`🗺️ Accédez à la carte: http://localhost:4200/map`);
    console.log(`📊 Accédez aux actifs: http://localhost:4200/assets`);

  } catch (error) {
    console.error('❌ Erreur lors de la création des actifs:', error);
  } finally {
    await app.close();
  }
}

createActifsWithGPS().catch(console.error);
