import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { PortefeuilleService } from '../services/portefeuille.service';
import { Portefeuille } from '../entities/portefeuille.entity';

@Controller('api/portefeuilles')
export class PortefeuilleController {
  constructor(private readonly portefeuilleService: PortefeuilleService) {}

  @Get()
  async findAll(): Promise<Portefeuille[]> {
    return this.portefeuilleService.findAll();
  }

  @Get('hierarchy')
  async getHierarchy() {
    return this.portefeuilleService.getHierarchy();
  }

  @Get('statistiques')
  async getStatistiques() {
    return this.portefeuilleService.getStatistiques();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Portefeuille> {
    return this.portefeuilleService.findOne(id);
  }

  @Get(':id/familles')
  async getFamillesByPortefeuille(@Param('id', ParseIntPipe) id: number) {
    return this.portefeuilleService.getFamillesByPortefeuille(id);
  }

  @Post()
  async create(@Body() portefeuilleData: Partial<Portefeuille>): Promise<Portefeuille> {
    return this.portefeuilleService.create(portefeuilleData);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() portefeuilleData: Partial<Portefeuille>
  ): Promise<Portefeuille> {
    return this.portefeuilleService.update(id, portefeuilleData);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.portefeuilleService.delete(id);
  }
}
