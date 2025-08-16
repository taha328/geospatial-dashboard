import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer } from 'rxjs';
import { catchError, switchMap, tap, filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Following structure patterns from MAP_SYSTEM_README.md
export interface KPIResponse {
  // Basic KPIs
  totalActifs: number;
  actifsOperationnels: number;
  actifsEnMaintenance: number;
  actifsHorsService: number;
  tauxDisponibilite: number;
  totalAnomalies: number;
  anomaliesCritiques: number;
  maintenancesPrevues: number;
  maintenancesEnCours: number;
  
  // Portfolio management KPIs (from dashboard.component.ts)
  portefeuilles: number;
  familles: number;
  groupes: number;
  
  // Detailed statistics
  statistiques: {
    actifs: {
      parStatut: { [key: string]: number };
      parFamille: { [key: string]: number };
    };
    anomalies: {
      parPriorite: { [key: string]: number };
      parStatut: { [key: string]: number };
    };
    maintenance: {
      parType: { [key: string]: number };
      parStatut: { [key: string]: number };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class KpiService {
  // Backend endpoint from project instructions
  private baseUrl = `${environment.apiUrl}/kpi`;
  private kpiData = new BehaviorSubject<KPIResponse | null>(null);
  private refreshInterval = 30000; // 30 seconds

  constructor(private http: HttpClient) {
    this.setupAutoRefresh();
  }

  private setupAutoRefresh() {
    timer(0, this.refreshInterval).pipe(
      switchMap(() => this.fetchKPIs())
    ).subscribe();
  }

  private fetchKPIs(): Observable<KPIResponse> {
    return this.http.get<KPIResponse>(`${this.baseUrl}/kpis`).pipe(
      tap(data => this.kpiData.next(data)),
      catchError(error => {
        console.error('Error fetching KPIs:', error);
        throw error;
      })
    );
  }

  getGlobalKPIs(): Observable<KPIResponse> {
    return this.kpiData.asObservable().pipe(
      filter((data): data is KPIResponse => data !== null)
    );
  }

  refreshKPIs(): Observable<KPIResponse> {
    return this.fetchKPIs();
  }
}