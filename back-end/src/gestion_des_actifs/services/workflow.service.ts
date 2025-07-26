import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Anomalie } from '../entities/anomalie.entity';
import { Maintenance } from '../entities/maintenance.entity';
import { Actif } from '../entities/actif.entity';

export interface WorkflowTransition {
  id: number;
  type: 'anomalie' | 'maintenance';
  currentStatus: string;
  newStatus: string;
  comment?: string;
  timestamp: Date;
}

export interface AnomalieWorkflow {
  anomalie: Anomalie;
  canCreateMaintenance: boolean;
  canResolve: boolean;
  linkedMaintenance?: Maintenance;
  nextActions: string[];
}

export interface MaintenanceWorkflow {
  maintenance: Maintenance;
  canStart: boolean;
  canComplete: boolean;
  linkedAnomalie?: Anomalie;
  nextActions: string[];
}

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Anomalie)
    private anomalieRepository: Repository<Anomalie>,
    @InjectRepository(Maintenance)
    private maintenanceRepository: Repository<Maintenance>,
    @InjectRepository(Actif)
    private actifRepository: Repository<Actif>,
  ) {}

  /**
   * Get workflow information for an anomaly
   */
  async getAnomalieWorkflow(anomalieId: number): Promise<AnomalieWorkflow> {
    const anomalie = await this.anomalieRepository.findOne({
      where: { id: anomalieId },
      relations: ['actif', 'maintenance']
    });

    if (!anomalie) {
      throw new Error('Anomalie not found');
    }

    const canCreateMaintenance = anomalie.statut === 'nouveau' || anomalie.statut === 'en_cours';
    const canResolve = anomalie.statut === 'en_cours' && 
                      (!anomalie.maintenance || anomalie.maintenance.statut === 'terminee');

    const nextActions: string[] = [];
    
    if (canCreateMaintenance && !anomalie.maintenance) {
      nextActions.push('Créer maintenance corrective');
    }
    
    if (anomalie.statut === 'nouveau') {
      nextActions.push('Prendre en charge');
    }
    
    if (canResolve) {
      nextActions.push('Marquer comme résolu');
    }

    return {
      anomalie,
      canCreateMaintenance,
      canResolve,
      linkedMaintenance: anomalie.maintenance,
      nextActions
    };
  }

  /**
   * Get workflow information for a maintenance
   */
  async getMaintenanceWorkflow(maintenanceId: number): Promise<MaintenanceWorkflow> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id: maintenanceId },
      relations: ['actif', 'anomalie']
    });

    if (!maintenance) {
      throw new Error('Maintenance not found');
    }

    const canStart = maintenance.statut === 'planifiee';
    const canComplete = maintenance.statut === 'en_cours';

    const nextActions: string[] = [];
    
    if (canStart) {
      nextActions.push('Démarrer la maintenance');
    }
    
    if (canComplete) {
      nextActions.push('Terminer la maintenance');
    }
    
    if (maintenance.statut === 'terminee' && maintenance.anomalie && maintenance.anomalie.statut !== 'resolu') {
      nextActions.push('Résoudre l\'anomalie liée');
    }

    return {
      maintenance,
      canStart,
      canComplete,
      linkedAnomalie: maintenance.anomalie,
      nextActions
    };
  }

  /**
   * Create corrective maintenance from an anomaly
   */
  async createMaintenanceFromAnomalie(anomalieId: number, maintenanceData: {
    titre?: string;
    description?: string;
    datePrevue: Date;
    technicienResponsable?: string;
    coutEstime?: number;
  }): Promise<Maintenance> {
    const anomalie = await this.anomalieRepository.findOne({
      where: { id: anomalieId },
      relations: ['actif']
    });

    if (!anomalie) {
      throw new Error('Anomalie not found');
    }

    if (anomalie.maintenance) {
      throw new Error('Cette anomalie a déjà une maintenance associée');
    }

    // Create corrective maintenance
    const maintenance = this.maintenanceRepository.create({
      titre: maintenanceData.titre || `Maintenance corrective - ${anomalie.titre}`,
      description: maintenanceData.description || 
                  `Maintenance corrective pour résoudre l'anomalie: ${anomalie.description}`,
      typeMaintenance: 'corrective',
      statut: 'planifiee',
      datePrevue: maintenanceData.datePrevue,
      actifId: anomalie.actifId,
      anomalieId: anomalie.id,
      technicienResponsable: maintenanceData.technicienResponsable,
      coutEstime: maintenanceData.coutEstime || 0
    });

    const savedMaintenance = await this.maintenanceRepository.save(maintenance);

    // Update anomaly status and link to maintenance
    await this.anomalieRepository.update(anomalieId, {
      statut: 'en_cours',
      maintenanceId: savedMaintenance.id
    });

    return savedMaintenance;
  }

  /**
   * Start maintenance execution
   */
  async startMaintenance(maintenanceId: number): Promise<Maintenance> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id: maintenanceId }
    });

    if (!maintenance) {
      throw new Error('Maintenance not found');
    }

    if (maintenance.statut !== 'planifiee') {
      throw new Error('Cette maintenance ne peut pas être démarrée');
    }

    await this.maintenanceRepository.update(maintenanceId, {
      statut: 'en_cours',
      dateDebut: new Date()
    });

    const result = await this.maintenanceRepository.findOne({ where: { id: maintenanceId } });
    if (!result) {
      throw new Error('Maintenance not found after update');
    }
    return result;
  }

  /**
   * Complete maintenance and optionally resolve linked anomaly
   */
  async completeMaintenance(maintenanceId: number, completionData: {
    rapportIntervention?: string;
    coutReel?: number;
    piecesRemplacees?: any;
    resolveLinkedAnomaly?: boolean;
  }): Promise<{ maintenance: Maintenance; anomalie?: Anomalie }> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id: maintenanceId },
      relations: ['anomalie']
    });

    if (!maintenance) {
      throw new Error('Maintenance not found');
    }

    if (maintenance.statut !== 'en_cours') {
      throw new Error('Cette maintenance ne peut pas être terminée');
    }

    // Update maintenance
    await this.maintenanceRepository.update(maintenanceId, {
      statut: 'terminee',
      dateFin: new Date(),
      rapportIntervention: completionData.rapportIntervention,
      coutReel: completionData.coutReel,
      piecesRemplacees: completionData.piecesRemplacees
    });

    const updatedMaintenance = await this.maintenanceRepository.findOne({
      where: { id: maintenanceId },
      relations: ['anomalie']
    });

    let updatedAnomalie: Anomalie | undefined;

    // If maintenance was corrective and should resolve the anomaly
    if (maintenance.anomalie && completionData.resolveLinkedAnomaly) {
      await this.anomalieRepository.update(maintenance.anomalie.id, {
        statut: 'resolu',
        dateResolution: new Date(),
        actionsCorrectives: completionData.rapportIntervention || 'Maintenance corrective terminée'
      });

      const foundAnomalie = await this.anomalieRepository.findOne({
        where: { id: maintenance.anomalie.id }
      });
      updatedAnomalie = foundAnomalie || undefined;
    }

    return {
      maintenance: updatedMaintenance!,
      anomalie: updatedAnomalie
    };
  }

  /**
   * Resolve anomaly (when no maintenance is needed)
   */
  async resolveAnomalie(anomalieId: number, resolutionData: {
    actionsCorrectives: string;
    resolvedBy?: string;
  }): Promise<Anomalie> {
    const anomalie = await this.anomalieRepository.findOne({
      where: { id: anomalieId }
    });

    if (!anomalie) {
      throw new Error('Anomalie not found');
    }

    if (anomalie.statut === 'resolu' || anomalie.statut === 'ferme') {
      throw new Error('Cette anomalie est déjà résolue');
    }

    await this.anomalieRepository.update(anomalieId, {
      statut: 'resolu',
      dateResolution: new Date(),
      actionsCorrectives: resolutionData.actionsCorrectives,
      assigneA: resolutionData.resolvedBy
    });

    const result = await this.anomalieRepository.findOne({ where: { id: anomalieId } });
    if (!result) {
      throw new Error('Anomalie not found after update');
    }
    return result;
  }

  /**
   * Get workflow summary for an asset
   */
  async getAssetWorkflowSummary(actifId: number): Promise<{
    anomaliesEnCours: number;
    anomaliesResolues: number;
    maintenancesPlanifiees: number;
    maintenancesEnCours: number;
    maintenancesTerminees: number;
    workflowItems: Array<{
      type: 'anomalie' | 'maintenance';
      id: number;
      titre: string;
      statut: string;
      priority?: string;
      dateCreation: Date;
      linkedItemId?: number;
    }>;
  }> {
    const anomalies = await this.anomalieRepository.find({
      where: { actifId },
      relations: ['maintenance'],
      order: { dateCreation: 'DESC' }
    });

    const maintenances = await this.maintenanceRepository.find({
      where: { actifId },
      relations: ['anomalie'],
      order: { dateCreation: 'DESC' }
    });

    const workflowItems = [
      ...anomalies.map(a => ({
        type: 'anomalie' as const,
        id: a.id,
        titre: a.titre,
        statut: a.statut,
        priority: a.priorite,
        dateCreation: a.dateCreation,
        linkedItemId: a.maintenanceId
      })),
      ...maintenances.map(m => ({
        type: 'maintenance' as const,
        id: m.id,
        titre: m.titre,
        statut: m.statut,
        dateCreation: m.dateCreation,
        linkedItemId: m.anomalieId
      }))
    ].sort((a, b) => b.dateCreation.getTime() - a.dateCreation.getTime());

    return {
      anomaliesEnCours: anomalies.filter(a => ['nouveau', 'en_cours'].includes(a.statut)).length,
      anomaliesResolues: anomalies.filter(a => a.statut === 'resolu').length,
      maintenancesPlanifiees: maintenances.filter(m => m.statut === 'planifiee').length,
      maintenancesEnCours: maintenances.filter(m => m.statut === 'en_cours').length,
      maintenancesTerminees: maintenances.filter(m => m.statut === 'terminee').length,
      workflowItems
    };
  }
}
