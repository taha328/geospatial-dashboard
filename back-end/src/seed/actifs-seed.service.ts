import { Injectable, Logger } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Portefeuille } from '../gestion_des_actifs/entities/portefeuille.entity';
import { FamilleActif } from '../gestion_des_actifs/entities/famille-actif.entity';
import { GroupeActif } from '../gestion_des_actifs/entities/groupe-actif.entity';
import { Actif } from '../gestion_des_actifs/entities/actif.entity';

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
    private dataSource: DataSource,
  ) {}

  async seedActifs() {
    this.logger.log('🌱 Starting actifs seeding process...');

    try {
      // Check for data consistency issues first
      await this.checkAndFixDataConsistency();

      // Always check current state of all tables
      const [portefeuilleCount, familleCount, groupeCount, actifCount] = await Promise.all([
        this.portefeuilleRepository.count(),
        this.familleActifRepository.count(),
        this.groupeActifRepository.count(),
        this.actifRepository.count()
      ]);

      this.logger.log(`📊 Current data state: Portefeuilles=${portefeuilleCount}, Familles=${familleCount}, Groupes=${groupeCount}, Actifs=${actifCount}`);

      // Check if complete seeding is needed
      if (portefeuilleCount > 0 && familleCount > 0 && groupeCount > 0) {
        this.logger.log('✅ All data already exists. Skipping complete seed.');
        return { 
          status: 'skipped', 
          reason: 'Data already exists',
          counts: { portefeuilleCount, familleCount, groupeCount, actifCount }
        };
      }

      // If we have portefeuilles and familles but no groupes, create only groupes
      if (portefeuilleCount > 0 && familleCount > 0 && groupeCount === 0) {
        this.logger.log('🔧 Creating missing groupes actifs...');
        return await this.createGroupesOnly();
      }

      // Full seeding process
      this.logger.log('🚀 Starting full seeding process...');
      return await this.performFullSeeding();

    } catch (error) {
      this.logger.error('❌ Error during actifs seeding:', error.stack);
      throw error;
    }
  }

  private async createGroupesOnly() {
    this.logger.log('📦 Creating groupes actifs only...');

    // Get existing familles
    const familles = await this.familleActifRepository.find({
      relations: ['portefeuille']
    });

    if (familles.length === 0) {
      throw new Error('No familles found to create groupes for');
    }

    this.logger.log(`Found ${familles.length} familles for groupe creation`);

    // Fix: Create each groupe individually to prevent transaction rollback
    const groupesData = this.getGroupesData(familles);
    const created: GroupeActif[] = [];

    for (const groupeData of groupesData) {
      try {
        // Use individual transaction for each groupe to prevent complete rollback
        const groupe = await this.dataSource.transaction(async (manager) => {
          return await manager.save(GroupeActif, groupeData);
        });
        created.push(groupe);
        this.logger.log(`✅ Created groupe: ${groupe.code} - ${groupe.nom}`);
      } catch (error) {
        this.logger.error(`❌ Error creating groupe ${groupeData.code}:`, error.message);
        // Continue with next groupe instead of aborting entire process
      }
    }

    this.logger.log(`🎉 Created ${created.length}/${groupesData.length} groupes actifs`);
    return { 
      status: 'success', 
      type: 'groupes_only',
      count: created.length,
      items: created
    };
  }

  private async performFullSeeding() {
    return await this.dataSource.transaction(async (manager) => {
      this.logger.log('📁 Creating portefeuilles...');
      
      // Create portefeuilles
      const portefeuilleTangerMed = await manager.save(Portefeuille, {
        nom: 'Port de Tanger Med - Infrastructure Principale',
        description: 'Portefeuille principal des actifs du port de Tanger Med',
        code: 'TM-INFRA-001',
        statut: 'actif',
        latitude: 35.8845,
        longitude: -5.5026
      });

      const portefeuilleLogistique = await manager.save(Portefeuille, {
        nom: 'Zone Logistique Tanger Med',
        description: 'Actifs de la zone logistique et de manutention',
        code: 'TM-LOG-001',
        statut: 'actif',
        latitude: 35.8900,
        longitude: -5.4950
      });

      this.logger.log('✅ Portefeuilles created successfully');

      // Create familles
      this.logger.log('📂 Creating familles d\'actifs...');
      
      const familleAmarrage = await manager.save(FamilleActif, {
        nom: 'Ouvrages d\'Amarrage et d\'Accostage',
        description: 'Tous les équipements liés à l\'amarrage des navires',
        code: 'FAM-AMAR-001',
        type: 'ouvrages_amarrage',
        statut: 'actif',
        latitude: 35.8840,
        longitude: -5.5020,
        portefeuille: portefeuilleTangerMed
      });

      const familleManutention = await manager.save(FamilleActif, {
        nom: 'Équipements de Manutention',
        description: 'Grues, portiques et équipements de levage',
        code: 'FAM-MAN-001',
        type: 'equipements_manutention',
        statut: 'actif',
        latitude: 35.8850,
        longitude: -5.5000,
        portefeuille: portefeuilleLogistique
      });

      const familleSupport = await manager.save(FamilleActif, {
        nom: 'Infrastructures de Support',
        description: 'Éclairage, signalisation et systèmes de sécurité',
        code: 'FAM-SUP-001',
        type: 'infrastructures_support',
        statut: 'actif',
        latitude: 35.8860,
        longitude: -5.4980,
        portefeuille: portefeuilleTangerMed
      });

      const familleTransport = await manager.save(FamilleActif, {
        nom: 'Équipements de Transport',
        description: 'Véhicules et équipements de transport portuaire',
        code: 'FAM-TRANS-001',
        type: 'equipements_transport',
        statut: 'actif',
        latitude: 35.8870,
        longitude: -5.4960,
        portefeuille: portefeuilleLogistique
      });

      this.logger.log('✅ Familles d\'actifs created successfully');

      // Create groupes with proper error handling
      this.logger.log('📦 Creating groupes d\'actifs...');
      
      const familles = [familleAmarrage, familleManutention, familleSupport, familleTransport];
      const groupesData = this.getGroupesData(familles);
      const createdGroupes: GroupeActif[] = [];

      for (let i = 0; i < groupesData.length; i++) {
        const groupeData = groupesData[i];
        try {
          this.logger.log(`Creating groupe ${i + 1}/${groupesData.length}: ${groupeData.code}`);
          const groupe = await manager.save(GroupeActif, groupeData);
          createdGroupes.push(groupe);
          this.logger.log(`✅ Successfully created: ${groupe.code} - ${groupe.nom}`);
        } catch (error) {
          this.logger.error(`❌ Failed to create groupe ${groupeData.code}:`, error.message);
          this.logger.error('Full error:', error.stack);
          // Continue with next groupe instead of failing completely
        }
      }

      this.logger.log(`📊 Created ${createdGroupes.length}/${groupesData.length} groupe actifs`);

      // Create sample actifs with proper error handling
      if (createdGroupes.length > 0) {
        this.logger.log('📍 Creating sample individual actifs...');
        const sampleActifs = await this.createSampleActifs(manager, createdGroupes);
        this.logger.log(`✅ Created ${sampleActifs} sample actifs`);
      }

      return {
        status: 'success',
        type: 'full_seeding',
        portefeuilles: 2,
        familles: familles.length,
        groupes: createdGroupes.length,
        actifs: createdGroupes.length > 0 ? 4 : 0
      };
    });
  }

  private getGroupesData(familles: FamilleActif[]) {
    const findFamille = (type: string) => familles.find(f => f.type === type) || familles[0];

    // Fix: Use only enum values that match the GroupeActif entity exactly
    return [
      // Amarrage groups - using valid enum values from entity
      {
        nom: 'Bollards d\'Amarrage Quai Nord',
        description: 'Ensemble des bollards pour l\'amarrage des navires cargo',
        code: 'GRP-BOL-001',
        type: 'bollards', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8838,
        longitude: -5.5018,
        familleActif: findFamille('ouvrages_amarrage')
      },
      {
        nom: 'Défenses Pneumatiques Quai Sud',
        description: 'Système de défenses pour protection des navires',
        code: 'GRP-DEF-001',
        type: 'defenses', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8832,
        longitude: -5.5012,
        familleActif: findFamille('ouvrages_amarrage')
      },
      // Manutention groups - using valid enum values
      {
        nom: 'Grues Portiques Terminal 1',
        description: 'Grues portiques pour manutention conteneurs',
        code: 'GRP-GP-001',
        type: 'grues_portiques', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8853,
        longitude: -5.4995,
        familleActif: findFamille('equipements_manutention')
      },
      {
        nom: 'Grues Mobiles Zone Logistique',
        description: 'Grues mobiles pour charges lourdes',
        code: 'GRP-GM-001',
        type: 'grues_mobiles', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8855,
        longitude: -5.4985,
        familleActif: findFamille('equipements_manutention')
      },
      {
        nom: 'Chariots Élévateurs Terminal 2',
        description: 'Chariots élévateurs pour marchandises diverses',
        code: 'GRP-CE-001',
        type: 'chariots_elevateurs', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8848,
        longitude: -5.4992,
        familleActif: findFamille('equipements_manutention')
      },
      {
        nom: 'Reach Stackers Parc Conteneurs',
        description: 'Reach stackers pour empilage conteneurs',
        code: 'GRP-RS-001',
        type: 'reach_stackers', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8851,
        longitude: -5.4988,
        familleActif: findFamille('equipements_manutention')
      },
      // Support groups - using valid enum values
      {
        nom: 'Éclairage Quais Principaux',
        description: 'Système d\'éclairage des zones opérationnelles',
        code: 'GRP-ECL-001',
        type: 'eclairage', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8845,
        longitude: -5.5005,
        familleActif: findFamille('infrastructures_support')
      },
      {
        nom: 'Signalisation Maritime',
        description: 'Feux de navigation et signalisation portuaire',
        code: 'GRP-SIG-001',
        type: 'signalisation', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8847,
        longitude: -5.5008,
        familleActif: findFamille('infrastructures_support')
      },
      {
        nom: 'Systèmes de Sécurité Périmètre',
        description: 'Caméras, barrières et contrôles d\'accès',
        code: 'GRP-SEC-001',
        type: 'systemes_securite', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8862,
        longitude: -5.4975,
        familleActif: findFamille('infrastructures_support')
      },
      {
        nom: 'Alimentations Électriques Navires',
        description: 'Bornes d\'alimentation électrique pour navires',
        code: 'GRP-ALIM-001',
        type: 'alimentations_electriques', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8843,
        longitude: -5.5015,
        familleActif: findFamille('infrastructures_support')
      },
      // Transport groups - using valid enum values
      {
        nom: 'Véhicules de Service Portuaire',
        description: 'Camions, remorques et véhicules utilitaires',
        code: 'GRP-VEH-001',
        type: 'vehicules_service', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8865,
        longitude: -5.4965,
        familleActif: findFamille('equipements_transport')
      },
      {
        nom: 'Remorques Portuaires Spécialisées',
        description: 'Remorques pour transport de conteneurs et charges lourdes',
        code: 'GRP-REM-001',
        type: 'remorques_specialisees', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8867,
        longitude: -5.4962,
        familleActif: findFamille('equipements_transport')
      },
      {
        nom: 'Navettes Personnel et Passagers',
        description: 'Véhicules pour transport de personnel et visiteurs',
        code: 'GRP-NAV-001',
        type: 'navettes', // ✅ Valid enum value
        statut: 'actif',
        latitude: 35.8869,
        longitude: -5.4958,
        familleActif: findFamille('equipements_transport')
      }
    ];
  }

  private async createSampleActifs(manager: any, createdGroupes: GroupeActif[]): Promise<number> {
    let count = 0;
    
    // Find specific groups for sample actifs
    const bollardGroup = createdGroupes.find(g => g.code === 'GRP-BOL-001');
    const grueGroup = createdGroupes.find(g => g.code === 'GRP-GP-001');
    const reachStackerGroup = createdGroupes.find(g => g.code === 'GRP-RS-001');
    const eclairageGroup = createdGroupes.find(g => g.code === 'GRP-ECL-001');

    // Define sample actifs with proper type checking following geospatial dashboard patterns
    const sampleActifsRaw = [
      bollardGroup ? {
        nom: 'Bollard BA-001 Quai Nord',
        description: 'Bollard d\'amarrage capacité 150T',
        code: 'ACT-BA-001',
        type: 'bollard',
        numeroSerie: 'BA001-TM-2023',
        statutOperationnel: 'operationnel',
        etatGeneral: 'bon',
        latitude: 35.8837,
        longitude: -5.5017,
        dateMiseEnService: new Date('2023-03-15'),
        dureeVieEstimee: 25,
        valeurAchat: 45000,
        groupeActif: bollardGroup
      } : null,
      grueGroup ? {
        nom: 'Grue Portique GP-001',
        description: 'Grue portique sur rail 65T',
        code: 'ACT-GP-001',
        type: 'grue_portique',
        numeroSerie: 'GP001-TM-2023',
        statutOperationnel: 'operationnel',
        etatGeneral: 'excellent',
        latitude: 35.8852,
        longitude: -5.4994,
        dateMiseEnService: new Date('2023-01-10'),
        dureeVieEstimee: 20,
        valeurAchat: 2500000,
        groupeActif: grueGroup
      } : null,
      reachStackerGroup ? {
        nom: 'Reach Stacker RS-003',
        description: 'Reach stacker Kalmar 45T',
        code: 'ACT-RS-003',
        type: 'reach_stacker',
        numeroSerie: 'RS003-KAL-2024',
        statutOperationnel: 'maintenance',
        etatGeneral: 'bon',
        latitude: 35.8850,
        longitude: -5.4987,
        dateMiseEnService: new Date('2024-02-20'),
        dureeVieEstimee: 15,
        valeurAchat: 850000,
        groupeActif: reachStackerGroup
      } : null,
      eclairageGroup ? {
        nom: 'Mât d\'Éclairage ME-012',
        description: 'Mât d\'éclairage LED 400W',
        code: 'ACT-ME-012',
        type: 'mat_eclairage',
        numeroSerie: 'ME012-LED-2023',
        statutOperationnel: 'operationnel',
        etatGeneral: 'bon',
        latitude: 35.8844,
        longitude: -5.5004,
        dateMiseEnService: new Date('2023-06-05'),
        dureeVieEstimee: 12,
        valeurAchat: 15000,
        groupeActif: eclairageGroup
      } : null
    ];

    // Filter out null values and ensure type safety following project patterns
    const sampleActifs = sampleActifsRaw.filter((actif): actif is NonNullable<typeof actif> => actif !== null);

    for (const actifData of sampleActifs) {
      try {
        await manager.save(Actif, actifData);
        count++;
        this.logger.log(`✅ Created actif: ${actifData.code}`);
      } catch (error) {
        this.logger.error(`❌ Error creating actif ${actifData.code}:`, error.message);
      }
    }

    return count;
  }

  private async checkAndFixDataConsistency() {
    this.logger.log('🔍 Checking data consistency...');
    
    try {
      // Fix: Use correct column name from entity - familleActifId instead of portefeuille_id
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
      // Don't throw - continue with seeding
    }
  }

  private async cleanupOrphanedData() {
    this.logger.log('🧹 Cleaning up orphaned data...');
    
    try {
      await this.dataSource.transaction(async (manager) => {
        // Fix: Use correct column names matching TypeORM entities
        const actifResult = await manager.query(`
          DELETE FROM actifs 
          WHERE "groupeActifId" IN (
            SELECT g.id FROM groupes_actifs g
            LEFT JOIN familles_actifs f ON g."familleActifId" = f.id
            WHERE f.id IS NULL
          )
        `);

        const groupeResult = await manager.query(`
          DELETE FROM groupes_actifs 
          WHERE "familleActifId" IN (
            SELECT f.id FROM familles_actifs f
            LEFT JOIN portefeuilles p ON f."portefeuilleId" = p.id
            WHERE p.id IS NULL
          )
        `);

        const familleResult = await manager.query(`
          DELETE FROM familles_actifs 
          WHERE "portefeuilleId" NOT IN (
            SELECT id FROM portefeuilles WHERE id IS NOT NULL
          )
        `);

        this.logger.log(`🗑️ Cleaned up: ${actifResult.length} actifs, ${groupeResult.length} groupes, ${familleResult.length} familles`);
      });

      this.logger.log('✅ Orphaned data cleanup completed');
    } catch (error) {
      this.logger.error('❌ Error during cleanup:', error.message);
      // Don't throw - continue with seeding
    }
  }
}