import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ZonesService } from './zones.service';

@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  create(@Body() createZoneDto: any) {
    return this.zonesService.create(createZoneDto);
  }

  @Get()
  findAll() {
    return this.zonesService.findAll();
  }

  @Get('contains-point')
  findZonesContainingPoint(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
  ) {
    return this.zonesService.findZonesContainingPoint(longitude, latitude);
  }

  @Get('within-distance')
  findZonesWithinDistance(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
    @Query('distance') distance: number,
  ) {
    return this.zonesService.findZonesWithinDistance(longitude, latitude, distance);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zonesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateZoneDto: any) {
    return this.zonesService.update(+id, updateZoneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.zonesService.remove(+id);
  }
}