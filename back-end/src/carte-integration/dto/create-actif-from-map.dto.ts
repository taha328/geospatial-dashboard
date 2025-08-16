import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

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
  @IsString()
  dateMiseEnService?: string;

  @IsOptional()
  @IsString()
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
  @IsString()
  groupeActifId?: string;

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
