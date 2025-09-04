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
  UseInterceptors,
  UploadedFiles,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Storage } from '@google-cloud/storage';
import { Response } from 'express';
import { InspectionService } from '../services/inspection.service';
import { ReportService } from '../services/report.service';
import { CreateInspectionDto, UpdateInspectionDto } from '../dto/inspection.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET || 'integrated-hawk-466115-q5.appspot.com');

@Controller('inspections')
@UseGuards(JwtAuthGuard)
export class InspectionController {
  constructor(
    private readonly inspectionService: InspectionService,
    private readonly reportService: ReportService,
  ) {}

  @Post()
  create(@Body() createInspectionDto: CreateInspectionDto) {
    return this.inspectionService.create(createInspectionDto);
  }

  // ✅ NEW ENDPOINT for inspection creation/update with documents and photos
  // Supports multiple file uploads for both photos and documents
  @Post('avec-fichiers')
  @UseInterceptors(FilesInterceptor('files', 20, {
    limits: { fileSize: 10 * 1024 * 1024, files: 20 }, // 10MB per file, max 20 files
  }))
  async createAvecFichiers(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: any,
  ) {
    try {
      // Validate body exists
      if (!body) {
        throw new HttpException('Request body is required', HttpStatus.BAD_REQUEST);
      }

      // Separate files into photos and documents based on file type or field name
      const photosFiles: Express.Multer.File[] = [];
      const documentsFiles: Express.Multer.File[] = [];

      if (files && files.length > 0) {
        files.forEach(file => {
          // Check if it's an image file (photos)
          if (file.mimetype.startsWith('image/')) {
            photosFiles.push(file);
          } else {
            // All other files are considered documents
            documentsFiles.push(file);
          }
        });
      }

      // Upload photos to Google Cloud Storage
      let photosUrls: string[] = [];
      if (photosFiles.length > 0) {
        photosUrls = await Promise.all(photosFiles.map(async (file) => {
          const blob = bucket.file(`inspections/photos/${Date.now()}-${file.originalname}`);
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

      // Upload documents to Google Cloud Storage
      let documentsUrls: string[] = [];
      if (documentsFiles.length > 0) {
        documentsUrls = await Promise.all(documentsFiles.map(async (file) => {
          const blob = bucket.file(`inspections/documents/${Date.now()}-${file.originalname}`);
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

      // Parse FormData string values to correct types
      const inspectionData: CreateInspectionDto = {
        titre: body.titre?.toString().trim(),
        description: body.description?.toString().trim(),
        datePrevue: body.datePrevue?.toString(),
        dateRealisation: body.dateRealisation?.toString(),
        statut: body.statut?.toString(),
        resultatGeneral: body.resultatGeneral?.toString(),
        observations: body.observations?.toString().trim(),
        recommandations: body.recommandations?.toString().trim(),
        inspecteurResponsable: body.inspecteurResponsable?.toString().trim(),
        organismeInspection: body.organismeInspection?.toString().trim(),
        coutInspection: body.coutInspection ? this.parseFloat(body.coutInspection, 'coutInspection') : undefined,
        photosRapport: photosUrls.length > 0 ? photosUrls : undefined,
        documentsAnnexes: documentsUrls.length > 0 ? documentsUrls : undefined,
        mesuresRelevees: body.mesuresRelevees ? this.safeParseMesures(body.mesuresRelevees) : undefined,
        conformite: body.conformite?.toString(),
        actifId: this.parseInt(body.actifId, 'actifId'),
        typeInspectionId: this.parseInt(body.typeInspectionId, 'typeInspectionId'),
      };

      // Validate required fields
      if (!inspectionData.titre || !inspectionData.datePrevue || !inspectionData.actifId || !inspectionData.typeInspectionId) {
        throw new HttpException('Missing required fields: titre, datePrevue, actifId, typeInspectionId', HttpStatus.BAD_REQUEST);
      }

      // Call service to create inspection
      return await this.inspectionService.create(inspectionData);

    } catch (error) {
      // Error handling following NestJS best practices
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Log detailed error for debugging
      console.error('Error in createAvecFichiers:', {
        message: error.message,
        stack: error.stack,
        body: body,
        files: files?.map(f => ({ filename: f.originalname, size: f.size, mimetype: f.mimetype }))
      });
      
      throw new HttpException(
        `Internal server error while creating inspection: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ NEW ENDPOINT for updating inspection with files
  @Patch(':id/avec-fichiers')
  @UseInterceptors(FilesInterceptor('files', 20, {
    limits: { fileSize: 10 * 1024 * 1024, files: 20 }, // 10MB per file, max 20 files
  }))
  async updateAvecFichiers(
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: any,
  ) {
    try {
      const inspectionId = this.parseInt(id, 'id');

      // Separate files into photos and documents based on file type
      const photosFiles: Express.Multer.File[] = [];
      const documentsFiles: Express.Multer.File[] = [];

      if (files && files.length > 0) {
        files.forEach(file => {
          if (file.mimetype.startsWith('image/')) {
            photosFiles.push(file);
          } else {
            documentsFiles.push(file);
          }
        });
      }

      // Upload new photos if provided
      let photosUrls: string[] | undefined;
      if (photosFiles.length > 0) {
        photosUrls = await Promise.all(photosFiles.map(async (file) => {
          const blob = bucket.file(`inspections/photos/${Date.now()}-${file.originalname}`);
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

      // Upload new documents if provided
      let documentsUrls: string[] | undefined;
      if (documentsFiles.length > 0) {
        documentsUrls = await Promise.all(documentsFiles.map(async (file) => {
          const blob = bucket.file(`inspections/documents/${Date.now()}-${file.originalname}`);
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

      // Build update data - only include fields that are provided
      const updateData: UpdateInspectionDto = {};
      
      if (body.titre) updateData.titre = body.titre.toString().trim();
      if (body.description) updateData.description = body.description.toString().trim();
      if (body.datePrevue) updateData.datePrevue = body.datePrevue.toString();
      if (body.dateRealisation) {
        // Parse the date properly instead of just converting to string
        const dateRealisation = new Date(body.dateRealisation);
        if (!isNaN(dateRealisation.getTime())) {
          updateData.dateRealisation = dateRealisation.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
        } else {
          throw new HttpException('Invalid dateRealisation format', HttpStatus.BAD_REQUEST);
        }
      }
      if (body.statut) updateData.statut = body.statut.toString();
      if (body.resultatGeneral) updateData.resultatGeneral = body.resultatGeneral.toString();
      if (body.observations) updateData.observations = body.observations.toString().trim();
      if (body.recommandations) updateData.recommandations = body.recommandations.toString().trim();
      if (body.inspecteurResponsable) updateData.inspecteurResponsable = body.inspecteurResponsable.toString().trim();
      if (body.organismeInspection) updateData.organismeInspection = body.organismeInspection.toString().trim();
      if (body.coutInspection) updateData.coutInspection = this.parseFloat(body.coutInspection, 'coutInspection');
      if (body.conformite) updateData.conformite = body.conformite.toString();
      if (body.mesuresRelevees) {
        updateData.mesuresRelevees = this.safeParseMesures(body.mesuresRelevees);
      }
      if (body.actifId) updateData.actifId = this.parseInt(body.actifId, 'actifId');
      if (body.typeInspectionId) updateData.typeInspectionId = this.parseInt(body.typeInspectionId, 'typeInspectionId');

      // Add uploaded files URLs if any
      if (photosUrls) updateData.photosRapport = photosUrls;
      if (documentsUrls) updateData.documentsAnnexes = documentsUrls;

      // Call service to update inspection
      return await this.inspectionService.update(inspectionId, updateData);

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('Error in updateAvecFichiers:', {
        message: error.message,
        stack: error.stack,
        body: body,
        files: files?.map(f => ({ filename: f.originalname, size: f.size, mimetype: f.mimetype }))
      });
      
      throw new HttpException(
        `Internal server error while updating inspection: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Safe JSON parsing for mesuresRelevees field
   */
  private safeParseMesures(value: any): any {
    try {
      // Only parse if it looks like JSON (starts with { or [)
      const mesuresValue = value.toString().trim();
      if (mesuresValue.startsWith('{') || mesuresValue.startsWith('[')) {
        return JSON.parse(mesuresValue);
      } else {
        // If it's just a string, store it as is
        return mesuresValue;
      }
    } catch (jsonError) {
      console.error('JSON parsing error for mesuresRelevees:', jsonError.message, 'Value:', value);
      // Store as string if JSON parsing fails
      return value.toString().trim();
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

  @Get(':id/report')
  async generateInspectionReport(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const inspectionId = parseInt(id, 10);
      if (isNaN(inspectionId)) {
        throw new HttpException('Invalid inspection ID', HttpStatus.BAD_REQUEST);
      }

      const inspection = await this.inspectionService.findOne(inspectionId);
      if (!inspection) {
        throw new HttpException('Inspection not found', HttpStatus.NOT_FOUND);
      }

      // Generate PDF report using ReportService
      const pdfBuffer = await this.reportService.generateInspectionReport(inspection);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=inspection-report-${inspectionId}.pdf`,
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('Error generating inspection report:', {
        message: error.message,
        stack: error.stack,
        inspectionId: id
      });
      
      throw new HttpException(
        'Internal server error while generating inspection report', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
