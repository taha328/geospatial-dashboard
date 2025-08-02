import { Controller, Get, Param, ParseIntPipe, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportService } from '../services/report.service';
import { MaintenanceService } from '../services/maintenance.service';

@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  @Get('maintenance/:id')
  async generateMaintenanceReport(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const maintenance = await this.maintenanceService.findOne(id);
    if (!maintenance) {
      return res.status(404).send('Maintenance not found');
    }

    const pdfBuffer = await this.reportService.generateMaintenanceReport(maintenance);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=maintenance-report-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get('maintenance/:id/professional')
  async generateProfessionalMaintenanceReport(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const maintenance = await this.maintenanceService.findOne(id);
    if (!maintenance) {
      return res.status(404).send('Maintenance not found');
    }

    // Check if maintenance has completion details for professional report
    const hasCompletionDetails = maintenance.dateDebut && 
                                maintenance.dateFin && 
                                maintenance.coutReel !== null && 
                                maintenance.coutReel !== undefined;

    if (!hasCompletionDetails && maintenance.statut !== 'terminee') {
      return res.status(400).json({
        error: 'Professional report requires completion details',
        message: 'Cette maintenance n\'a pas encore été complétée avec les détails d\'exécution nécessaires pour générer un rapport professionnel.'
      });
    }

    const pdfBuffer = await this.reportService.generateProfessionalMaintenanceReport(maintenance);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=rapport-professionnel-maintenance-${id}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
