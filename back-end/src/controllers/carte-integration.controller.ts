import { Controller, Get, Post, Body } from '@nestjs/common';
import { CarteIntegrationService } from '../services/carte-integration.service';
import { AnomalieService } from '../gestion_des_actifs/services/anomalie.service';

@Controller('api/carte')
export class CarteIntegrationController {
  constructor(
    private readonly carteIntegrationService: CarteIntegrationService,
    private readonly anomalieService: AnomalieService,
  ) {}

  @Get('actifs')
  async getActifsForMap() {
    return this.carteIntegrationService.getActifsForMap();
  }

  @Get('anomalies')
  async getAnomaliesForMap() {
    return this.carteIntegrationService.getAnomaliesForMap();
  }

  @Get('dashboard')
  async getCarteDashboard() {
    return this.carteIntegrationService.getCarteDashboard();
  }

  @Post('signaler-anomalie')
  async signalerAnomalieDepuisCarte(@Body() anomalieData: {
    titre: string;
    description: string;
    typeAnomalie: 'structural' | 'mecanique' | 'electrique' | 'securite' | 'autre';
    priorite: 'faible' | 'moyen' | 'eleve' | 'critique';
    latitude: number;
    longitude: number;
    rapportePar?: string;
    actifId?: number;
  }) {
    return this.anomalieService.createFromMap(anomalieData);
  }

  @Post('actifs')
  async createActif(@Body() actifData: {
    nom: string;
    code: string;
    type: string;
    statutOperationnel: string;
    etatGeneral: string;
    geom: {
      type: string;
      coordinates: [number, number];
    };
  }) {
    return this.carteIntegrationService.createActif(actifData);
  }
}
