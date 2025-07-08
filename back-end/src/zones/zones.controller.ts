import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { Zone } from './zone.entity';

@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  getAll() {
    return this.zonesService.findAll();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number): Promise<Zone | null> {
    return this.zonesService.findOne(id);
  }

  @Post()
  create(@Body() zone: Partial<Zone>) {
    console.log('Received zone:', zone);
    return this.zonesService.create(zone);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() zone: Partial<Zone>): Promise<Zone | null> {
    return this.zonesService.update(id, zone);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.zonesService.delete(id);
  }
}
