import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ActifService } from '../services/actif.service';
import { Actif } from '../entities/actif.entity';

@Controller('api/actifs')
export class ActifController {
  constructor(private readonly actifService: ActifService) {}

  @Get()
  async findAll(): Promise<Actif[]> {
    return this.actifService.findAll();
  }

  @Get('carte')
  async getActifsPourCarte() {
    return this.actifService.getActifsPourCarte();
  }

  @Get('statut/:statut')
  async findByStatut(@Param('statut') statut: string): Promise<Actif[]> {
    return this.actifService.findByStatut(statut);
  }

  @Get('avec-anomalies')
  async getActifsAvecAnomalies(): Promise<Actif[]> {
    return this.actifService.getActifsAvecAnomalies();
  }

  @Get('en-maintenance')
  async getActifsEnMaintenance(): Promise<Actif[]> {
    return this.actifService.getActifsEnMaintenance();
  }

  @Get('groupe/:groupeId')
  async findByGroupe(@Param('groupeId', ParseIntPipe) groupeId: number): Promise<Actif[]> {
    return this.actifService.findByGroupe(groupeId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Actif | null> {
    return this.actifService.findOne(id);
  }

  @Post()
  async create(@Body() actifData: Partial<Actif>): Promise<Actif> {
    return this.actifService.create(actifData);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() actifData: Partial<Actif>
  ): Promise<Actif | null> {
    return this.actifService.update(id, actifData);
  }

  @Put(':id/statut')
  async updateStatutOperationnel(
    @Param('id', ParseIntPipe) id: number,
    @Body('statut') nouveauStatut: string
  ): Promise<Actif | null> {
    return this.actifService.updateStatutOperationnel(id, nouveauStatut);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.actifService.delete(id);
  }
}
