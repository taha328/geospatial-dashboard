import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// Following geospatial dashboard patterns with proper null safety for PostgreSQL/PostGIS integration
interface ActifStatistics {
  total: number;
  parStatut: { [key: string]: number };
  parFamille: { [key: string]: number };
}

interface AnomalieStatistics {
  total: number;
  parPriorite: { [key: string]: number };
}

interface DashboardStatistiques {
  actifs: ActifStatistics;
  anomalies: AnomalieStatistics;
}

// Updated interface to match the nullable structure from template
interface DashboardData {
  statistiques: DashboardStatistiques;
}

@Component({
  selector: 'app-dashboard-integre',
  templateUrl: './dashboard-integre.component.html',
  styleUrls: ['./dashboard-integre.component.scss']
})
export class DashboardIntegreComponent implements OnInit {
  carteDashboard: DashboardData | null = null;
  gestinoactifsStats: any = null;
  loading = true;
  error: string | null = null;

  // Following monorepo backend API patterns from copilot-instructions.md (backend at localhost:3000)
  private readonly apiBaseUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    
    // Auto-refresh following dashboard patterns from MAP_SYSTEM_README.md
    setInterval(() => {
      if (!this.loading) {
        this.loadDashboardData();
      }
    }, 30000);
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Following NestJS REST API patterns from backend structure in copilot-instructions.md
    this.http.get<any>(`${this.apiBaseUrl}/kpis`).subscribe({
      next: (data: any) => {
        console.log('KPI Data received:', data);
        
        // Transform backend data to match frontend structure following GeoJSON patterns
        this.carteDashboard = {
          statistiques: {
            actifs: {
              total: data.totalActifs || 0,
              parStatut: this.ensureValidStatutData(data),
              parFamille: data.statistiques?.actifs?.parFamille || {}
            },
            anomalies: {
              total: data.totalAnomalies || 0,
              parPriorite: data.statistiques?.anomalies?.parPriorite || this.getDefaultPrioriteData(data.totalAnomalies || 0)
            }
          }
        };
        
        this.gestinoactifsStats = data;
        this.loading = false;
        this.error = null;
      },
      error: (err: any) => {
        console.error('Error loading dashboard data:', err);
        this.error = 'Erreur lors du chargement des données du tableau de bord';
        this.loading = false;
        
        // Fallback data to prevent template crashes
        this.carteDashboard = this.getDefaultDashboardData();
      }
    });
  }

  private ensureValidStatutData(data: any): { [key: string]: number } {
    const statutData = data.statistiques?.actifs?.parStatut || {};
    
    return {
      operationnel: data.actifsOperationnels || statutData.operationnel || 0,
      en_maintenance: data.actifsEnMaintenance || statutData.en_maintenance || 0,
      hors_service: data.actifsHorsService || statutData.hors_service || 0,
      ...statutData
    };
  }

  private getDefaultPrioriteData(total: number): { [key: string]: number } {
    return {
      normale: Math.floor(total * 0.6),
      haute: Math.floor(total * 0.3),
      critique: Math.floor(total * 0.1)
    };
  }

  private getDefaultDashboardData(): DashboardData {
    return {
      statistiques: {
        actifs: {
          total: 0,
          parStatut: {},
          parFamille: {}
        },
        anomalies: {
          total: 0,
          parPriorite: {}
        }
      }
    };
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  // Helper methods for template following Angular patterns from copilot-instructions.md
  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getStatutColor(statut: string): string {
    // Following Bootstrap-inspired UI patterns from project conventions
    const colors: { [key: string]: string } = {
      'operationnel': '#28a745',
      'en_maintenance': '#ffc107',
      'hors_service': '#dc3545',
      'inactif': '#6c757d',
      'inconnu': '#17a2b8'
    };
    return colors[statut] || '#6c757d';
  }

  getPrioriteColor(priorite: string): string {
    const colors: { [key: string]: string } = {
      'critique': '#dc3545',
      'haute': '#fd7e14',
      'normale': '#ffc107',
      'basse': '#28a745',
      'faible': '#28a745'
    };
    return colors[priorite] || '#6c757d';
  }

  // Safe access methods to handle nullable DashboardData structure
  safeGetValue(obj: any, key: string): number {
    return obj && obj[key] ? obj[key] : 0;
  }

  getPercentage(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  // Safe access methods for template - ensuring carteDashboard is not null
  getTotalActifs(): number {
    return this.carteDashboard?.statistiques.actifs.total || 0;
  }

  getTotalAnomalies(): number {
    return this.carteDashboard?.statistiques.anomalies.total || 0;
  }

  getOperationnelCount(): number {
    return this.carteDashboard?.statistiques.actifs.parStatut['operationnel'] || 0;
  }

  getCritiqueCount(): number {
    return this.carteDashboard?.statistiques.anomalies.parPriorite['critique'] || 0;
  }

  // Navigation methods focused on asset and geospatial management following project structure
  navigateToMap(): void {
    // Navigate to map component for geospatial visualization (OpenLayers 7 + ol-ext)
    this.router.navigate(['/map']);
  }

  navigateToMapWithAnomalies(): void {
    // Navigate to map with anomaly reporting mode
    this.router.navigate(['/map'], { queryParams: { mode: 'report-anomaly' } });
  }

  navigateToVessels(): void {
    // Navigate to vessel finder for tracking vessels with real-time updates
    this.router.navigate(['/vessels']);
  }

  navigateToMaintenance(): void {
    // Navigate to maintenance planning (can be integrated with map for asset selection)
    this.router.navigate(['/map'], { queryParams: { focus: 'maintenance' } });
  }

  navigateToZones(): void {
    // Navigate to map for zone management (zones are managed through map interface with PostGIS)
    this.router.navigate(['/map'], { queryParams: { focus: 'zones' } });
  }

  navigateToReports(): void {
    // Navigate to asset reports dashboard
    this.router.navigate(['/dashboard'], { queryParams: { view: 'reports' } });
  }

  navigateToDashboard(): void {
    // Navigate to main dashboard component
    this.router.navigate(['/dashboard']);
  }
}
