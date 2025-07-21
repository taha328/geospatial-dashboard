import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private baseUrl = 'http://localhost:3000/api/maintenances';

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

  getCoutsMaintenanceParMois(): Observable<CoutMaintenanceParMois[]> {
    return this.http.get<CoutMaintenanceParMois[]>(`${this.baseUrl}/couts-par-mois`);
  }

  createMaintenance(maintenance: Partial<Maintenance>): Observable<Maintenance> {
    return this.http.post<Maintenance>(this.baseUrl, maintenance);
  }

  updateMaintenance(id: number, maintenance: Partial<Maintenance>): Observable<Maintenance> {
    return this.http.put<Maintenance>(`${this.baseUrl}/${id}`, maintenance);
  }

  demarrerMaintenance(id: number, technicienResponsable: string): Observable<Maintenance> {
    return this.http.put<Maintenance>(`${this.baseUrl}/${id}/demarrer`, { technicienResponsable });
  }

  terminerMaintenance(id: number, completionData: {
    rapportIntervention: string;
    coutReel?: number;
    piecesRemplacees?: any;
  }): Observable<Maintenance> {
    return this.http.put<Maintenance>(`${this.baseUrl}/${id}/terminer`, completionData);
  }

  deleteMaintenance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'preventive': return '#28a745';
      case 'corrective': return '#ffc107';
      case 'urgente': return '#dc3545';
      default: return '#6c757d';
    }
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'planifiee': return '#17a2b8';
      case 'en_cours': return '#ffc107';
      case 'terminee': return '#28a745';
      case 'annulee': return '#6c757d';
      default: return '#6c757d';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'preventive': return '🔧';
      case 'corrective': return '⚠️';
      case 'urgente': return '🚨';
      default: return '🛠️';
    }
  }

  getStatutIcon(statut: string): string {
    switch (statut) {
      case 'planifiee': return '📅';
      case 'en_cours': return '🔄';
      case 'terminee': return '✅';
      case 'annulee': return '❌';
      default: return '📝';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount);
  }
}
