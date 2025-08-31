import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PointService } from './point.service';
import { Point } from './point.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('points')
@UseGuards(JwtAuthGuard)
export class PointController {
  constructor(private pointService: PointService) {}

  @Get()
  getAll(): Promise<Point[]> {
    return this.pointService.findAll();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number): Promise<Point | null> {
    return this.pointService.findOne(id);
  }

  @Post()
  create(@Body() body: Partial<Point>): Promise<Point> {
    return this.pointService.create(body);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<Point>): Promise<Point | null> {
    return this.pointService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.pointService.delete(id);
  }
}
