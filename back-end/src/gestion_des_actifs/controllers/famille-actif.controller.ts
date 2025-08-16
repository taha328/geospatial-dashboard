import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { FamilleActifService } from '../services/famille-actif.service';
import { FamilleActif } from '../entities/famille-actif.entity';

@Controller('familles')
export class FamilleActifController {
  constructor(private readonly familleActifService: FamilleActifService) {}

  @Get()
  async findAll(): Promise<FamilleActif[]> {
    return this.familleActifService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<FamilleActif> {
    return this.familleActifService.findOne(id);
  }

  @Get(':id/groupes')
  async getGroupesByFamille(@Param('id', ParseIntPipe) id: number) {
    return this.familleActifService.getGroupesByFamille(id);
  }

  @Post()
  async create(@Body() familleData: Partial<FamilleActif>): Promise<FamilleActif> {
    return this.familleActifService.create(familleData);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() familleData: Partial<FamilleActif>
  ): Promise<FamilleActif> {
    return this.familleActifService.update(id, familleData);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.familleActifService.delete(id);
  }
}
