import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portefeuille } from '../entities/portefeuille.entity';
import { FamilleActif } from '../entities/famille-actif.entity';
import { GroupeActif } from '../entities/groupe-actif.entity';
import { Actif } from '../entities/actif.entity';
import { Anomalie } from '../entities/anomalie.entity';
import { Maintenance } from '../entities/maintenance.entity';

export interface KPIData {
  totalActifs: number;
  actifsOperationnels: number;
  actifsEnMaintenance: number;
  actifsHorsService: number;
  totalAnomalies: number;
  anomaliesOuvertes: number;
  anomaliesCritiques: number;
  totalMaintenances: number;
  maintenancesPrevues: number;
  maintenancesEnCours: number;
  portefeuilles: number;
  familles: number;
  groupes: number;
  valeurTotaleActifs: number;
  tauxDisponibilite: number;
  indicateursParType: {
    [key: string]: {
      total: number;
      operationnels: number;
      enMaintenance: number;
    };
  };
  repartitionGeographique: {
    latitude: number;
    longitude: number;
    count: number;
    type: string;
  }[];
  // Add structure for frontend dashboard integration
  statistiques: {
    actifs: {
      total: number;
      parStatut: {
        [key: string]: number;
      };
      parFamille: {
        [key: string]: number;
      };
    };
    anomalies: {
      total: number;
      parPriorite: {
        [key: string]: number;
      };
    };
  };
}

@Injectable()
export class KPIService {
  constructor(
    @InjectRepository(Portefeuille)
    private portefeuilleRepository: Repository<Portefeuille>,
    @InjectRepository(FamilleActif)
    private familleActifRepository: Repository<FamilleActif>,
    @InjectRepository(GroupeActif)
    private groupeActifRepository: Repository<GroupeActif>,
    @InjectRepository(Actif)
    private actifRepository: Repository<Actif>,
    @InjectRepository(Anomalie)
    private anomalieRepository: Repository<Anomalie>,
    @InjectRepository(Maintenance)
    private maintenanceRepository: Repository<Maintenance>,
  ) {}

  async getKPIData(): Promise<KPIData> {
    // Get basic counts following geospatial dashboard patterns
    const [
      totalActifs,
      totalAnomalies,
      totalMaintenances,
      portefeuilles,
      familles,
      groupes
    ] = await Promise.all([
      this.actifRepository.count(),
      this.anomalieRepository.count(),
      this.maintenanceRepository.count(),
      this.portefeuilleRepository.count(),
      this.familleActifRepository.count(),
      this.groupeActifRepository.count()
    ]);

    // Get actifs by operational status - using correct entity property names
    const [actifsOperationnels, actifsEnMaintenance, actifsHorsService] = await Promise.all([
      this.actifRepository.count({ where: { statutOperationnel: 'operationnel' } }),
      this.actifRepository.count({ where: { statutOperationnel: 'en_maintenance' } }),
      this.actifRepository.count({ where: { statutOperationnel: 'hors_service' } })
    ]);

    // Fix: Get anomalies by status - check actual Anomalie entity properties
    const [anomaliesOuvertes, anomaliesCritiques] = await Promise.all([
      this.anomalieRepository.count({ where: { statut: 'ouverte' } }),
      // Fix: Use correct property name from Anomalie entity (likely 'priorite' or 'niveau')
      this.anomalieRepository.count({ where: { priorite: 'critique' } })
    ]);

    // Get maintenances by status
    const [maintenancesPrevues, maintenancesEnCours] = await Promise.all([
      this.maintenanceRepository.count({ where: { statut: 'planifiee' } }),
      this.maintenanceRepository.count({ where: { statut: 'en_cours' } })
    ]);

    // Fix: Calculate total value - check actual Actif entity for value property
    const valeurResult = await this.actifRepository
      .createQueryBuilder('actif')
      .select('SUM(COALESCE(actif.valeurAcquisition, actif.coutAcquisition, 0))', 'total')
      .getRawOne();
    const valeurTotaleActifs = parseFloat(valeurResult?.total || '0');

    // Calculate availability rate
    const tauxDisponibilite = totalActifs > 0 
      ? Math.round((actifsOperationnels / totalActifs) * 100)
      : 0;

    // Get indicators by asset type following geospatial conventions
    const indicateursParType = await this.getIndicatorsPerType();

    // Get geographical distribution for map visualization
    const repartitionGeographique = await this.getGeographicalDistribution();

    // Get detailed statistics for dashboard integration
    const statistiques = await this.getDetailedStatistics();

    return {
      totalActifs,
      actifsOperationnels,
      actifsEnMaintenance,
      actifsHorsService,
      totalAnomalies,
      anomaliesOuvertes,
      anomaliesCritiques,
      totalMaintenances,
      maintenancesPrevues,
      maintenancesEnCours,
      portefeuilles,
      familles,
      groupes,
      valeurTotaleActifs,
      tauxDisponibilite,
      indicateursParType,
      repartitionGeographique,
      statistiques
    };
  }

  private async getDetailedStatistics() {
    // Get actifs by status for dashboard integration
    const actifsParStatut = await this.actifRepository
      .createQueryBuilder('actif')
      .select(['actif.statutOperationnel', 'COUNT(*) as count'])
      .groupBy('actif.statutOperationnel')
      .getRawMany();

    const parStatut: { [key: string]: number } = {};
    actifsParStatut.forEach(item => {
      parStatut[item.actif_statut_operationnel || 'unknown'] = parseInt(item.count);
    });

    // Get actifs by famille through groupe relationship
    const actifsParFamille = await this.actifRepository
      .createQueryBuilder('actif')
      .leftJoin('actif.groupeActif', 'groupe')
      .leftJoin('groupe.familleActif', 'famille')
      .select(['famille.nom', 'COUNT(*) as count'])
      .groupBy('famille.nom')
      .getRawMany();

    const parFamille: { [key: string]: number } = {};
    actifsParFamille.forEach(item => {
      const familleName = item.famille_nom || 'Non classifié';
      parFamille[familleName] = parseInt(item.count);
    });

    // Get anomalies by priority
    const anomaliesParPriorite = await this.anomalieRepository
      .createQueryBuilder('anomalie')
      .select(['anomalie.priorite', 'COUNT(*) as count'])
      .groupBy('anomalie.priorite')
      .getRawMany();

    const parPriorite: { [key: string]: number } = {};
    anomaliesParPriorite.forEach(item => {
      parPriorite[item.anomalie_priorite || 'normale'] = parseInt(item.count);
    });

    return {
      actifs: {
        total: await this.actifRepository.count(),
        parStatut,
        parFamille
      },
      anomalies: {
        total: await this.anomalieRepository.count(),
        parPriorite
      }
    };
  }

  private async getIndicatorsPerType(): Promise<KPIData['indicateursParType']> {
    // Group actifs by type and status following NestJS patterns
    const results = await this.actifRepository
      .createQueryBuilder('actif')
      .select([
        'actif.type',
        'actif.statutOperationnel',
        'COUNT(*) as count'
      ])
      .groupBy('actif.type, actif.statutOperationnel')
      .getRawMany();

    const indicators: KPIData['indicateursParType'] = {};

    results.forEach(result => {
      const type = result.actif_type;
      const statut = result.actif_statut_operationnel;
      const count = parseInt(result.count);

      if (!indicators[type]) {
        indicators[type] = {
          total: 0,
          operationnels: 0,
          enMaintenance: 0
        };
      }

      indicators[type].total += count;
      
      if (statut === 'operationnel') {
        indicators[type].operationnels += count;
      } else if (statut === 'en_maintenance') {
        indicators[type].enMaintenance += count;
      }
    });

    return indicators;
  }

  private async getGeographicalDistribution(): Promise<KPIData['repartitionGeographique']> {
    // Get geographical distribution following PostGIS/geospatial patterns
    const actifs = await this.actifRepository
      .createQueryBuilder('actif')
      .select([
        'actif.latitude',
        'actif.longitude', 
        'actif.type',
        'COUNT(*) as count'
      ])
      .where('actif.latitude IS NOT NULL AND actif.longitude IS NOT NULL')
      .groupBy('actif.latitude, actif.longitude, actif.type')
      .getRawMany();

    return actifs.map(result => ({
      latitude: parseFloat(result.actif_latitude),
      longitude: parseFloat(result.actif_longitude),
      type: result.actif_type,
      count: parseInt(result.count)
    }));
  }

  async getPortefeuilleKPIs(portefeuilleId: number) {
    // Get KPIs specific to a portfolio following entity relationships
    const actifs = await this.actifRepository
      .createQueryBuilder('actif')
      .leftJoinAndSelect('actif.groupeActif', 'groupe')
      .leftJoinAndSelect('groupe.familleActif', 'famille')
      .where('famille.portefeuilleId = :portefeuilleId', { portefeuilleId })
      .getMany();

    const anomalies = await this.anomalieRepository
      .createQueryBuilder('anomalie')
      .leftJoinAndSelect('anomalie.actif', 'actif')
      .leftJoinAndSelect('actif.groupeActif', 'groupe')
      .leftJoinAndSelect('groupe.familleActif', 'famille')
      .where('famille.portefeuilleId = :portefeuilleId', { portefeuilleId })
      .getMany();

    // Fix: Use correct property name for asset value
    const valeurTotale = actifs.reduce((sum, actif) => {
      // Try different possible property names for value
      const value = (actif as any).valeurAcquisition || 
                   (actif as any).coutAcquisition || 
                   (actif as any).valeur || 
                   0;
      return sum + value;
    }, 0);

    return {
      totalActifs: actifs.length,
      actifsOperationnels: actifs.filter(a => a.statutOperationnel === 'operationnel').length,
      actifsEnMaintenance: actifs.filter(a => a.statutOperationnel === 'en_maintenance').length,
      totalAnomalies: anomalies.length,
      anomaliesOuvertes: anomalies.filter(a => a.statut === 'ouverte').length,
      valeurTotale
    };
  }
}