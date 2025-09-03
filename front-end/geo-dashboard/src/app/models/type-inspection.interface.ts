export interface TypeInspection {
  id: number;
  numeroInspection: number;
  typeInspection: string;
  description?: string;
  statut: 'actif' | 'inactif';
  dateCreation: Date;
  dateMiseAJour: Date;
  typeInspectionGroupes?: TypeInspectionGroupe[];
}

export interface TypeInspectionGroupe {
  id: number;
  numeroGroupe: number;
  numeroInspection: number;
  typeInspectionNom: string;
  description?: string;
  statut: 'actif' | 'inactif';
  dateCreation: Date;
  dateMiseAJour: Date;
  typeInspection?: TypeInspection;
  groupeActif?: any; // Reference to GroupeActif
}

export interface InspectionStatistics {
  total: number;
  active: number;
  inactive: number;
}

export interface CreateTypeInspectionDto {
  numeroInspection: number;
  typeInspection: string;
  description?: string;
  statut?: 'actif' | 'inactif';
}

export interface CreateTypeInspectionGroupeDto {
  numeroGroupe: number;
  numeroInspection: number;
  typeInspectionNom: string;
  description?: string;
  statut?: 'actif' | 'inactif';
}
