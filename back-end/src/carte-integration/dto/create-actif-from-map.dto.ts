import { IsString, IsOptional, IsNumber, IsDateString, IsObject } from 'class-validator';

export class CreateActifFromMapDto {
  @IsString()
  nom: string;

  @IsString()
  code: string;

  @IsString()
  type: string;

  @IsString()
  statutOperationnel: string;

  @IsString()
  etatGeneral: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsObject()
  geometry?: any; // GeoJSON geometry object

  @IsOptional()
  @IsDateString()
  dateInstallation?: string;

  @IsOptional()
  @IsDateString()
  dateAcquisition?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
