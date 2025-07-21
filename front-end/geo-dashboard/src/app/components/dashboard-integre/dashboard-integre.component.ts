import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { KpiService, KPIResponse } from '../../services/kpi.service';
import { Router } from '@angular/router';

// Following project patterns from copilot-instructions.md
type NumericKPIKey = Exclude<keyof KPIResponse, 'statistiques'>;

@Component({
  selector: 'app-dashboard-integre',
  templateUrl: './dashboard-integre.component.html',
  styleUrls: ['./dashboard-integre.component.scss']
})
export class DashboardIntegreComponent implements OnInit, OnDestroy {
  kpiData: KPIResponse | null = null;
  loading = true;
  error: string | null = null;
  private kpiSubscription: Subscription | null = null;

  constructor(
    private kpiService: KpiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscribeToKPIs();
  }

  ngOnDestroy(): void {
    if (this.kpiSubscription) {
      this.kpiSubscription.unsubscribe();
    }
  }

  private subscribeToKPIs(): void {
    this.kpiSubscription = this.kpiService.getGlobalKPIs().subscribe({
      next: (data) => {
        this.kpiData = data;
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        console.error('Error loading KPIs:', err);
        this.error = 'Erreur lors du chargement des données';
        this.loading = false;
      }
    });
  }

  refreshDashboard(): void {
    this.loading = true;
    this.error = null;
    this.kpiService.refreshKPIs().subscribe({
      next: (data) => {
        this.kpiData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error refreshing KPIs:', err);
        this.error = 'Erreur lors du rafraîchissement';
        this.loading = false;
      }
    });
  }

  // Helper methods for template
  getKpiValue(value: number | undefined): string {
    return value?.toString() || '0';
  }

  getPercentage(value: number | undefined): string {
    return value ? `${value}%` : '0%';
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'operationnel': 'success',
      'en_maintenance': 'warning',
      'hors_service': 'danger',
      'critique': 'danger',
      'haute': 'warning',
      'normale': 'info',
      'basse': 'success'
    };
    return classes[status] || 'secondary';
  }

  // Safe navigation methods - fix type error with proper type checking
  getStatValue(category: NumericKPIKey): number {
    return this.kpiData?.[category] || 0;
  }

  getStatistiqueValue(path: string[]): number {
    let current: any = this.kpiData?.statistiques;
    for (const key of path) {
      current = current?.[key];
      if (current === undefined) return 0;
    }
    return current || 0;
  }

  // Navigation methods following geospatial project structure from copilot-instructions.md
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

  navigateToZones(): void {
    // Navigate to map for zone management with PostGIS integration
    this.router.navigate(['/zones']);
  }
}
