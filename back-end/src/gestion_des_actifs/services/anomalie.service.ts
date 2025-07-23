import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Anomalie } from '../entities/anomalie.entity';

@Injectable()
export class AnomalieService {
  constructor(
    @InjectRepository(Anomalie)
    private anomalieRepository: Repository<Anomalie>,
  ) {}

  async findAll(): Promise<Anomalie[]> {
    return this.anomalieRepository.find({
      relations: ['actif', 'actif.groupeActif']
    });
  }

  async findOne(id: number): Promise<Anomalie | null> {
    return this.anomalieRepository.findOne({
      where: { id },
      relations: ['actif', 'actif.groupeActif']
    });
  }

  async create(anomalieData: Partial<Anomalie>): Promise<Anomalie> {
    const anomalie = this.anomalieRepository.create({
      ...anomalieData,
      dateDetection: anomalieData.dateDetection || new Date()
    });
    return this.anomalieRepository.save(anomalie);
  }

  async update(id: number, anomalieData: Partial<Anomalie>): Promise<Anomalie | null> {
    await this.anomalieRepository.update(id, anomalieData);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.anomalieRepository.delete(id);
  }

  // Méthodes spécifiques pour la carte interactive
  async createFromMap(anomalieData: {
    titre: string;
    description: string;
    typeAnomalie: string;
    priorite: string;
    latitude: number;
    longitude: number;
    rapportePar?: string;
    actifId?: number;
    photosAnnexes?: any;
  }): Promise<Anomalie> {
    const anomalie = this.anomalieRepository.create({
      ...anomalieData,
      dateDetection: new Date(),
      statut: 'nouveau'
    });
    return this.anomalieRepository.save(anomalie);
  }

  async findAnomaliesForMap(): Promise<Anomalie[]> {
    return this.anomalieRepository.createQueryBuilder('anomalie')
      .leftJoinAndSelect('anomalie.actif', 'actif')
      .leftJoinAndSelect('actif.groupeActif', 'groupeActif')
      .where('anomalie.latitude IS NOT NULL')
      .andWhere('anomalie.longitude IS NOT NULL')
      .orderBy('anomalie.dateCreation', 'DESC')
      .getMany();
  }

  async findByActif(actifId: number): Promise<Anomalie[]> {
    return this.anomalieRepository.find({
      where: { actifId },
      order: { dateCreation: 'DESC' }
    });
  }

  async findByStatut(statut: string): Promise<Anomalie[]> {
    return this.anomalieRepository.find({
      where: { statut },
      relations: ['actif', 'actif.groupeActif'],
      order: { dateCreation: 'DESC' }
    });
  }

  async findByPriorite(priorite: string): Promise<Anomalie[]> {
    return this.anomalieRepository.find({
      where: { priorite },
      relations: ['actif', 'actif.groupeActif'],
      order: { dateCreation: 'DESC' }
    });
  }

  async resoudreAnomalie(id: number, actionsCorrectives: string, resolvedBy: string): Promise<Anomalie | null> {
    await this.anomalieRepository.update(id, {
      statut: 'resolu',
      dateResolution: new Date(),
      actionsCorrectives,
      assigneA: resolvedBy,
      dateMiseAJour: new Date()
    });
    return this.findOne(id);
  }

  async assignerAnomalie(id: number, assigneA: string): Promise<Anomalie | null> {
    await this.anomalieRepository.update(id, {
      assigneA,
      statut: 'en_cours',
      dateMiseAJour: new Date()
    });
    return this.findOne(id);
  }

  async getStatistiquesAnomalies(): Promise<any> {
    const totalAnomalies = await this.anomalieRepository.count();
    const anomaliesNouveaux = await this.anomalieRepository.count({ where: { statut: 'nouveau' } });
    const anomaliesEnCours = await this.anomalieRepository.count({ where: { statut: 'en_cours' } });
    const anomaliesResolus = await this.anomalieRepository.count({ where: { statut: 'resolu' } });
    const anomaliesCritiques = await this.anomalieRepository.count({ where: { priorite: 'critique' } });
    
    return {
      total: totalAnomalies,
      nouvelles: anomaliesNouveaux,
      enCours: anomaliesEnCours,
      resolues: anomaliesResolus,
      critiques: anomaliesCritiques,
      tauxResolution: totalAnomalies > 0 ? (anomaliesResolus / totalAnomalies * 100).toFixed(2) : 0
    };
  }

  async getAnomaliesParType(): Promise<any[]> {
    const result = await this.anomalieRepository
      .createQueryBuilder('anomalie')
      .select('anomalie.typeAnomalie', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('anomalie.typeAnomalie')
      .getRawMany();
    
    return result;
  }

  async getAnomaliesParMois(): Promise<any[]> {
    const result = await this.anomalieRepository
      .createQueryBuilder('anomalie')
      .select('YEAR(anomalie.dateCreation)', 'annee')
      .addSelect('MONTH(anomalie.dateCreation)', 'mois')
      .addSelect('COUNT(*)', 'count')
      .groupBy('YEAR(anomalie.dateCreation)')
      .addGroupBy('MONTH(anomalie.dateCreation)')
      .orderBy('annee', 'DESC')
      .addOrderBy('mois', 'DESC')
      .getRawMany();
    
    return result;
  }
}
