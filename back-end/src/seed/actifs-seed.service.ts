import { Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Portefeuille } from '../gestion_des_actifs/entities/portefeuille.entity';
import { FamilleActif } from '../gestion_des_actifs/entities/famille-actif.entity';
import { GroupeActif } from '../gestion_des_actifs/entities/groupe-actif.entity';
import { Actif } from '../gestion_des_actifs/entities/actif.entity';
import { TypeInspection } from '../gestion_des_actifs/entities/type-inspection.entity';
import { TypeInspectionGroupe } from '../gestion_des_actifs/entities/type-inspection-groupe.entity';
import * as fs from 'fs';
import * as path from 'path';

interface DataStructure {
  groupes: Array<{
    numero_groupe: number;
    groupe_actif: string;
    famille: string;
    numero_famille: number;
  }>;
  familles: Array<{
    portfolio: string;
    famille: string;
    numero_famille: number;
  }>;
  type_inspection: Array<{
    type_inspection: string;
    numero_inspection: number;
  }>;
  types_inspection_groupe: Array<{
    numero_groupe: number;
    type_inspection: string;
    numero_inspection: number;
  }>;
}

@Injectable()
export class ActifsSeedService {
  private readonly logger = new Logger(ActifsSeedService.name);

  constructor(
    @InjectRepository(Portefeuille)
    private portefeuilleRepository: Repository<Portefeuille>,
    @InjectRepository(FamilleActif)
    private familleActifRepository: Repository<FamilleActif>,
    @InjectRepository(GroupeActif)
    private groupeActifRepository: Repository<GroupeActif>,
    @InjectRepository(Actif)
    private actifRepository: Repository<Actif>,
    @InjectRepository(TypeInspection)
    private typeInspectionRepository: Repository<TypeInspection>,
    @InjectRepository(TypeInspectionGroupe)
    private typeInspectionGroupeRepository: Repository<TypeInspectionGroupe>,
    private dataSource: DataSource,
  ) {}

  async seedActifs() {
    this.logger.log('🌱 Starting actifs seeding process with new data structure...');

    try {
      await this.checkAndFixDataConsistency();

      const [portefeuilleCount, familleCount, groupeCount, actifCount, typeInspectionCount] = await Promise.all([
        this.portefeuilleRepository.count(),
        this.familleActifRepository.count(),
        this.groupeActifRepository.count(),
        this.actifRepository.count(),
        this.typeInspectionRepository.count()
      ]);

      this.logger.log(`📊 Current data state: Portefeuilles=${portefeuilleCount}, Familles=${familleCount}, Groupes=${groupeCount}, Actifs=${actifCount}, TypesInspection=${typeInspectionCount}`);

      if (portefeuilleCount > 0) {
        this.logger.log('✅ Data already exists. Skipping seed.');
        return { 
          status: 'skipped', 
          reason: 'Data already exists',
          counts: { portefeuilleCount, familleCount, groupeCount, actifCount, typeInspectionCount }
        };
      }

      this.logger.log('🚀 Starting complete seeding process with new data structure...');
      return await this.performNewDataStructureSeeding();

    } catch (error) {
      this.logger.error('❌ Error during actifs seeding:', error.stack);
      throw error;
    }
  }

  private async performNewDataStructureSeeding() {
    // Load data from data.json
    const dataPath = path.join(process.cwd(), 'data.json');
    
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data file not found at ${dataPath}`);
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data: DataStructure = JSON.parse(rawData);

    this.logger.log(`📋 Loaded data: ${data.groupes.length} groupes, ${data.familles.length} familles, ${data.type_inspection.length} types inspection`);

    let totalCounts = { 
      portefeuilles: 0, 
      familles: 0, 
      groupes: 0, 
      actifs: 0, 
      typeInspections: 0,
      typeInspectionGroupes: 0
    };

    await this.dataSource.transaction(async (manager) => {
      try {
        // 1. Create Inspection Types first
        this.logger.log('📝 Creating inspection types...');
        for (const inspectionType of data.type_inspection) {
          const typeInspection = await manager.save(TypeInspection, {
            numero_inspection: inspectionType.numero_inspection,
            type_inspection: inspectionType.type_inspection,
            description: `Type d'inspection: ${inspectionType.type_inspection}`,
            statut: 'actif'
          });
          totalCounts.typeInspections++;
          this.logger.log(`  ✅ Created TypeInspection: ${typeInspection.type_inspection}`);
        }

        // 2. Create Portfolios based on unique portfolio names from families
        this.logger.log('📝 Creating portfolios...');
        const uniquePortfolios = [...new Set(data.familles.map(f => f.portfolio))];
        const portfolioMap = new Map<string, Portefeuille>();

        for (const portfolioName of uniquePortfolios) {
          const portfolio = await manager.save(Portefeuille, {
            nom: portfolioName,
            description: `Portfolio ${portfolioName} contenant les actifs portuaires`,
            code: `PORT-${portfolioName.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
            statut: 'actif',
            latitude: 35.8875 + (Math.random() - 0.5) * 0.01,
            longitude: -5.5000 + (Math.random() - 0.5) * 0.01
          });
          portfolioMap.set(portfolioName, portfolio);
          totalCounts.portefeuilles++;
          this.logger.log(`  ✅ Created Portfolio: ${portfolio.nom}`);
        }

        // 3. Create Families
        this.logger.log('📝 Creating families...');
        const familleMap = new Map<number, FamilleActif>();

        for (const familleData of data.familles) {
          const portfolio = portfolioMap.get(familleData.portfolio);
          if (!portfolio) {
            throw new Error(`Portfolio not found for famille: ${familleData.famille}`);
          }

          const familleType = this.mapFamilleToEnum(familleData.famille);
          
          const famille = await manager.save(FamilleActif, {
            nom: familleData.famille,
            description: `Famille d'actifs: ${familleData.famille}`,
            code: `FAM-${familleData.numero_famille.toString().padStart(3, '0')}`,
            type: familleType,
            statut: 'actif',
            latitude: portfolio.latitude + (Math.random() - 0.5) * 0.005,
            longitude: portfolio.longitude + (Math.random() - 0.5) * 0.005,
            portefeuilleId: portfolio.id
          });
          
          familleMap.set(familleData.numero_famille, famille);
          totalCounts.familles++;
          this.logger.log(`    ✅ Created Familie: ${famille.nom} for ${portfolio.nom}`);
        }

        // 4. Create Groups
        this.logger.log('📝 Creating groups...');
        const groupeMap = new Map<number, GroupeActif>();

        for (const groupeData of data.groupes) {
          const famille = familleMap.get(groupeData.numero_famille);
          if (!famille) {
            throw new Error(`Famille not found for groupe: ${groupeData.groupe_actif}`);
          }

          const groupeType = this.mapGroupeToEnum(groupeData.groupe_actif);

          const groupe = await manager.save(GroupeActif, {
            nom: groupeData.groupe_actif,
            description: `Groupe d'actifs: ${groupeData.groupe_actif}`,
            code: `GRP-${groupeData.numero_groupe.toString().padStart(3, '0')}`,
            type: groupeType,
            statut: 'actif',
            latitude: famille.latitude + (Math.random() - 0.5) * 0.003,
            longitude: famille.longitude + (Math.random() - 0.5) * 0.003,
            familleActifId: famille.id
          });

          groupeMap.set(groupeData.numero_groupe, groupe);
          totalCounts.groupes++;
          this.logger.log(`      ✅ Created Group: ${groupe.nom} for ${famille.nom}`);
        }

        // 5. Create Type Inspection Groupe relationships
        this.logger.log('📝 Creating inspection type-group relationships...');
        for (const inspectionGroupe of data.types_inspection_groupe) {
          const groupe = groupeMap.get(inspectionGroupe.numero_groupe);
          if (!groupe) {
            this.logger.warn(`⚠️ Group not found for numero_groupe: ${inspectionGroupe.numero_groupe}`);
            continue;
          }

          await manager.save(TypeInspectionGroupe, {
            numero_groupe: inspectionGroupe.numero_groupe,
            numero_inspection: inspectionGroupe.numero_inspection,
            type_inspection: inspectionGroupe.type_inspection,
            description: `Relation inspection ${inspectionGroupe.type_inspection} pour groupe ${groupe.nom}`,
            statut: 'actif'
          });

          totalCounts.typeInspectionGroupes++;
          this.logger.log(`        ✅ Created TypeInspectionGroupe: ${inspectionGroupe.type_inspection} for ${groupe.nom}`);
        }

        // 6. Create sample assets for each group
        this.logger.log('📝 Creating sample assets...');
        for (const [numeroGroupe, groupe] of groupeMap) {
          const sampleAssets = this.generateSampleAssetsForGroup(groupe, numeroGroupe);
          
          for (const assetData of sampleAssets) {
            await manager.save(Actif, {
              ...assetData,
              groupeActifId: groupe.id
            });
            totalCounts.actifs++;
            this.logger.log(`        ✅ Created Asset: ${assetData.nom} for ${groupe.nom}`);
          }
        }

      } catch (error) {
        this.logger.error(`❌ Failed during seeding transaction: ${error.message}`);
        throw error;
      }
    });

    this.logger.log('🎉 New data structure seeding finished successfully!');
    return {
      status: 'success',
      type: 'new_data_structure_seeding',
      counts: totalCounts
    };
  }

  private mapFamilleToEnum(familleName: string): string {
    const mapping: { [key: string]: string } = {
      'Ouvrages de protection': 'ouvrages_protection',
      'Ouvrages d\'amarrage et d\'accostage': 'ouvrages_amarrage_accostage',
      'Bassin': 'bassin',
      'Ouvrages d\'arts': 'ouvrages_arts',
      'Equipement de balisage maritime': 'equipement_balisage_maritime',
      'Equipement Electrique': 'equipement_electrique',
      'Equipement de signalisation': 'equipement_signalisation',
      'Equipement de protection contre incendie': 'equipement_protection_incendie'
    };

    return mapping[familleName] || 'ouvrages_protection';
  }

  private mapGroupeToEnum(groupeName: string): string {
    const mapping: { [key: string]: string } = {
      'Digue à caisson': 'digue_a_caisson',
      'Digue à talus': 'digue_a_talus',
      'Bollard': 'bollard',
      'Bassin': 'bassin',
      'Défense': 'defense',
      'Pont cadre': 'pont_cadre',
      'Pont à poutre': 'pont_a_poutre',
      'Pont dalots': 'pont_dalots',
      'Feu de guidage': 'feu_de_guidage',
      'Feu d\'extrémité': 'feu_extremite',
      'Feu à secteurs': 'feu_a_secteurs',
      'Poste répartiteur': 'poste_repartiteur',
      'Groupe électrogène': 'groupe_electrogene',
      'Onduleur': 'onduleur',
      'Panneau de signalisation': 'panneau_signalisation',
      'Désenfumage': 'desenfumage',
      'Centrale incendie': 'centrale_incendie'
    };

    return mapping[groupeName] || 'bollard';
  }

  private generateSampleAssetsForGroup(groupe: GroupeActif, numeroGroupe: number): any[] {
    const baseAsset = {
      statutOperationnel: 'operationnel',
      etatGeneral: 'bon',
      latitude: groupe.latitude + (Math.random() - 0.5) * 0.001,
      longitude: groupe.longitude + (Math.random() - 0.5) * 0.001,
      dateMiseEnService: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      dureeVieEstimee: 20 + Math.floor(Math.random() * 30),
      valeurAchat: 10000 + Math.floor(Math.random() * 500000)
    };

    switch (groupe.type) {
      case 'digue_a_caisson':
        return [
          {
            ...baseAsset,
            nom: `Digue Caisson DC-${numeroGroupe.toString().padStart(2, '0')}-01`,
            description: `Section de digue à caisson béton ${numeroGroupe}`,
            code: `ACT-DC-${numeroGroupe.toString().padStart(2, '0')}-01`,
            type: 'digue_caisson',
            valeurAchat: 2500000
          },
          {
            ...baseAsset,
            nom: `Digue Caisson DC-${numeroGroupe.toString().padStart(2, '0')}-02`,
            description: `Section de digue à caisson béton ${numeroGroupe}`,
            code: `ACT-DC-${numeroGroupe.toString().padStart(2, '0')}-02`,
            type: 'digue_caisson',
            valeurAchat: 2500000
          }
        ];

      case 'bollard':
        return [
          {
            ...baseAsset,
            nom: `Bollard B-${numeroGroupe.toString().padStart(2, '0')}-01`,
            description: `Bollard d'amarrage 200T ${numeroGroupe}`,
            code: `ACT-BOL-${numeroGroupe.toString().padStart(2, '0')}-01`,
            type: 'bollard',
            valeurAchat: 25000
          },
          {
            ...baseAsset,
            nom: `Bollard B-${numeroGroupe.toString().padStart(2, '0')}-02`,
            description: `Bollard d'amarrage 200T ${numeroGroupe}`,
            code: `ACT-BOL-${numeroGroupe.toString().padStart(2, '0')}-02`,
            type: 'bollard',
            valeurAchat: 25000
          }
        ];

      case 'feu_de_guidage':
        return [
          {
            ...baseAsset,
            nom: `Feu Guidage FG-${numeroGroupe.toString().padStart(2, '0')}-01`,
            description: `Feu de guidage LED rouge-vert ${numeroGroupe}`,
            code: `ACT-FG-${numeroGroupe.toString().padStart(2, '0')}-01`,
            type: 'feu_guidage',
            valeurAchat: 45000
          }
        ];

      case 'groupe_electrogene':
        return [
          {
            ...baseAsset,
            nom: `Groupe Électrogène GE-${numeroGroupe.toString().padStart(2, '0')}-01`,
            description: `Groupe électrogène diesel 500kVA ${numeroGroupe}`,
            code: `ACT-GE-${numeroGroupe.toString().padStart(2, '0')}-01`,
            type: 'groupe_electrogene',
            valeurAchat: 125000
          }
        ];

      default:
        return [
          {
            ...baseAsset,
            nom: `${groupe.nom} ${numeroGroupe.toString().padStart(2, '0')}-01`,
            description: `Actif ${groupe.nom} numéro ${numeroGroupe}`,
            code: `ACT-${numeroGroupe.toString().padStart(2, '0')}-01`,
            type: groupe.type,
            valeurAchat: 50000
          }
        ];
    }
  }

  private async checkAndFixDataConsistency() {
    this.logger.log('🔍 Checking data consistency...');
    
    try {
      const orphanedCount = await this.familleActifRepository.query(`
        SELECT COUNT(*) as count 
        FROM familles_actifs f
        LEFT JOIN portefeuilles p ON f."portefeuilleId" = p.id
        WHERE p.id IS NULL AND f."portefeuilleId" IS NOT NULL
      `);

      if (parseInt(orphanedCount[0].count) > 0) {
        this.logger.warn(`⚠️ Found ${orphanedCount[0].count} orphaned famille records`);
        await this.cleanupOrphanedData();
      } else {
        this.logger.log('✅ Data consistency check passed');
      }
    } catch (error) {
      this.logger.error('❌ Error during consistency check:', error.message);
    }
  }

  private async cleanupOrphanedData() {
    this.logger.log('🧹 Cleaning up orphaned data...');
    
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.query(`
          DELETE FROM actifs 
          WHERE "groupeActifId" IN (
            SELECT g.id FROM groupes_actifs g
            LEFT JOIN familles_actifs f ON g."familleActifId" = f.id
            WHERE f.id IS NULL
          )
        `);

        await manager.query(`
          DELETE FROM groupes_actifs 
          WHERE "familleActifId" IN (
            SELECT f.id FROM familles_actifs f
            LEFT JOIN portefeuilles p ON f."portefeuilleId" = p.id
            WHERE p.id IS NULL
          )
        `);

        await manager.query(`
          DELETE FROM familles_actifs 
          WHERE "portefeuilleId" NOT IN (
            SELECT id FROM portefeuilles WHERE id IS NOT NULL
          )
        `);

        this.logger.log('✅ Orphaned data cleanup completed');
      });
    } catch (error) {
      this.logger.error('❌ Error during cleanup:', error.message);
    }
  }

  // Legacy method kept for backward compatibility
  async performCompleteSeeding() {
    this.logger.warn('⚠️ performCompleteSeeding is deprecated. Use performNewDataStructureSeeding instead.');
    return await this.performNewDataStructureSeeding();
  }
}