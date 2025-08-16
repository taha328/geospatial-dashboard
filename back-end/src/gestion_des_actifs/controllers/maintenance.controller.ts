import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { MaintenanceService } from '../services/maintenance.service';
import { Maintenance } from '../entities/maintenance.entity';

@Controller('maintenances')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  async findAll(): Promise<Maintenance[]> {
    return this.maintenanceService.findAll();
  }

  @Get('statistiques')
  async getStatistiquesMaintenance() {
    return this.maintenanceService.getStatistiquesMaintenance();
  }

  @Get('par-type')
  async getMaintenancesParType() {
    return this.maintenanceService.getMaintenancesParType();
  }

  @Get('couts-par-mois')
  async getCoutsMaintenanceParMois() {
    return this.maintenanceService.getCoutsMaintenanceParMois();
  }

  @Get('prevues')
  async findMaintenancesPrevues(): Promise<Maintenance[]> {
    return this.maintenanceService.findMaintenancesPrevues();
  }

  @Get('statut/:statut')
  async findByStatut(@Param('statut') statut: string): Promise<Maintenance[]> {
    return this.maintenanceService.findByStatut(statut);
  }

  @Get('actif/:actifId')
  async findByActif(@Param('actifId', ParseIntPipe) actifId: number): Promise<Maintenance[]> {
    return this.maintenanceService.findByActif(actifId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Maintenance | null> {
    return this.maintenanceService.findOne(id);
  }

  @Post()
  async create(@Body() maintenanceData: Partial<Maintenance>): Promise<Maintenance> {
    return this.maintenanceService.create(maintenanceData);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() maintenanceData: Partial<Maintenance>
  ): Promise<Maintenance | null> {
    return this.maintenanceService.update(id, maintenanceData);
  }

  @Put(':id/demarrer')
  async demarrerMaintenance(
    @Param('id', ParseIntPipe) id: number,
    @Body('technicienResponsable') technicienResponsable: string
  ): Promise<Maintenance | null> {
    return this.maintenanceService.demarrerMaintenance(id, technicienResponsable);
  }

  @Put(':id/terminer')
  async terminerMaintenance(
    @Param('id', ParseIntPipe) id: number,
    @Body() completionData: {
      rapportIntervention: string;
      coutReel?: number;
      piecesRemplacees?: any;
    }
  ): Promise<Maintenance | null> {
    return this.maintenanceService.terminerMaintenance(
      id,
      completionData.rapportIntervention,
      completionData.coutReel,
      completionData.piecesRemplacees
    );
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.maintenanceService.delete(id);
  }
}
