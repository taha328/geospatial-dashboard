import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  ParseIntPipe, 
  UseInterceptors, 
  UploadedFiles, 
  HttpException, 
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Storage } from '@google-cloud/storage';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AnomalieService } from '../services/anomalie.service';
import { Anomalie } from '../entities/anomalie.entity';
import { WorkflowService } from '../services/workflow.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET || 'integrated-hawk-466115-q5.appspot.com');

@Controller('anomalies')
@UseGuards(JwtAuthGuard)
export class AnomalieController {
  constructor(
    private readonly anomalieService: AnomalieService,
    private readonly workflowService: WorkflowService,
  ) {
    // Ensure uploads directory exists following project file structure
    this.ensureUploadsDirectory();
  }

  /**
   * Ensure uploads directory exists following project conventions
   */
  private ensureUploadsDirectory(): void {
    const uploadsDir = join(process.cwd(), 'uploads', 'anomalies');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
  }

  @Get()
  async findAll(): Promise<Anomalie[]> {
    return this.anomalieService.findAll();
  }

  @Get('statistiques')
  async getStatistiquesAnomalies() {
    return this.anomalieService.getStatistiquesAnomalies();
  }

  @Get('par-type')
  async getAnomaliesParType() {
    return this.anomalieService.getAnomaliesParType();
  }

  @Get('par-mois')
  async getAnomaliesParMois() {
    return this.anomalieService.getAnomaliesParMois();
  }

  // Endpoints spécifiques pour la carte interactive
  @Get('carte/anomalies')
  async getAnomaliesForMap(): Promise<Anomalie[]> {
    return this.anomalieService.findAnomaliesForMap();
  }

  // ✅ CORRECT ENDPOINT for anomalie reporting from map
  // Supports multiple file uploads, proper validation, and Google Cloud Storage
  // Use this instead of /carte/signaler-anomalie
  @Post('carte/signaler')
  @UseInterceptors(FilesInterceptor('photosAnnexes', 10, {
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  }))
  async signalerAnomalieDepuisCarte(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: any,
  ): Promise<Anomalie> {
    try {
      // Validate body exists
      if (!body) {
        throw new HttpException('Request body is required', HttpStatus.BAD_REQUEST);
      }

      // Parse and validate coordinates first (required fields)
      const latitude = body.latitude ? this.parseFloat(body.latitude, 'latitude') : null;
      const longitude = body.longitude ? this.parseFloat(body.longitude, 'longitude') : null;

      // Validate coordinates following PostGIS standards (must be present)
      if (latitude === null || longitude === null) {
        throw new HttpException('Valid latitude and longitude coordinates are required', HttpStatus.BAD_REQUEST);
      }

      if (latitude < -90 || latitude > 90) {
        throw new HttpException('Latitude must be between -90 and 90 degrees', HttpStatus.BAD_REQUEST);
      }

      if (longitude < -180 || longitude > 180) {
        throw new HttpException('Longitude must be between -180 and 180 degrees', HttpStatus.BAD_REQUEST);
      }

      // Upload files to Google Cloud Storage and get public URLs
      let photosUrls: string[] = [];
      if (files && files.length > 0) {
        photosUrls = await Promise.all(files.map(async (file) => {
          const blob = bucket.file(`anomalies/${Date.now()}-${file.originalname}`);
          const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype,
            predefinedAcl: 'publicRead',
          });
          blobStream.end(file.buffer);
          await new Promise((resolve, reject) => {
            blobStream.on('finish', resolve);
            blobStream.on('error', reject);
          });
          return `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
        }));
      }

      // Parse FormData string values to correct types following project patterns
      const anomalieData = {
        titre: body.titre?.toString().trim(),
        description: body.description?.toString().trim(),
        typeAnomalie: body.typeAnomalie?.toString(),
        priorite: body.priorite?.toString(),
        latitude: latitude, // Now guaranteed to be number, not undefined
        longitude: longitude, // Now guaranteed to be number, not undefined
        rapportePar: body.rapportePar?.toString().trim() || undefined,
        actifId: body.actifId ? this.parseInt(body.actifId, 'actifId') : undefined,
        photosAnnexes: photosUrls, // Use GCS URLs
      };

      // Validate required fields following geospatial dashboard validation patterns
      if (!anomalieData.titre || !anomalieData.description || !anomalieData.typeAnomalie || !anomalieData.priorite) {
        throw new HttpException('Missing required fields: titre, description, typeAnomalie, priorite', HttpStatus.BAD_REQUEST);
      }

      // Validate actifId if provided
      if (body.actifId && (anomalieData.actifId === undefined || anomalieData.actifId <= 0)) {
        throw new HttpException('Invalid actifId value', HttpStatus.BAD_REQUEST);
      }

      // Call service with properly typed data following project service patterns
      return await this.anomalieService.createFromMap(anomalieData);

    } catch (error) {
      // Error handling following NestJS best practices
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Log detailed error for debugging
      console.error('Error in signalerAnomalieDepuisCarte:', {
        message: error.message,
        stack: error.stack,
        body: body,
        files: files?.map(f => ({ filename: f.filename, size: f.size, mimetype: f.mimetype }))
      });
      
      throw new HttpException(
        `Internal server error while creating anomalie: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Safe parseFloat with validation
   */
  private parseFloat(value: any, fieldName: string): number {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new HttpException(`Invalid ${fieldName} value: must be a valid number`, HttpStatus.BAD_REQUEST);
    }
    return parsed;
  }

  /**
   * Safe parseInt with validation
   */
  private parseInt(value: any, fieldName: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new HttpException(`Invalid ${fieldName} value: must be a valid integer`, HttpStatus.BAD_REQUEST);
    }
    return parsed;
  }

  @Get('statut/:statut')
  async findByStatut(@Param('statut') statut: string): Promise<Anomalie[]> {
    try {
      return await this.anomalieService.findByStatut(statut);
    } catch (error) {
      throw new HttpException(`Error finding anomalies by status: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('priorite/:priorite')
  async findByPriorite(@Param('priorite') priorite: string): Promise<Anomalie[]> {
    try {
      return await this.anomalieService.findByPriorite(priorite);
    } catch (error) {
      throw new HttpException(`Error finding anomalies by priority: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('actif/:actifId')
  async findByActif(@Param('actifId', ParseIntPipe) actifId: number): Promise<Anomalie[]> {
    try {
      return await this.anomalieService.findByActif(actifId);
    } catch (error) {
      throw new HttpException(`Error finding anomalies by actif: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Anomalie | null> {
    try {
      const anomalie = await this.anomalieService.findOne(id);
      if (!anomalie) {
        throw new HttpException(`Anomalie with ID ${id} not found`, HttpStatus.NOT_FOUND);
      }
      return anomalie;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(`Error finding anomalie: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async create(@Body() anomalieData: Partial<Anomalie>): Promise<Anomalie> {
    try {
      return await this.anomalieService.create(anomalieData);
    } catch (error) {
      throw new HttpException(`Error creating anomalie: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() anomalieData: Partial<Anomalie>
  ): Promise<Anomalie | null> {
    try {
      return await this.anomalieService.update(id, anomalieData);
    } catch (error) {
      throw new HttpException(`Error updating anomalie: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/assigner')
  async assignerAnomalie(
    @Param('id', ParseIntPipe) id: number,
    @Body('assigneA') assigneA: string
  ): Promise<Anomalie | null> {
    try {
      if (!assigneA) {
        throw new HttpException('assigneA field is required', HttpStatus.BAD_REQUEST);
      }
      return await this.anomalieService.assignerAnomalie(id, assigneA);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(`Error assigning anomalie: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/resoudre')
  async resoudreAnomalie(
    @Param('id', ParseIntPipe) id: number,
    @Body() resolutionData: { actionsCorrectives: string; resolvedBy: string }
  ): Promise<Anomalie | null> {
    try {
      if (!resolutionData.actionsCorrectives || !resolutionData.resolvedBy) {
        throw new HttpException('actionsCorrectives and resolvedBy are required', HttpStatus.BAD_REQUEST);
      }
      return await this.anomalieService.resoudreAnomalie(
        id,
        resolutionData.actionsCorrectives,
        resolutionData.resolvedBy
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(`Error resolving anomalie: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id/prendre-en-charge')
  async takeChargeOfAnomaly(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId') userId?: string
  ): Promise<Anomalie> {
    try {
      return await this.workflowService.takeChargeOfAnomaly(id, userId);
    } catch (error) {
      throw new HttpException(`Error taking charge of anomaly: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    try {
      await this.anomalieService.delete(id);
    } catch (error) {
      throw new HttpException(`Error deleting anomalie: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
