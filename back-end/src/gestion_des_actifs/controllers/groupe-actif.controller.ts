import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { GroupeActifService } from '../services/groupe-actif.service';
import { GroupeActif } from '../entities/groupe-actif.entity';

@Controller('groupes')
export class GroupeActifController {
  constructor(private readonly groupeActifService: GroupeActifService) {}

  @Get()
  async findAll(): Promise<GroupeActif[]> {
    return this.groupeActifService.findAll();
  }

  @Get('for-actif-creation')
  async getGroupsForActifCreation(
    @Query('familleId') familleId?: number
  ): Promise<GroupeActif[]> {
    console.log('🔍 Getting groups for actif creation, familleId:', familleId);
    return this.groupeActifService.findAvailableForActifCreation(familleId);
  }

  @Get('by-famille/:familleId')
  async findByFamille(@Param('familleId', ParseIntPipe) familleId: number): Promise<GroupeActif[]> {
    console.log('🔍 Finding groups by famille:', familleId);
    return this.groupeActifService.findByFamille(familleId);
  }

  @Get('with-counts')
  async findAllWithActifCounts(): Promise<any[]> {
    return this.groupeActifService.findAllWithActifCounts();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<GroupeActif> {
    return this.groupeActifService.findOne(id);
  }

  @Get(':id/actifs')
  async getActifsByGroupe(@Param('id', ParseIntPipe) id: number) {
    return this.groupeActifService.getActifsByGroupe(id);
  }

  @Post()
  async create(@Body() groupeData: Partial<GroupeActif>): Promise<GroupeActif> {
    console.log('🆕 Creating new groupe actif:', groupeData);
    return this.groupeActifService.create(groupeData);
  }

  @Post('seed-sample-data')
  async seedSampleGroups(): Promise<{ message: string; count: number }> {
    console.log('🌱 Seeding sample groupe actifs...');
    const count = await this.groupeActifService.createSampleGroups();
    return { 
      message: 'Sample groupe actifs created successfully',
      count 
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() groupeData: Partial<GroupeActif>
  ): Promise<GroupeActif> {
    return this.groupeActifService.update(id, groupeData);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.groupeActifService.delete(id);
  }
}
