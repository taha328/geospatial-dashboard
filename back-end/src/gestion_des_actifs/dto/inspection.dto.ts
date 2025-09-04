import { IsString, IsOptional, IsDateString, IsEnum, IsNumber, IsArray, IsUrl } from 'class-validator';

export class CreateInspectionDto {
  @IsString()
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  datePrevue: string;

  @IsOptional()
  @IsDateString()
  dateRealisation?: string;

  @IsOptional()
  @IsEnum(['planifiee', 'en_cours', 'terminee', 'annulee', 'reportee'])
  statut?: string;

  @IsOptional()
  @IsEnum(['bon', 'moyen', 'mauvais', 'critique'])
  resultatGeneral?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  recommandations?: string;

  @IsOptional()
  @IsString()
  inspecteurResponsable?: string;

  @IsOptional()
  @IsString()
  organismeInspection?: string;

  @IsOptional()
  @IsNumber()
  coutInspection?: number;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photosRapport?: string[]; // Array of Google Cloud Storage URLs

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  documentsAnnexes?: string[]; // Array of Google Cloud Storage URLs

  @IsOptional()
  mesuresRelevees?: any;

  @IsOptional()
  @IsEnum(['conforme', 'non_conforme', 'avec_reserves'])
  conformite?: string;

  @IsNumber()
  actifId: number;

  @IsNumber()
  typeInspectionId: number;
}

export class UpdateInspectionDto {
  @IsOptional()
  @IsString()
  titre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  datePrevue?: string;

  @IsOptional()
  @IsDateString()
  dateRealisation?: string;

  @IsOptional()
  @IsEnum(['planifiee', 'en_cours', 'terminee', 'annulee', 'reportee'])
  statut?: string;

  @IsOptional()
  @IsEnum(['bon', 'moyen', 'mauvais', 'critique'])
  resultatGeneral?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  recommandations?: string;

  @IsOptional()
  @IsString()
  inspecteurResponsable?: string;

  @IsOptional()
  @IsString()
  organismeInspection?: string;

  @IsOptional()
  @IsNumber()
  coutInspection?: number;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photosRapport?: string[]; // Array of Google Cloud Storage URLs

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  documentsAnnexes?: string[]; // Array of Google Cloud Storage URLs

  @IsOptional()
  mesuresRelevees?: any;

  @IsOptional()
  @IsEnum(['conforme', 'non_conforme', 'avec_reserves'])
  conformite?: string;

  @IsOptional()
  @IsNumber()
  actifId?: number;

  @IsOptional()
  @IsNumber()
  typeInspectionId?: number;
}
