import { Controller, Get, Post, Put, Param, Body, ParseIntPipe } from '@nestjs/common';
import { WorkflowService, AnomalieWorkflow, MaintenanceWorkflow } from '../services/workflow.service';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('anomalie/:id')
  async getAnomalieWorkflow(@Param('id', ParseIntPipe) id: number): Promise<AnomalieWorkflow> {
    return this.workflowService.getAnomalieWorkflow(id);
  }

  @Get('maintenance/:id')
  async getMaintenanceWorkflow(@Param('id', ParseIntPipe) id: number): Promise<MaintenanceWorkflow> {
    return this.workflowService.getMaintenanceWorkflow(id);
  }

  @Get('asset/:id/summary')
  async getAssetWorkflowSummary(@Param('id', ParseIntPipe) actifId: number) {
    return this.workflowService.getAssetWorkflowSummary(actifId);
  }

  @Post('anomalie/:id/create-maintenance')
  async createMaintenanceFromAnomalie(
    @Param('id', ParseIntPipe) anomalieId: number,
    @Body() maintenanceData: {
      titre?: string;
      description?: string;
      datePrevue: string;
      technicienResponsable?: string;
      coutEstime?: number;
    }
  ) {
    return this.workflowService.createMaintenanceFromAnomalie(anomalieId, {
      ...maintenanceData,
      datePrevue: new Date(maintenanceData.datePrevue)
    });
  }

  @Put('maintenance/:id/start')
  async startMaintenance(@Param('id', ParseIntPipe) maintenanceId: number) {
    return this.workflowService.startMaintenance(maintenanceId);
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
    return this.workflowService.completeMaintenance(maintenanceId, completionData);
  }

  @Put('anomalie/:id/resolve')
  async resolveAnomalie(
    @Param('id', ParseIntPipe) anomalieId: number,
    @Body() resolutionData: {
      actionsCorrectives: string;
      resolvedBy?: string;
    }
  ) {
    return this.workflowService.resolveAnomalie(anomalieId, resolutionData);
  }
}
