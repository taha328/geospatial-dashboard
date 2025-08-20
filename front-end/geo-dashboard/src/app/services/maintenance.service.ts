import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Maintenance {
  id: number;
  titre: string;
  description?: string;
  typeMaintenance: 'preventive' | 'corrective' | 'urgente';
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
  datePrevue: Date;
  dateDebut?: Date;
  dateFin?: Date;
  coutEstime?: number;
  coutReel?: number;
  technicienResponsable?: string;
  entrepriseExterne?: string;
  rapportIntervention?: string;
  piecesRemplacees?: any;
  documentsAnnexes?: any;
  actifId?: number;
  anomalieId?: number;
  dateCreation: Date;
  dateMiseAJour: Date;
  actif?: {
    id: number;
    nom: string;
    code: string;
    groupeActif?: {
      nom: string;
      type: string;
    };
  };
}

export interface StatistiquesMaintenance {
  total: number;
  planifiees: number;
  enCours: number;
  terminees: number;
  coutTotal?: number;
  parType: {
    preventive: number;
    corrective: number;
    predictive: number;
  };
}

export interface MaintenanceParType {
  type: string;
  count: number;
  coutMoyen: number;
}

export interface CoutMaintenanceParMois {
  annee: number;
  mois: number;
  coutTotal: number;
  nombreMaintenances: number;
}

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private baseUrl = `${environment.apiUrl}/maintenances`;

  constructor(private http: HttpClient) {}

  getStatistiques(): Observable<StatistiquesMaintenance> {
    return this.getStatistiquesMaintenance();
  }

  getMaintenances(): Observable<Maintenance[]> {
    return this.http.get<Maintenance[]>(this.baseUrl);
  }

  getMaintenance(id: number): Observable<Maintenance> {
    return this.http.get<Maintenance>(`${this.baseUrl}/${id}`);
  }

  getMaintenancesParStatut(statut: string): Observable<Maintenance[]> {
    return this.http.get<Maintenance[]>(`${this.baseUrl}/statut/${statut}`);
  }

  getMaintenancesParActif(actifId: number): Observable<Maintenance[]> {
    return this.http.get<Maintenance[]>(`${this.baseUrl}/actif/${actifId}`);
  }

  getMaintenancesPrevues(): Observable<Maintenance[]> {
    return this.http.get<Maintenance[]>(`${this.baseUrl}/prevues`);
  }

  getStatistiquesMaintenance(): Observable<StatistiquesMaintenance> {
    return this.http.get<StatistiquesMaintenance>(`${this.baseUrl}/statistiques`);
  }

  getMaintenancesParType(): Observable<MaintenanceParType[]> {
    return this.http.get<MaintenanceParType[]>(`${this.baseUrl}/par-type`);
  }

  getCoutsParMois(): Observable<CoutMaintenanceParMois[]> {
    return this.http.get<CoutMaintenanceParMois[]>(`${this.baseUrl}/couts-par-mois`);
  }

  createMaintenance(maintenance: Partial<Maintenance>): Observable<Maintenance> {
    return this.http.post<Maintenance>(this.baseUrl, maintenance);
  }

  updateMaintenance(id: number, maintenance: Partial<Maintenance>): Observable<Maintenance> {
    return this.http.put<Maintenance>(`${this.baseUrl}/${id}`, maintenance);
  }

  startMaintenance(id: number): Observable<Maintenance> {
    return this.http.put<Maintenance>(`${environment.apiUrl}/workflow/maintenance/${id}/start`, {});
  }

  completeMaintenance(id: number, completionData: { 
    dateDebut?: string;
    dateFin?: string;
    rapportIntervention?: string; 
    coutReel?: number; 
    entrepriseExterne?: string;
    piecesRemplacees?: string;
    documentAnnexe?: string;
    resolveLinkedAnomaly?: boolean 
  }): Observable<any> {
    return this.http.put(`${environment.apiUrl}/workflow/maintenance/${id}/complete`, completionData);
  }

  updateCompletedMaintenance(id: number, updateData: { 
    dateDebut?: string;
    dateFin?: string;
    rapportIntervention?: string; 
    coutReel?: number; 
    entrepriseExterne?: string;
    piecesRemplacees?: string;
    documentAnnexe?: string;
  }): Observable<any> {
    return this.http.put(`${environment.apiUrl}/workflow/maintenance/${id}/update-completed`, updateData);
  }

  deleteMaintenance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
