import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { KPIService, KPIData } from '../services/kpi.service';

@Controller('kpis')
export class KPIController {
  constructor(private readonly kpiService: KPIService) {}

  @Get()
  async getGlobalKPIs(): Promise<KPIData> {
    return this.kpiService.getKPIData();
  }

  @Get('portefeuille/:id')
  async getPortefeuilleKPIs(@Param('id', ParseIntPipe) id: number) {
    return this.kpiService.getPortefeuilleKPIs(id);
  }

  @Get('refresh')
  async refreshKPIs(): Promise<{ message: string; data: KPIData }> {
    const data = await this.kpiService.getKPIData();
    return {
      message: 'KPIs refreshed successfully',
      data
    };
  }
}