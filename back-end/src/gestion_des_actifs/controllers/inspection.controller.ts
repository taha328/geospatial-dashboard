import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InspectionService } from '../services/inspection.service';
import { CreateInspectionDto, UpdateInspectionDto } from '../dto/inspection.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('inspections')
@UseGuards(JwtAuthGuard)
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Post()
  create(@Body() createInspectionDto: CreateInspectionDto) {
    return this.inspectionService.create(createInspectionDto);
  }

  @Get()
  findAll(@Query('actifId') actifId?: string, @Query('typeInspectionId') typeInspectionId?: string, @Query('statut') statut?: string) {
    if (actifId) {
      return this.inspectionService.findByActif(parseInt(actifId));
    }
    if (typeInspectionId) {
      return this.inspectionService.findByTypeInspection(parseInt(typeInspectionId));
    }
    if (statut) {
      return this.inspectionService.findByStatut(statut);
    }
    return this.inspectionService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.inspectionService.getInspectionStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inspectionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInspectionDto: UpdateInspectionDto) {
    return this.inspectionService.update(+id, updateInspectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inspectionService.remove(+id);
  }
}
