import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actif } from '../entities/actif.entity';

// Move interfaces outside the class
interface GeoJSONGeometry {
  type: string;
  coordinates: number[];
}

interface CreateActifFromMapDto {
  nom: string;
  code: string;
  type: string;
  description: string;
  statutOperationnel: string;
  etatGeneral: string;
  latitude: number;
  longitude: number;
  valeurAcquisition?: number;
  groupeActifId?: number;
  dateMiseEnService?: string;
  dateFinGarantie?: string;
  fournisseur?: string;
  specifications?: any;
}

@Injectable()
export class ActifService {
  constructor(
    @InjectRepository(Actif)
    private actifRepository: Repository<Actif>,
  ) {}

  async findAll(): Promise<Actif[]> {
    return this.actifRepository.find({
      relations: ['groupeActif', 'groupeActif.familleActif', 'groupeActif.familleActif.portefeuille', 'anomalies', 'maintenances']
    });
  }

  async findOne(id: number, includeRelations: boolean = false): Promise<Actif> {
    const relations = includeRelations ? 
      ['groupeActif', 'groupeActif.familleActif', 'groupeActif.familleActif.portefeuille', 
       'anomalies', 'maintenances'] : [];
    
    const actif = await this.actifRepository.findOne({
      where: { id },
      relations
    });
    
    if (!actif) {
      throw new NotFoundException(`Actif with ID ${id} not found`);
    }
    
    return actif;
  }

  async create(actifData: Partial<Actif>): Promise<Actif> {
    // Vérifier si un code a été fourni et s'il existe déjà
    if (actifData.code) {
      const existingActif = await this.actifRepository.findOne({ where: { code: actifData.code } });
      
      // Si le code existe déjà, renvoyer une erreur ou gérer la situation
      if (existingActif) {
        throw new BadRequestException(`Un actif avec le code ${actifData.code} existe déjà.`);
      }
    }
    
    const actif = this.actifRepository.create(actifData);
    return this.actifRepository.save(actif);
  }

  async update(id: number, actifData: Partial<Actif>): Promise<Actif | null> {
    await this.actifRepository.update(id, actifData);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.actifRepository.delete(id);
  }

  async findByGroupe(groupeActifId: number): Promise<Actif[]> {
    return this.actifRepository.find({
      where: { groupeActifId },
      relations: ['anomalies', 'maintenances']
    });
  }

  async findByStatut(statutOperationnel: string): Promise<Actif[]> {
    return this.actifRepository.find({
      where: { statutOperationnel },
      relations: ['groupeActif', 'anomalies', 'maintenances']
    });
  }

  async getActifsAvecAnomalies(): Promise<Actif[]> {
    return this.actifRepository
      .createQueryBuilder('actif')
      .leftJoinAndSelect('actif.anomalies', 'anomalie')
      .leftJoinAndSelect('actif.groupeActif', 'groupe')
      .where('anomalie.statut IN (:...statuts)', { statuts: ['nouveau', 'en_cours'] })
      .getMany();
  }

  async getActifsEnMaintenance(): Promise<Actif[]> {
    return this.actifRepository
      .createQueryBuilder('actif')
      .leftJoinAndSelect('actif.maintenances', 'maintenance')
      .leftJoinAndSelect('actif.groupeActif', 'groupe')
      .where('maintenance.statut IN (:...statuts)', { statuts: ['planifiee', 'en_cours'] })
      .getMany();
  }

 async getActifsPourCarte(): Promise<any[]> {

    const actifs = await this.actifRepository.query(`
      SELECT 
        a.id,
        a.nom,
        a.code,
        a.type,
        a."statutOperationnel",
        a."etatGeneral",
        ST_AsGeoJSON(ST_Transform(a.geometry, 4326)) as geometry,
        g.nom as "groupeNom",
        f.nom as "familleNom", 
        p.nom as "portefeuilleNom"
      FROM actifs a
      LEFT JOIN "groupes_actifs" g ON a."groupeActifId" = g.id
      LEFT JOIN "familles_actifs" f ON g."familleActifId" = f.id
      LEFT JOIN portefeuilles p ON f."portefeuilleId" = p.id
      ORDER BY a."dateCreation" DESC
    `);
    
    return actifs.map(actif => ({
      id: actif.id,
      nom: actif.nom,
      code: actif.code,
      geometry: actif.geometry ? JSON.parse(actif.geometry) : null,
      statutOperationnel: actif.statutOperationnel,
      etatGeneral: actif.etatGeneral,
      type: actif.type || 'inconnu',
      groupe: actif.groupeNom,
      famille: actif.familleNom,
      portefeuille: actif.portefeuilleNom,
      anomaliesActives: 0, 
      maintenancesPrevues: 0
    }));
  }

  async updateStatutOperationnel(id: number, nouveauStatut: string): Promise<Actif | null> {
    await this.actifRepository.update(id, { 
      statutOperationnel: nouveauStatut,
      dateMiseAJour: new Date()
    });
    return this.findOne(id);
  }

  async createActifFromMap(actifData: CreateActifFromMapDto): Promise<Actif> {
    // Validation checks
    if (actifData.code) {
      const existingActif = await this.actifRepository.findOne({
        where: { code: actifData.code },
      });
      if (existingActif) {
        throw new BadRequestException(`Un actif avec le code ${actifData.code} existe déjà.`);
      }
    }

    if (!actifData.latitude || !actifData.longitude) {
      throw new BadRequestException('Coordinates (latitude/longitude) must be provided.');
    }

    try {
      // Create new Actif instance
      const newActif = new Actif();
      
      // Set basic properties
      newActif.nom = actifData.nom;
      newActif.code = actifData.code;
      newActif.type = actifData.type;
      newActif.description = actifData.description;
      newActif.statutOperationnel = actifData.statutOperationnel;
      newActif.etatGeneral = actifData.etatGeneral;
      newActif.latitude = Number(actifData.latitude);  // Store as number
      newActif.longitude = Number(actifData.longitude); // Store as number
      
      // Set optional properties
      if (actifData.valeurAcquisition) newActif.valeurAcquisition = actifData.valeurAcquisition;
      if (actifData.groupeActifId) newActif.groupeActifId = actifData.groupeActifId;
      if (actifData.dateMiseEnService) newActif.dateMiseEnService = new Date(actifData.dateMiseEnService);
      if (actifData.dateFinGarantie) newActif.dateFinGarantie = new Date(actifData.dateFinGarantie);
      if (actifData.fournisseur) newActif.fournisseur = actifData.fournisseur;
      if (actifData.specifications) newActif.specifications = actifData.specifications;
      
      // Set timestamps
      newActif.dateCreation = new Date();
      newActif.dateMiseAJour = new Date();
      
      // Set geometry for PostGIS
      newActif.geometry = {
        type: 'Point',
        coordinates: [Number(actifData.longitude), Number(actifData.latitude)]
      };

      // Save using repository
      const savedActif = await this.actifRepository.save(newActif);
      
      // Return the saved entity
      return savedActif;
      
    } catch (error) {
      console.error('Error saving actif:', error);
      throw new BadRequestException(`Error saving actif: ${error.message}`);
    }
  }

  async findActifsSansGroupe(): Promise<Actif[]> {
    return this.actifRepository.createQueryBuilder('actif')
      .leftJoinAndSelect('actif.anomalies', 'anomalies')
      .leftJoinAndSelect('actif.maintenances', 'maintenances')
      .where('actif.groupeActifId IS NULL')
      .getMany();
  }
}

