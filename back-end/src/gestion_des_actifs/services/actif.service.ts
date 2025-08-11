import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actif } from '../entities/actif.entity';

interface GeoJSONGeometry {
  type: string;
  coordinates: any[];
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
        throw new Error(`Un actif avec le code ${actifData.code} existe déjà.`);
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

  /**
   * Crée un nouvel actif directement depuis la carte
   */
  async createActifFromMap(actifData: {
    nom: string;
    code: string;
    type: string;
    statutOperationnel: string;
    etatGeneral: string;
    latitude?: number;
    longitude?: number;
    geometry?: any;
    groupeActifId?: number;
  }): Promise<Actif> {
    if (actifData.code) {
      const existingActif = await this.actifRepository.findOne({ where: { code: actifData.code } });
      if (existingActif) {
        throw new BadRequestException(`Un actif avec le code ${actifData.code} existe déjà.`);
      }
    }

    const hasLatLng = actifData.latitude != null && actifData.longitude != null;
    const hasGeometry = actifData.geometry != null;

    if (!hasLatLng && !hasGeometry) {
      throw new BadRequestException('Either coordinates (latitude/longitude) or a geometry must be provided.');
    }

    let geometryForDb: string;

    if (hasGeometry) {
      let geometry = actifData.geometry;
      if (typeof geometry === 'string') {
        try {
          geometry = JSON.parse(geometry);
        } catch (e) {
          throw new BadRequestException('Invalid JSON geometry format.');
        }
      }
      geometryForDb = `ST_Transform(ST_GeomFromGeoJSON('${JSON.stringify(geometry)}'), 26191)`;
    } else { // hasLatLng
      geometryForDb = `ST_Transform(ST_SetSRID(ST_MakePoint(${actifData.longitude}, ${actifData.latitude}), 4326), 26191)`;
    }

    try {
      const query = `
        INSERT INTO actifs (
          nom, code, type, "statutOperationnel", "etatGeneral", 
          geometry, "groupeActifId", description, "dateMiseEnService"
        )
        VALUES ($1, $2, $3, $4, $5, ${geometryForDb}, $6, $7, $8)
        RETURNING 
          id, nom, code, type, "statutOperationnel", "etatGeneral",
          ST_AsGeoJSON(ST_Transform(geometry, 4326)) as geometry,
          "groupeActifId", description, "dateCreation", "dateMiseAJour", "dateMiseEnService"
      `;
      
      const params = [
        actifData.nom,
        actifData.code,
        actifData.type,
        actifData.statutOperationnel,
        actifData.etatGeneral,
        actifData.groupeActifId || null,
        `Créé depuis la carte le ${new Date().toLocaleString('fr-FR')}`,
        new Date()
      ];

      const result = await this.actifRepository.query(query, params);

      if (!result?.[0]) {
        throw new Error('Failed to create actif from map.');
      }

      const createdActif = result[0];
      createdActif.geometry = JSON.parse(createdActif.geometry);

      return createdActif as Actif;
    } catch (error) {
      console.error('Error creating actif from map:', error);
      throw new BadRequestException(`Erreur lors de la création de l'actif: ${error.message}`);
    }
  }
  
  /**
   * Récupère les actifs qui ne sont pas associés à un groupe
   */
  async findActifsSansGroupe(): Promise<Actif[]> {
    return this.actifRepository.createQueryBuilder('actif')
      .leftJoinAndSelect('actif.anomalies', 'anomalies')
      .leftJoinAndSelect('actif.maintenances', 'maintenances')
      .where('actif.groupeActifId IS NULL')
      .getMany();
  }
}
