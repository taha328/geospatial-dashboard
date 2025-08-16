import { Controller, Get, Post, Body, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { CarteIntegrationService } from '../services/carte-integration.service';
import { AnomalieService } from '../gestion_des_actifs/services/anomalie.service';
import { CreateActifFromMapDto } from '../carte-integration/dto/create-actif-from-map.dto';

@Controller('carte')
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
  @UseInterceptors(FileInterceptor('image'))
  async signalerAnomalieDepuisCarte(
    @Body() anomalieData: {
      titre: string;
      description: string;
      typeAnomalie: 'structural' | 'mecanique' | 'electrique' | 'securite' | 'autre';
      priorite: 'faible' | 'moyen' | 'eleve' | 'critique';
      latitude: string;
      longitude: string;
      rapportePar?: string;
      actifId?: string;
    },
    @UploadedFile() image?: Express.Multer.File
  ) {
    // Convert string coordinates to numbers
    const processedData = {
      ...anomalieData,
      latitude: parseFloat(anomalieData.latitude),
      longitude: parseFloat(anomalieData.longitude),
      actifId: anomalieData.actifId ? parseInt(anomalieData.actifId, 10) : undefined,
    };

    // Handle image if uploaded
    let photosAnnexes: any = null;
    if (image) {
      photosAnnexes = {
        filename: image.originalname,
        mimetype: image.mimetype,
        size: image.size,
        data: image.buffer.toString('base64'), // Convert to base64 for JSON storage
        uploadDate: new Date().toISOString()
      };
    }

    return this.anomalieService.createFromMap({
      ...processedData,
      photosAnnexes
    });
  }

  @Post('actifs')
  async createActif(@Body() actifData: CreateActifFromMapDto) {
    try {
      // Transform the DTO data to match the service interface
      const serviceData = {
        nom: actifData.nom,
        code: actifData.code,
        type: actifData.type,
        statutOperationnel: actifData.statutOperationnel,
        etatGeneral: actifData.etatGeneral,
        latitude: actifData.latitude,
        longitude: actifData.longitude,
        geometry: actifData.geometry,
      };

      return await this.carteIntegrationService.createActif(serviceData);
    } catch (error) {
      // Renvoyer une réponse d'erreur appropriée
      throw new HttpException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error.message || 'Erreur lors de la création de l\'actif',
        error: 'Bad Request'
      }, HttpStatus.BAD_REQUEST);
    }
  }
}
