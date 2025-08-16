import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface WorkflowAnomalie {
  anomalie: {
    id: number;
    titre: string;
    description: string;
    statut: string;
    priorite: string;
    typeAnomalie: string;
    dateCreation: Date;
    maintenance?: {
      id: number;
      titre: string;
      statut: string;
    };
  };
  canCreateMaintenance: boolean;
  canResolve: boolean;
  nextActions: string[];
}

export interface WorkflowMaintenance {
  maintenance: {
    id: number;
    titre: string;
    statut: string;
    typeMaintenance: string;
    datePrevue: Date;
    anomalie?: {
      id: number;
      titre: string;
      statut: string;
    };
  };
  canStart: boolean;
  canComplete: boolean;
  nextActions: string[];
}

export interface AssetWorkflowSummary {
  anomaliesEnCours: number;
  anomaliesResolues: number;
  maintenancesPlanifiees: number;
  maintenancesEnCours: number;
  maintenancesTerminees: number;
  workflowItems: Array<{
    type: 'anomalie' | 'maintenance';
    id: number;
    titre: string;
    statut: string;
    priority?: string;
    dateCreation: Date;
    linkedItemId?: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private baseUrl = `${environment.apiUrl}/workflow`;

  constructor(private http: HttpClient) {}

  getAnomalieWorkflow(anomalieId: number): Observable<WorkflowAnomalie> {
    return this.http.get<WorkflowAnomalie>(`${this.baseUrl}/anomalie/${anomalieId}`);
  }

  getMaintenanceWorkflow(maintenanceId: number): Observable<WorkflowMaintenance> {
    return this.http.get<WorkflowMaintenance>(`${this.baseUrl}/maintenance/${maintenanceId}`);
  }

  getAssetWorkflowSummary(actifId: number): Observable<AssetWorkflowSummary> {
    return this.http.get<AssetWorkflowSummary>(`${this.baseUrl}/asset/${actifId}/summary`);
  }

  createMaintenanceFromAnomalie(anomalieId: number, data: {
    titre?: string;
    description?: string;
    datePrevue: string;
    technicienResponsable?: string;
    coutEstime?: number;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/anomalie/${anomalieId}/create-maintenance`, data);
  }

  startMaintenance(maintenanceId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/maintenance/${maintenanceId}/start`, {});
  }

  completeMaintenance(maintenanceId: number, data: {
    rapportIntervention?: string;
    coutReel?: number;
    piecesRemplacees?: any;
    resolveLinkedAnomaly?: boolean;
  }): Observable<any> {
    return this.http.put(`${this.baseUrl}/maintenance/${maintenanceId}/complete`, data);
  }

  resolveAnomalie(anomalieId: number, data: {
    actionsCorrectives: string;
    resolvedBy?: string;
  }): Observable<any> {
    return this.http.put(`${this.baseUrl}/anomalie/${anomalieId}/resolve`, data);
  }
}
