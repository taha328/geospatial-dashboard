import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KPIResponse {
  totalActifs: number;
  actifsOperationnels: number;
  actifsEnMaintenance: number;
  actifsHorsService: number;
  totalAnomalies: number;
  anomaliesOuvertes: number;
  anomaliesCritiques: number;
  totalMaintenances: number;
  maintenancesPrevues: number;
  maintenancesEnCours: number;
  portefeuilles: number;
  familles: number;
  groupes: number;
  valeurTotaleActifs: number;
  tauxDisponibilite: number;
  statistiques: {
    actifs: {
      total: number;
      parStatut: { [key: string]: number };
      parFamille: { [key: string]: number };
    };
    anomalies: {
      total: number;
      parPriorite: { [key: string]: number };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class KpiService {
  // Following monorepo backend patterns
  private readonly baseUrl = 'http://localhost:3000/api/kpis';

  constructor(private http: HttpClient) {}

  getGlobalKPIs(): Observable<KPIResponse> {
    return this.http.get<KPIResponse>(this.baseUrl);
  }

  getPortefeuilleKPIs(portefeuilleId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/portefeuille/${portefeuilleId}`);
  }

  refreshKPIs(): Observable<{ message: string; data: KPIResponse }> {
    return this.http.get<{ message: string; data: KPIResponse }>(`${this.baseUrl}/refresh`);
  }
}