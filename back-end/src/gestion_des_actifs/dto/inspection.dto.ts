import { IsString, IsOptional, IsDateString, IsEnum, IsNumber, IsJSON } from 'class-validator';

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
  @IsJSON()
  photosRapport?: any;

  @IsOptional()
  @IsJSON()
  documentsAnnexes?: any;

  @IsOptional()
  @IsJSON()
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
  @IsJSON()
  photosRapport?: any;

  @IsOptional()
  @IsJSON()
  documentsAnnexes?: any;

  @IsOptional()
  @IsJSON()
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
