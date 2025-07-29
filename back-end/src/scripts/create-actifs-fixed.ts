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
        description: 'Grue principale pour containers',
        type: 'Équipement de manutention',
        code: 'GRU-A1-001',
        numeroSerie: 'GRU2020001',
        statut: 'operationnel',
        valeurAcquisition: 450000,
        dateMiseEnService: new Date('2020-01-15'),
        dateFinGarantie: new Date('2025-01-15'),
        fournisseur: 'Liebherr Maritime',
        offset: { lat: 0.001, lng: 0.002 }
      },
      {
        nom: 'Grue Portuaire A2',
        description: 'Grue secondaire pour containers',
        type: 'Équipement de manutention',
        code: 'GRU-A2-002',
        numeroSerie: 'GRU2020002',
        statut: 'operationnel',
        valeurAcquisition: 420000,
        dateMiseEnService: new Date('2020-03-10'),
        dateFinGarantie: new Date('2025-03-10'),
        fournisseur: 'Liebherr Maritime',
        offset: { lat: 0.0015, lng: 0.0025 }
      },
      {
        nom: 'Portique Roulant B1',
        description: 'Portique pour manutention lourde',
        type: 'Équipement de manutention',
        code: 'POR-B1-003',
        numeroSerie: 'POR2019001',
        statut: 'maintenance',
        valeurAcquisition: 280000,
        dateMiseEnService: new Date('2019-08-20'),
        dateFinGarantie: new Date('2024-08-20'),
        fournisseur: 'Kuenz',
        offset: { lat: -0.001, lng: 0.001 }
      },
      {
        nom: 'Chariot Élévateur C1',
        description: 'Chariot élévateur 5 tonnes',
        type: 'Véhicule de service',
        code: 'CHR-C1-004',
        numeroSerie: 'CHR2021001',
        statut: 'operationnel',
        valeurAcquisition: 35000,
        dateMiseEnService: new Date('2021-05-12'),
        dateFinGarantie: new Date('2024-05-12'),
        fournisseur: 'Hyster',
        offset: { lat: 0.0005, lng: -0.001 }
      },
      {
        nom: 'Chariot Élévateur C2',
        description: 'Chariot élévateur 3 tonnes',
        type: 'Véhicule de service',
        code: 'CHR-C2-005',
        numeroSerie: 'CHR2021002',
        statut: 'operationnel',
        valeurAcquisition: 28000,
        dateMiseEnService: new Date('2021-07-08'),
        dateFinGarantie: new Date('2024-07-08'),
        fournisseur: 'Hyster',
        offset: { lat: 0.0008, lng: -0.0015 }
      },
      {
        nom: 'Système Éclairage Zone A',
        description: 'Éclairage LED haute performance',
        type: 'Infrastructure',
        code: 'ECL-A-006',
        numeroSerie: 'ECL2022001',
        statut: 'operationnel',
        valeurAcquisition: 75000,
        dateMiseEnService: new Date('2022-02-14'),
        dateFinGarantie: new Date('2027-02-14'),
        fournisseur: 'Philips',
        offset: { lat: 0.002, lng: 0.001 }
      },
      {
        nom: 'Bollards Quai Nord',
        description: 'Bollards d\'amarrage renforcés',
        type: 'Infrastructure',
        code: 'BOL-N-007',
        numeroSerie: 'BOL2020001',
        statut: 'operationnel',
        valeurAcquisition: 45000,
        dateMiseEnService: new Date('2020-11-30'),
        dateFinGarantie: new Date('2050-11-30'),
        fournisseur: 'Mampaey',
        offset: { lat: 0.0012, lng: 0.003 }
      },
      {
        nom: 'Système Surveillance S1',
        description: 'Caméras de surveillance HD',
        type: 'Sécurité',
        code: 'SUR-S1-008',
        numeroSerie: 'SUR2021001',
        statut: 'operationnel',
        valeurAcquisition: 120000,
        dateMiseEnService: new Date('2021-09-15'),
        dateFinGarantie: new Date('2026-09-15'),
        fournisseur: 'Hikvision',
        offset: { lat: -0.0005, lng: 0.0018 }
      },
      {
        nom: 'Générateur Secours G1',
        description: 'Générateur diesel 500 kVA',
        type: 'Équipement électrique',
        code: 'GEN-G1-009',
        numeroSerie: 'GEN2020001',
        statut: 'operationnel',
        valeurAcquisition: 85000,
        dateMiseEnService: new Date('2020-06-25'),
        dateFinGarantie: new Date('2025-06-25'),
        fournisseur: 'Caterpillar',
        offset: { lat: -0.0015, lng: -0.001 }
      },
      {
        nom: 'Balances Électroniques B1',
        description: 'Balances pour containers',
        type: 'Équipement de mesure',
        code: 'BAL-B1-010',
        numeroSerie: 'BAL2018001',
        statut: 'hors_service',
        valeurAcquisition: 25000,
        dateMiseEnService: new Date('2018-03-10'),
        dateFinGarantie: new Date('2023-03-10'),
        fournisseur: 'Mettler Toledo',
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
        dateMiseEnService: actifData.dateMiseEnService,
        dateFinGarantie: actifData.dateFinGarantie,
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
