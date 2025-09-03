import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TypeInspectionGroupeService } from '../services/type-inspection-groupe.service';
import { TypeInspectionGroupe } from '../entities/type-inspection-groupe.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('api/type-inspection-groupes')
@UseGuards(JwtAuthGuard)
export class TypeInspectionGroupeController {
  constructor(private readonly typeInspectionGroupeService: TypeInspectionGroupeService) {}

  @Post()
  create(@Body() createTypeInspectionGroupeDto: Partial<TypeInspectionGroupe>) {
    return this.typeInspectionGroupeService.create(createTypeInspectionGroupeDto);
  }

  @Get()
  findAll() {
    return this.typeInspectionGroupeService.findAll();
  }

  @Get('statistics')
  getStatistics() {
    return this.typeInspectionGroupeService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.typeInspectionGroupeService.findOne(+id);
  }

  @Get('groupe/:numeroGroupe')
  findByGroupe(@Param('numeroGroupe') numeroGroupe: string) {
    return this.typeInspectionGroupeService.findByGroupe(+numeroGroupe);
  }

  @Get('inspection/:numeroInspection')
  findByInspection(@Param('numeroInspection') numeroInspection: string) {
    return this.typeInspectionGroupeService.findByInspection(+numeroInspection);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTypeInspectionGroupeDto: Partial<TypeInspectionGroupe>) {
    return this.typeInspectionGroupeService.update(+id, updateTypeInspectionGroupeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.typeInspectionGroupeService.remove(+id);
  }
}
