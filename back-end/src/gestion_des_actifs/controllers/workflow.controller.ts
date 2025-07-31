import { Controller, Post, Put, Get, Param, Body, ParseIntPipe, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { WorkflowService } from '../services/workflow.service';

@Controller('workflow')
export class WorkflowController {
  private readonly logger = new Logger(WorkflowController.name);

  constructor(private readonly workflowService: WorkflowService) {}

  @Post('anomalie/:id/create-maintenance')
  async createMaintenanceFromAnomalie(
    @Param('id', ParseIntPipe) anomalieId: number,
    @Body() maintenanceData: {
      titre?: string;
      description?: string;
      typeMaintenance: string; // Added this line
      datePrevue: string;
      technicienResponsable?: string;
      coutEstime?: number;
    }
  ) {
    this.logger.log(`Creating maintenance from anomalie ${anomalieId}`);
    this.logger.debug(`Payload: ${JSON.stringify(maintenanceData)}`);

    try {
      // Validate and convert date
      if (!maintenanceData.datePrevue) {
        throw new Error('datePrevue is required');
      }

      const datePrevue = new Date(maintenanceData.datePrevue);
      if (isNaN(datePrevue.getTime())) {
        throw new Error('Invalid datePrevue format');
      }

      const result = await this.workflowService.createMaintenanceFromAnomalie(anomalieId, {
        ...maintenanceData,
        datePrevue,
        typeMaintenance: maintenanceData.typeMaintenance || 'corrective' // Ensure it's passed
      });

      return {
        success: true,
        message: 'Maintenance créée avec succès',
        data: result
      };
    } catch (error) {
      this.logger.error(`Error creating maintenance: ${error.message}`, error.stack);
      
      throw new HttpException({
        success: false,
        message: error.message || 'Erreur lors de la création de la maintenance',
      }, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('anomalie/:id')
  async getAnomalieWorkflow(@Param('id', ParseIntPipe) anomalieId: number) {
    try {
      return await this.workflowService.getAnomalieWorkflow(anomalieId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get('maintenance/:id')
  async getMaintenanceWorkflow(@Param('id', ParseIntPipe) maintenanceId: number) {
    try {
      return await this.workflowService.getMaintenanceWorkflow(maintenanceId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Put('maintenance/:id/start')
  async startMaintenance(@Param('id', ParseIntPipe) maintenanceId: number) {
    this.logger.log(`Starting maintenance ${maintenanceId}`);
    try {
      const result = await this.workflowService.startMaintenance(maintenanceId);
      return {
        success: true,
        message: 'Maintenance démarrée avec succès',
        data: result
      };
    } catch (error) {
      this.logger.error(`Error starting maintenance: ${error.message}`, error.stack);
      throw new HttpException({
        success: false,
        message: error.message || 'Erreur lors du démarrage de la maintenance',
      }, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('maintenance/:id/complete')
  async completeMaintenance(
    @Param('id', ParseIntPipe) maintenanceId: number,
    @Body() completionData: {
      rapportIntervention?: string;
      coutReel?: number;
      piecesRemplacees?: any;
      resolveLinkedAnomaly?: boolean;
    }
  ) {
    this.logger.log(`Completing maintenance ${maintenanceId}`);
    try {
      const result = await this.workflowService.completeMaintenance(maintenanceId, completionData);
      return {
        success: true,
        message: 'Maintenance terminée avec succès',
        data: result
      };
    } catch (error) {
      this.logger.error(`Error completing maintenance: ${error.message}`, error.stack);
      throw new HttpException({
        success: false,
        message: error.message || 'Erreur lors de la finalisation de la maintenance',
      }, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('anomalie/:id/resolve')
  async resolveAnomalie(
    @Param('id', ParseIntPipe) anomalieId: number,
    @Body() resolutionData: {
      actionsCorrectives: string;
      resolvedBy?: string;
    }
  ) {
    try {
      const result = await this.workflowService.resolveAnomalie(anomalieId, resolutionData);
      return {
        success: true,
        message: 'Anomalie résolue avec succès',
        anomalie: result
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
