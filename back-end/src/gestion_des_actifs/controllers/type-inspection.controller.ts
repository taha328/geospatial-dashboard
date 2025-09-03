import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TypeInspectionService } from '../services/type-inspection.service';
import { TypeInspection } from '../entities/type-inspection.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('api/type-inspections')
@UseGuards(JwtAuthGuard)
export class TypeInspectionController {
  constructor(private readonly typeInspectionService: TypeInspectionService) {}

  @Post()
  create(@Body() createTypeInspectionDto: Partial<TypeInspection>) {
    return this.typeInspectionService.create(createTypeInspectionDto);
  }

  @Get()
  findAll() {
    return this.typeInspectionService.findAll();
  }

  @Get('statistics')
  getStatistics() {
    return this.typeInspectionService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.typeInspectionService.findOne(+id);
  }

  @Get('numero/:numeroInspection')
  findByNumeroInspection(@Param('numeroInspection') numeroInspection: string) {
    return this.typeInspectionService.findByNumeroInspection(+numeroInspection);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTypeInspectionDto: Partial<TypeInspection>) {
    return this.typeInspectionService.update(+id, updateTypeInspectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.typeInspectionService.remove(+id);
  }
}
