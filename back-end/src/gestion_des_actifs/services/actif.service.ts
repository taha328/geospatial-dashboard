import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actif } from '../entities/actif.entity';

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
    const actifs = await this.findAll();
    
    return actifs.map(actif => ({
      id: actif.id,
      nom: actif.nom,
      code: actif.code,
      latitude: actif.latitude,
      longitude: actif.longitude,
      statutOperationnel: actif.statutOperationnel,
      etatGeneral: actif.etatGeneral,
      type: actif.type || 'inconnu', // Utiliser directement le type de l'actif
      groupe: actif.groupeActif?.nom,
      famille: actif.groupeActif?.familleActif?.nom,
      portefeuille: actif.groupeActif?.familleActif?.portefeuille?.nom,
      anomaliesActives: actif.anomalies?.filter(a => ['nouveau', 'en_cours'].includes(a.statut)).length || 0,
      maintenancesPrevues: actif.maintenances?.filter(m => ['planifiee', 'en_cours'].includes(m.statut)).length || 0
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
    latitude: number;
    longitude: number;
    dateInstallation?: Date;
    dateAcquisition?: Date;
  }): Promise<Actif> {
    // Vérifier si le code existe déjà
    const existingActif = await this.actifRepository.findOne({ where: { code: actifData.code } });
    
    // Si le code existe déjà, renvoyer une erreur pour éviter les doublons
    if (existingActif) {
      throw new Error(`Un actif avec le code ${actifData.code} existe déjà.`);
    }
    
    // Créer un actif avec les données minimales requises
    const newActif = this.actifRepository.create({
      nom: actifData.nom,
      code: actifData.code,
      type: actifData.type,
      statutOperationnel: actifData.statutOperationnel,
      etatGeneral: actifData.etatGeneral,
      // Utiliser les coordonnées correctes
      latitude: actifData.latitude,
      longitude: actifData.longitude,
      dateMiseEnService: actifData.dateInstallation || new Date(),
      description: `Créé depuis la carte le ${new Date().toLocaleString('fr-FR')}`
    });
    
    return await this.actifRepository.save(newActif);
  }
  
  /**
   * Récupère les actifs qui ne sont pas associés à un groupe
   */
  async findActifsSansGroupe(): Promise<Actif[]> {
    // Utiliser IsNull pour la condition where
    return this.actifRepository.createQueryBuilder('actif')
      .leftJoinAndSelect('actif.anomalies', 'anomalies')
      .leftJoinAndSelect('actif.maintenances', 'maintenances')
      .where('actif.groupeActifId IS NULL')
      .getMany();
  }
}
