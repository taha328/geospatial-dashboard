import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ActifService } from '../services/actif.service';
import { Actif } from '../entities/actif.entity';

@Controller('carte/actifs')
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
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('relations') relations?: string
  ) {
    try {
      const includeRelations = relations === 'true';
      const actif = await this.actifService.findOne(id, includeRelations);
      
      if (!actif) {
        throw new NotFoundException(`Actif with ID ${id} not found`);
      }
      
      return actif;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error retrieving actif details');
    }
  }

  @Post()
  async create(@Body() actifData: Partial<Actif>): Promise<Actif> {
    return this.actifService.create(actifData);
  }

  @Post('from-map')
  async createFromMap(@Body() actifData: any): Promise<Actif> {
    return this.actifService.createActifFromMap(actifData);
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
