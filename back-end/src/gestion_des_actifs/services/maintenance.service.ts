import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Maintenance } from '../entities/maintenance.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private maintenanceRepository: Repository<Maintenance>,
  ) {}

  async findAll(): Promise<Maintenance[]> {
    return this.maintenanceRepository.find({
      relations: ['actif', 'actif.groupeActif']
    });
  }

  async findOne(id: number): Promise<Maintenance | null> {
    return this.maintenanceRepository.findOne({
      where: { id },
      relations: ['actif', 'actif.groupeActif']
    });
  }

  async create(maintenanceData: Partial<Maintenance>): Promise<Maintenance> {
    const maintenance = this.maintenanceRepository.create(maintenanceData);
    return this.maintenanceRepository.save(maintenance);
  }

  async update(id: number, maintenanceData: Partial<Maintenance>): Promise<Maintenance | null> {
    await this.maintenanceRepository.update(id, maintenanceData);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.maintenanceRepository.delete(id);
  }

  async findByActif(actifId: number): Promise<Maintenance[]> {
    return this.maintenanceRepository.find({
      where: { actifId },
      order: { datePrevue: 'DESC' }
    });
  }

  async findByStatut(statut: string): Promise<Maintenance[]> {
    return this.maintenanceRepository.find({
      where: { statut },
      relations: ['actif', 'actif.groupeActif'],
      order: { datePrevue: 'ASC' }
    });
  }

  async findMaintenancesPrevues(): Promise<Maintenance[]> {
    const dateAujourdhui = new Date();
    const dateDans30Jours = new Date();
    dateDans30Jours.setDate(dateAujourdhui.getDate() + 30);

    return this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .leftJoinAndSelect('maintenance.actif', 'actif')
      .leftJoinAndSelect('actif.groupeActif', 'groupe')
      .where('maintenance.statut = :statut', { statut: 'planifiee' })
      .andWhere('maintenance.datePrevue BETWEEN :dateDebut AND :dateFin', {
        dateDebut: dateAujourdhui,
        dateFin: dateDans30Jours
      })
      .orderBy('maintenance.datePrevue', 'ASC')
      .getMany();
  }

  async demarrerMaintenance(id: number, technicienResponsable: string): Promise<Maintenance | null> {
    await this.maintenanceRepository.update(id, {
      statut: 'en_cours',
      dateDebut: new Date(),
      technicienResponsable,
      dateMiseAJour: new Date()
    });
    return this.findOne(id);
  }

  async terminerMaintenance(id: number, rapportIntervention: string, coutReel?: number, piecesRemplacees?: any): Promise<Maintenance | null> {
    await this.maintenanceRepository.update(id, {
      statut: 'terminee',
      dateFin: new Date(),
      rapportIntervention,
      coutReel,
      piecesRemplacees,
      dateMiseAJour: new Date()
    });
    return this.findOne(id);
  }

  async getStatistiquesMaintenance(): Promise<any> {
    const totalMaintenances = await this.maintenanceRepository.count();
    const maintenancesPlanifiees = await this.maintenanceRepository.count({ where: { statut: 'planifiee' } });
    const maintenancesEnCours = await this.maintenanceRepository.count({ where: { statut: 'en_cours' } });
    const maintenancesTerminees = await this.maintenanceRepository.count({ where: { statut: 'terminee' } });
    
    const coutTotal = await this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .select('SUM(maintenance.coutReel)', 'total')
      .where('maintenance.coutReel IS NOT NULL')
      .getRawOne();

    return {
      totalMaintenances,
      maintenancesPlanifiees,
      maintenancesEnCours,
      maintenancesTerminees,
      coutTotalMaintenance: coutTotal?.total || 0,
      tauxCompletion: totalMaintenances > 0 ? (maintenancesTerminees / totalMaintenances * 100).toFixed(2) : 0
    };
  }

  async getMaintenancesParType(): Promise<any[]> {
    const result = await this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .select('maintenance.typeMaintenance', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(maintenance.coutReel)', 'coutMoyen')
      .groupBy('maintenance.typeMaintenance')
      .getRawMany();
    
    return result;
  }

  async getCoutsMaintenanceParMois(): Promise<any[]> {
    const result = await this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .select('YEAR(maintenance.dateFin)', 'annee')
      .addSelect('MONTH(maintenance.dateFin)', 'mois')
      .addSelect('SUM(maintenance.coutReel)', 'coutTotal')
      .addSelect('COUNT(*)', 'nombreMaintenances')
      .where('maintenance.coutReel IS NOT NULL')
      .andWhere('maintenance.dateFin IS NOT NULL')
      .groupBy('YEAR(maintenance.dateFin)')
      .addGroupBy('MONTH(maintenance.dateFin)')
      .orderBy('annee', 'DESC')
      .addOrderBy('mois', 'DESC')
      .getRawMany();
    
    return result;
  }
}
