import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm'; // Add DataSource here
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
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectRepository(Anomalie)
    private anomalieRepository: Repository<Anomalie>,
    @InjectRepository(Maintenance)
    private maintenanceRepository: Repository<Maintenance>,
    @InjectRepository(Actif)
    private actifRepository: Repository<Actif>,
      private dataSource: DataSource,
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
    typeMaintenance: string;
    datePrevue: Date;
    technicienResponsable?: string;
    coutEstime?: number;
  }): Promise<Maintenance> {
    this.logger.log(`Creating maintenance from anomalie ${anomalieId}`);
    
    return this.dataSource.transaction(async manager => {
      // Find the anomalie
      const anomalie = await manager.findOne(Anomalie, {
        where: { id: anomalieId },
        relations: ['actif']
      });

      if (!anomalie) {
        throw new Error(`Anomalie with ID ${anomalieId} not found`);
      }

      if (anomalie.maintenanceId) {
        throw new Error('Cette anomalie a déjà une maintenance associée');
      }

      // CRITICAL: Check if anomaly is linked to an asset
      if (!anomalie.actifId) {
        throw new Error(`Anomalie ${anomalieId} n'est pas liée à un actif. Impossible de créer une maintenance.`);
      }

      // Create maintenance with all required fields
      const maintenance = manager.create(Maintenance, {
        titre: maintenanceData.titre || `Maintenance corrective - ${anomalie.titre}`,
        description: maintenanceData.description || `Maintenance corrective pour l'anomalie: ${anomalie.description}`,
        typeMaintenance: 'corrective',
        statut: 'planifiee',
        datePrevue: maintenanceData.datePrevue,
        actifId: anomalie.actifId,
        anomalieId: anomalie.id,
        technicienResponsable: maintenanceData.technicienResponsable || 'À assigner',
        coutEstime: maintenanceData.coutEstime || 0,
        dateCreation: new Date(),
        dateMiseAJour: new Date()
      });

      const savedMaintenance = await manager.save(maintenance);

      // Update anomaly status
      await manager.update(Anomalie, anomalieId, {
        statut: 'en_cours',
        maintenanceId: savedMaintenance.id,
        dateMiseAJour: new Date()
      });

      this.logger.log(`Maintenance ${savedMaintenance.id} created successfully`);
      return savedMaintenance;
    });
  }

  /**
   * Take charge of an anomaly, setting its status to 'en_cours'
   */
  async takeChargeOfAnomaly(anomalieId: number, userId?: string): Promise<Anomalie> {
    this.logger.log(`Taking charge of anomalie ${anomalieId}`);
    
    const anomalie = await this.anomalieRepository.findOne({ where: { id: anomalieId } });

    if (!anomalie) {
      throw new Error(`Anomalie with ID ${anomalieId} not found`);
    }

    if (anomalie.statut !== 'nouveau') {
      throw new Error('Cette anomalie a déjà été prise en charge ou est résolue.');
    }

    await this.anomalieRepository.update(anomalieId, {
      statut: 'en_cours',
      assigneA: userId || 'Equipe maintenance', // Default assignee
      dateMiseAJour: new Date(),
    });

    const updatedAnomalie = await this.anomalieRepository.findOne({ where: { id: anomalieId } });
    if (!updatedAnomalie) {
      throw new Error('Anomalie not found after update');
    }
    
    this.logger.log(`Anomalie ${updatedAnomalie.id} status updated to 'en_cours'`);
    return updatedAnomalie;
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
    dateDebut?: string;
    dateFin?: string;
    rapportIntervention?: string;
    coutReel?: number;
    entrepriseExterne?: string;
    piecesRemplacees?: string;
    documentAnnexe?: string;
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

    // Parse dates from string format (datetime-local)
    const dateDebut = completionData.dateDebut ? new Date(completionData.dateDebut) : new Date();
    const dateFin = completionData.dateFin ? new Date(completionData.dateFin) : new Date();

    // Validate dates
    if (dateFin < dateDebut) {
      throw new Error('La date de fin ne peut pas être antérieure à la date de début');
    }

    // Parse and prepare pieces remplacees data
    let piecesRemplacees: any = null;
    if (completionData.piecesRemplacees) {
      try {
        // Try to parse as JSON if it looks like JSON
        piecesRemplacees = JSON.parse(completionData.piecesRemplacees);
      } catch {
        // If not JSON, split by newlines and store as array
        piecesRemplacees = completionData.piecesRemplacees
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      }
    }

    // Parse and prepare documents annexes data
    let documentsAnnexes: any = null;
    if (completionData.documentAnnexe) {
      documentsAnnexes = completionData.documentAnnexe
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }

    // Update maintenance with all completion details
    await this.maintenanceRepository.update(maintenanceId, {
      statut: 'terminee',
      dateDebut: dateDebut,
      dateFin: dateFin,
      rapportIntervention: completionData.rapportIntervention,
      coutReel: completionData.coutReel,
      entrepriseExterne: completionData.entrepriseExterne,
      piecesRemplacees: piecesRemplacees,
      documentsAnnexes: documentsAnnexes,
      dateMiseAJour: new Date()
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
   * Update completed maintenance details (for export purposes)
   */
  async updateCompletedMaintenance(maintenanceId: number, updateData: {
    dateDebut?: string;
    dateFin?: string;
    rapportIntervention?: string;
    coutReel?: number;
    entrepriseExterne?: string;
    piecesRemplacees?: string;
    documentAnnexe?: string;
  }): Promise<Maintenance> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id: maintenanceId },
      relations: ['anomalie']
    });

    if (!maintenance) {
      throw new Error('Maintenance not found');
    }

    if (maintenance.statut !== 'terminee') {
      throw new Error('Cette méthode ne peut être utilisée que pour les maintenances terminées');
    }

    // Parse dates from string format (datetime-local)
    let dateDebut = maintenance.dateDebut;
    let dateFin = maintenance.dateFin;
    
    if (updateData.dateDebut) {
      dateDebut = new Date(updateData.dateDebut);
    }
    if (updateData.dateFin) {
      dateFin = new Date(updateData.dateFin);
    }

    // Validate dates if both are provided
    if (dateDebut && dateFin && dateFin < dateDebut) {
      throw new Error('La date de fin ne peut pas être antérieure à la date de début');
    }

    // Parse and prepare pieces remplacees data
    let piecesRemplacees: any = maintenance.piecesRemplacees;
    if (updateData.piecesRemplacees) {
      try {
        // Try to parse as JSON if it looks like JSON
        piecesRemplacees = JSON.parse(updateData.piecesRemplacees);
      } catch {
        // If not JSON, split by newlines and store as array
        piecesRemplacees = updateData.piecesRemplacees
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
      }
    }

    // Parse and prepare documents annexes data
    let documentsAnnexes: any = maintenance.documentsAnnexes;
    if (updateData.documentAnnexe) {
      documentsAnnexes = updateData.documentAnnexe
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }

    // Update maintenance with new details (keeping status as 'terminee')
    await this.maintenanceRepository.update(maintenanceId, {
      dateDebut: dateDebut,
      dateFin: dateFin,
      rapportIntervention: updateData.rapportIntervention || maintenance.rapportIntervention,
      coutReel: updateData.coutReel !== undefined ? updateData.coutReel : maintenance.coutReel,
      entrepriseExterne: updateData.entrepriseExterne !== undefined ? updateData.entrepriseExterne : maintenance.entrepriseExterne,
      piecesRemplacees: piecesRemplacees,
      documentsAnnexes: documentsAnnexes,
      dateMiseAJour: new Date()
    });

    const updatedMaintenance = await this.maintenanceRepository.findOne({
      where: { id: maintenanceId },
      relations: ['anomalie']
    });

    return updatedMaintenance!;
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
