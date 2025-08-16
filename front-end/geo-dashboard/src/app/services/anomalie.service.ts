import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Anomalie {
  id: number;
  titre: string;
  description: string;
  priorite: 'faible' | 'moyen' | 'eleve' | 'critique';
  statut: 'nouveau' | 'en_cours' | 'resolu' | 'ferme';
  typeAnomalie: 'structural' | 'mecanique' | 'electrique' | 'securite' | 'autre';
  dateDetection?: Date;
  dateResolution?: Date;
  rapportePar?: string;
  assigneA?: string;
  actionsCorrectives?: string;
  photosAnnexes?: any;
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

export interface StatistiquesAnomalies {
  total: number;
  nouvelles: number;
  enCours: number;
  resolues: number;
  critiques: number;
  tauxResolution?: number;
  parPriorite: {
    critique: number;
    eleve: number;
    moyen: number;
    faible: number;
  };
}

export interface AnomalieParType {
  type: string;
  count: number;
}

export interface AnomalieParMois {
  annee: number;
  mois: number;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnomalieService {
  private baseUrl = `${environment.apiUrl}/anomalies`;

  constructor(private http: HttpClient) {}

  getStatistiques(): Observable<StatistiquesAnomalies> {
    return this.getStatistiquesAnomalies();
  }
  
  getAnomalies(): Observable<Anomalie[]> {
    return this.http.get<Anomalie[]>(this.baseUrl);
  }

  getAnomalie(id: number): Observable<Anomalie> {
    return this.http.get<Anomalie>(`${this.baseUrl}/${id}`);
  }

  getAnomaliesParStatut(statut: string): Observable<Anomalie[]> {
    return this.http.get<Anomalie[]>(`${this.baseUrl}/statut/${statut}`);
  }

  getAnomaliesParPriorite(priorite: string): Observable<Anomalie[]> {
    return this.http.get<Anomalie[]>(`${this.baseUrl}/priorite/${priorite}`);
  }

  getAnomaliesParActif(actifId: number): Observable<Anomalie[]> {
    return this.http.get<Anomalie[]>(`${this.baseUrl}/actif/${actifId}`);
  }

  getStatistiquesAnomalies(): Observable<StatistiquesAnomalies> {
    return this.http.get<StatistiquesAnomalies>(`${this.baseUrl}/statistiques`);
  }

  getAnomaliesParType(): Observable<AnomalieParType[]> {
    return this.http.get<AnomalieParType[]>(`${this.baseUrl}/par-type`);
  }

  getAnomaliesParMois(): Observable<AnomalieParMois[]> {
    return this.http.get<AnomalieParMois[]>(`${this.baseUrl}/par-mois`);
  }

  createAnomalie(anomalie: Partial<Anomalie>): Observable<Anomalie> {
    return this.http.post<Anomalie>(this.baseUrl, anomalie);
  }

  updateAnomalie(id: number, anomalie: Partial<Anomalie>): Observable<Anomalie> {
    return this.http.put<Anomalie>(`${this.baseUrl}/${id}`, anomalie);
  }

  assignerAnomalie(id: number, assigneA: string): Observable<Anomalie> {
    return this.http.put<Anomalie>(`${this.baseUrl}/${id}/assigner`, { assigneA });
  }

  resoudreAnomalie(id: number, actionsCorrectives: string, resolvedBy: string): Observable<Anomalie> {
    return this.http.put<Anomalie>(`${this.baseUrl}/${id}/resoudre`, {
      actionsCorrectives,
      resolvedBy
    });
  }

  takeChargeOfAnomaly(id: number, userId?: string): Observable<Anomalie> {
    return this.http.put<Anomalie>(`${this.baseUrl}/${id}/prendre-en-charge`, { userId });
  }

  deleteAnomalie(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPrioriteColor(priorite: string): string {
    switch (priorite) {
      case 'critique': return '#dc3545';
      case 'eleve': return '#fd7e14';
      case 'moyen': return '#ffc107';
      case 'faible': return '#28a745';
      default: return '#6c757d';
    }
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'nouveau': return '#17a2b8';
      case 'en_cours': return '#ffc107';
      case 'resolu': return '#28a745';
      case 'ferme': return '#6c757d';
      default: return '#6c757d';
    }
  }

  getPrioriteIcon(priorite: string): string {
    switch (priorite) {
      case 'critique': return '🚨';
      case 'eleve': return '⚠️';
      case 'moyen': return '⚡';
      case 'faible': return 'ℹ️';
      default: return '📝';
    }
  }
}
