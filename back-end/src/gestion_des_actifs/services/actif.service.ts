import { Injectable } from '@nestjs/common';
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

  async findOne(id: number): Promise<Actif | null> {
    return this.actifRepository.findOne({
      where: { id },
      relations: ['groupeActif', 'groupeActif.familleActif', 'groupeActif.familleActif.portefeuille', 'anomalies', 'maintenances']
    });
  }

  async create(actifData: Partial<Actif>): Promise<Actif> {
    // Vérifier si un code a été fourni et s'il existe déjà
    if (actifData.code) {
      const existingActif = await this.actifRepository.findOne({ where: { code: actifData.code } });
      
      // Si le code existe déjà, générer un nouveau code unique
      if (existingActif) {
        // Générer un code unique en ajoutant un timestamp et un nombre aléatoire
        const timestamp = new Date().getTime().toString().substr(-6);
        const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        // Extraire le préfixe du code existant (avant le dernier tiret)
        const parts = actifData.code.split('-');
        if (parts.length >= 2) {
          const prefix = parts.slice(0, -1).join('-');
          actifData.code = `${prefix}-${timestamp}${randomPart}`;
        } else {
          actifData.code = `${actifData.code}-${timestamp}${randomPart}`;
        }
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
      type: actif.groupeActif?.type || 'inconnu',
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
    
    // Si le code existe déjà, générer un nouveau code unique
    let actifCode = actifData.code;
    if (existingActif) {
      // Générer un code unique en ajoutant un timestamp et un nombre aléatoire
      const timestamp = new Date().getTime().toString().substr(-6);
      const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      
      // Extraire le préfixe du code existant (avant le dernier tiret)
      const parts = actifData.code.split('-');
      if (parts.length >= 2) {
        const prefix = parts.slice(0, -1).join('-');
        actifCode = `${prefix}-${timestamp}${randomPart}`;
      } else {
        actifCode = `${actifData.code}-${timestamp}${randomPart}`;
      }
    }
    
    // Créer un actif avec les données minimales requises
    const newActif = this.actifRepository.create({
      nom: actifData.nom,
      code: actifCode, // Utiliser le code potentiellement modifié
      type: actifData.type,
      statutOperationnel: actifData.statutOperationnel,
      etatGeneral: actifData.etatGeneral,
      // Inverser latitude et longitude pour corriger le problème
      latitude: actifData.longitude,  // <-- Corriger l'inversion
      longitude: actifData.latitude,  // <-- Corriger l'inversion
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
