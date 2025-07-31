import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { AnomalieService } from '../services/anomalie.service';
import { Anomalie } from '../entities/anomalie.entity';
import { WorkflowService } from '../services/workflow.service';

@Controller('api/anomalies')
export class AnomalieController {
  constructor(
    private readonly anomalieService: AnomalieService,
    private readonly workflowService: WorkflowService,
  ) {}

  @Get()
  async findAll(): Promise<Anomalie[]> {
    return this.anomalieService.findAll();
  }

  @Get('statistiques')
  async getStatistiquesAnomalies() {
    return this.anomalieService.getStatistiquesAnomalies();
  }

  @Get('par-type')
  async getAnomaliesParType() {
    return this.anomalieService.getAnomaliesParType();
  }

  @Get('par-mois')
  async getAnomaliesParMois() {
    return this.anomalieService.getAnomaliesParMois();
  }

  // Endpoints spécifiques pour la carte interactive
  @Get('carte/anomalies')
  async getAnomaliesForMap(): Promise<Anomalie[]> {
    return this.anomalieService.findAnomaliesForMap();
  }

  @Post('carte/signaler')
  async signalerAnomalieDepuisCarte(@Body() anomalieData: {
    titre: string;
    description: string;
    typeAnomalie: string;
    priorite: string;
    latitude: number;
    longitude: number;
    rapportePar?: string;
    actifId?: number;
  }): Promise<Anomalie> {
    return this.anomalieService.createFromMap(anomalieData);
  }

  @Get('statut/:statut')
  async findByStatut(@Param('statut') statut: string): Promise<Anomalie[]> {
    return this.anomalieService.findByStatut(statut);
  }

  @Get('priorite/:priorite')
  async findByPriorite(@Param('priorite') priorite: string): Promise<Anomalie[]> {
    return this.anomalieService.findByPriorite(priorite);
  }

  @Get('actif/:actifId')
  async findByActif(@Param('actifId', ParseIntPipe) actifId: number): Promise<Anomalie[]> {
    return this.anomalieService.findByActif(actifId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Anomalie | null> {
    return this.anomalieService.findOne(id);
  }

  @Post()
  async create(@Body() anomalieData: Partial<Anomalie>): Promise<Anomalie> {
    return this.anomalieService.create(anomalieData);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() anomalieData: Partial<Anomalie>
  ): Promise<Anomalie | null> {
    return this.anomalieService.update(id, anomalieData);
  }

  @Put(':id/assigner')
  async assignerAnomalie(
    @Param('id', ParseIntPipe) id: number,
    @Body('assigneA') assigneA: string
  ): Promise<Anomalie | null> {
    return this.anomalieService.assignerAnomalie(id, assigneA);
  }

  @Put(':id/resoudre')
  async resoudreAnomalie(
    @Param('id', ParseIntPipe) id: number,
    @Body() resolutionData: { actionsCorrectives: string; resolvedBy: string }
  ): Promise<Anomalie | null> {
    return this.anomalieService.resoudreAnomalie(
      id,
      resolutionData.actionsCorrectives,
      resolutionData.resolvedBy
    );
  }

  @Put(':id/prendre-en-charge')
  async takeChargeOfAnomaly(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId') userId?: string
  ): Promise<Anomalie> {
    return this.workflowService.takeChargeOfAnomaly(id, userId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.anomalieService.delete(id);
  }
}
