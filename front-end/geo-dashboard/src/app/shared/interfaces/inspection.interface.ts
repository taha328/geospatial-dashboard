export interface Inspection {
  id: number;
  titre: string;
  description?: string;
  datePrevue: string;
  dateRealisation?: string;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'annulee' | 'reportee';
  resultatGeneral?: 'bon' | 'moyen' | 'mauvais' | 'critique';
  observations?: string;
  recommandations?: string;
  inspecteurResponsable?: string;
  organismeInspection?: string;
  coutInspection?: number;
  photosRapport?: any;
  documentsAnnexes?: any;
  mesuresRelevees?: any;
  conformite?: 'conforme' | 'non_conforme' | 'avec_reserves';
  actifId: number;
  typeInspectionId: number;
  dateCreation: string;
  dateMiseAJour: string;
  actif?: {
    id: number;
    nom: string;
    code: string;
    groupeActif?: {
      id: number;
      groupe_actif: string;
    };
  };
  typeInspection?: {
    id: number;
    type_inspection: string;
    numero_inspection: number;
  };
  anomaliesDetectees?: any[];
}

export interface CreateInspectionDto {
  titre: string;
  description?: string;
  datePrevue: string;
  dateRealisation?: string;
  statut?: 'planifiee' | 'en_cours' | 'terminee' | 'annulee' | 'reportee';
  resultatGeneral?: 'bon' | 'moyen' | 'mauvais' | 'critique';
  observations?: string;
  recommandations?: string;
  inspecteurResponsable?: string;
  organismeInspection?: string;
  coutInspection?: number;
  photosRapport?: any;
  documentsAnnexes?: any;
  mesuresRelevees?: any;
  conformite?: 'conforme' | 'non_conforme' | 'avec_reserves';
  actifId: number;
  typeInspectionId: number;
}

export interface UpdateInspectionDto {
  titre?: string;
  description?: string;
  datePrevue?: string;
  dateRealisation?: string;
  statut?: 'planifiee' | 'en_cours' | 'terminee' | 'annulee' | 'reportee';
  resultatGeneral?: 'bon' | 'moyen' | 'mauvais' | 'critique';
  observations?: string;
  recommandations?: string;
  inspecteurResponsable?: string;
  organismeInspection?: string;
  coutInspection?: number;
  photosRapport?: any;
  documentsAnnexes?: any;
  mesuresRelevees?: any;
  conformite?: 'conforme' | 'non_conforme' | 'avec_reserves';
  actifId?: number;
  typeInspectionId?: number;
}

export interface InspectionStats {
  total: number;
  statuts: {
    planifiees: number;
    enCours: number;
    terminees: number;
    annulees: number;
  };
  conformite: {
    conformes: number;
    nonConformes: number;
  };
}
