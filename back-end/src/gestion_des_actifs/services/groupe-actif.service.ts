import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupeActif } from '../entities/groupe-actif.entity';
import { FamilleActif } from '../entities/famille-actif.entity';

@Injectable()
export class GroupeActifService {
  constructor(
    @InjectRepository(GroupeActif)
    private groupeActifRepository: Repository<GroupeActif>,
    @InjectRepository(FamilleActif)
    private familleActifRepository: Repository<FamilleActif>,
  ) {}

  async findAll(): Promise<GroupeActif[]> {
    return this.groupeActifRepository.find({
      relations: ['familleActif', 'familleActif.portefeuille'],
      order: { nom: 'ASC' }
    });
  }

  async findAvailableForActifCreation(familleId?: number): Promise<GroupeActif[]> {
    const queryBuilder = this.groupeActifRepository
      .createQueryBuilder('groupe')
      .leftJoinAndSelect('groupe.familleActif', 'famille')
      .leftJoinAndSelect('famille.portefeuille', 'portefeuille')
      .where('groupe.statut = :statut', { statut: 'actif' })
      .orderBy('famille.nom', 'ASC')
      .addOrderBy('groupe.nom', 'ASC');

    if (familleId) {
      queryBuilder.andWhere('famille.id = :familleId', { familleId });
    }

    const results = await queryBuilder.getMany();
    console.log(`📊 Found ${results.length} available groups for actif creation`);
    return results;
  }

  async findByFamille(familleId: number): Promise<GroupeActif[]> {
    return this.groupeActifRepository.find({
      where: { 
        familleActif: { id: familleId },
        statut: 'actif'
      },
      relations: ['familleActif'],
      order: { nom: 'ASC' }
    });
  }

  async findAllWithActifCounts(): Promise<any[]> {
    return this.groupeActifRepository
      .createQueryBuilder('groupe')
      .leftJoinAndSelect('groupe.familleActif', 'famille')
      .leftJoinAndSelect('groupe.actifs', 'actif')
      .loadRelationCountAndMap('groupe.actifCount', 'groupe.actifs')
      .getMany();
  }

  async findOne(id: number): Promise<GroupeActif> {
    const groupe = await this.groupeActifRepository.findOne({
      where: { id },
      relations: ['familleActif', 'familleActif.portefeuille', 'actifs']
    });

    if (!groupe) {
      throw new NotFoundException(`Groupe actif with ID ${id} not found`);
    }

    return groupe;
  }

  async getActifsByGroupe(id: number) {
    const groupe = await this.groupeActifRepository.findOne({
      where: { id },
      relations: ['actifs']
    });

    if (!groupe) {
      throw new NotFoundException(`Groupe actif with ID ${id} not found`);
    }

    return groupe.actifs;
  }

  async create(groupeData: Partial<GroupeActif>): Promise<GroupeActif> {
    const groupe = this.groupeActifRepository.create(groupeData);
    return this.groupeActifRepository.save(groupe);
  }

  async update(id: number, groupeData: Partial<GroupeActif>): Promise<GroupeActif> {
    await this.groupeActifRepository.update(id, groupeData);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    const result = await this.groupeActifRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Groupe actif with ID ${id} not found`);
    }
  }

  // Method to create sample groups if the table is empty
  async createSampleGroups(): Promise<number> {
    console.log('🌱 Creating sample groupe actifs...');

    // Check if familles exist first
    const familles = await this.familleActifRepository.find();
    if (familles.length === 0) {
      console.log('⚠️ No familles found. Please seed familles first.');
      return 0;
    }

    // Check if groups already exist
    const existingCount = await this.groupeActifRepository.count();
    if (existingCount > 0) {
      console.log(`📋 ${existingCount} groups already exist`);
      return existingCount;
    }

    // Define sample groups data following project's geospatial patterns
    const sampleGroups = [
      // Amarrage groups - following Port de Tanger Med geospatial layout
      {
        nom: 'Bollards Quai Nord',
        description: 'Bollards d\'amarrage pour navires cargo',
        code: 'GRP-BOL-001',
        type: 'bollards',
        statut: 'actif',
        latitude: 35.8838,
        longitude: -5.5018,
        familleActif: familles.find(f => f.type === 'ouvrages_amarrage') || familles[0]
      },
      {
        nom: 'Ducs d\'Albe Terminal 1',
        description: 'Ducs d\'albe pour gros navires',
        code: 'GRP-DUC-001',
        type: 'ducs_albe',
        statut: 'actif',
        latitude: 35.8835,
        longitude: -5.5025,
        familleActif: familles.find(f => f.type === 'ouvrages_amarrage') || familles[0]
      },
      // Manutention groups - following geospatial dashboard conventions
      {
        nom: 'Grues Portiques Terminal 1',
        description: 'Grues portiques pour conteneurs',
        code: 'GRP-GP-001',
        type: 'grues_portiques',
        statut: 'actif',
        latitude: 35.8853,
        longitude: -5.4995,
        familleActif: familles.find(f => f.type === 'equipements_manutention') || familles[1] || familles[0]
      },
      {
        nom: 'Chariots Élévateurs Zone A',
        description: 'Chariots élévateurs pour marchandises',
        code: 'GRP-CE-001',
        type: 'chariots_elevateurs',
        statut: 'actif',
        latitude: 35.8848,
        longitude: -5.4992,
        familleActif: familles.find(f => f.type === 'equipements_manutention') || familles[1] || familles[0]
      },
      {
        nom: 'Reach Stackers Parc Conteneurs',
        description: 'Reach stackers pour empilage',
        code: 'GRP-RS-001',
        type: 'reach_stackers',
        statut: 'actif',
        latitude: 35.8851,
        longitude: -5.4988,
        familleActif: familles.find(f => f.type === 'equipements_manutention') || familles[1] || familles[0]
      },
      // Support groups - following infrastructure support patterns
      {
        nom: 'Éclairage Quais Principaux',
        description: 'Système d\'éclairage opérationnel',
        code: 'GRP-ECL-001',
        type: 'eclairage',
        statut: 'actif',
        latitude: 35.8845,
        longitude: -5.5005,
        familleActif: familles.find(f => f.type === 'infrastructures_support') || familles[2] || familles[0]
      },
      {
        nom: 'Systèmes de Sécurité',
        description: 'Caméras et contrôles d\'accès',
        code: 'GRP-SEC-001',
        type: 'systemes_securite',
        statut: 'actif',
        latitude: 35.8862,
        longitude: -5.4975,
        familleActif: familles.find(f => f.type === 'infrastructures_support') || familles[2] || familles[0]
      }
    ];

    // Fix: Properly type the array to hold GroupeActif entities
    const createdGroups: GroupeActif[] = [];
    
    for (const groupData of sampleGroups) {
      try {
        const groupe = await this.groupeActifRepository.save(groupData);
        createdGroups.push(groupe); // Now this works correctly
        console.log(`✅ Created group: ${groupe.code} - ${groupe.nom}`);
      } catch (error) {
        console.error(`❌ Error creating group ${groupData.code}:`, error.message);
      }
    }

    console.log(`🎉 Created ${createdGroups.length} sample groupe actifs`);
    return createdGroups.length;
  }
}
