import { IsString, IsOptional, IsNumber, IsObject, IsDateString } from 'class-validator';

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
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dateMiseEnService?: string;

  @IsOptional()
  @IsDateString()
  dateFinGarantie?: string;

  @IsOptional()
  @IsString()
  fournisseur?: string;

  @IsOptional()
  @IsNumber()
  valeurAcquisition?: number;

  @IsOptional()
  @IsObject()
  specifications?: object;

  @IsOptional()
  @IsNumber()
  groupeActifId?: number;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsObject()
  geometry?: object;
}
