import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KpiService, KPIResponse } from '../../services/kpi.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule], // Add RouterModule for routerLink directives
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  kpiData: KPIResponse | null = null;
  loading = true;
  error: string | null = null;

  constructor(private kpiService: KpiService) {}

  ngOnInit(): void {
    this.loadKPIs();
    // Auto-refresh following geospatial dashboard patterns
    setInterval(() => {
      if (!this.loading) {
        this.loadKPIs();
      }
    }, 30000);
  }

  loadKPIs(): void {
    this.kpiService.getGlobalKPIs().subscribe({
      next: (data: KPIResponse) => {
        this.kpiData = data;
        this.loading = false;
        this.error = null;
      },
      error: (err: any) => {
        console.error('Error loading KPIs:', err);
        this.error = 'Erreur lors du chargement des indicateurs';
        this.loading = false;
      }
    });
  }

  refreshKPIs(): void {
    this.loading = true;
    this.error = null;
    
    this.kpiService.refreshKPIs().subscribe({
      next: (response: any) => {
        this.kpiData = response.data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error refreshing KPIs:', err);
        this.error = 'Erreur lors du rafraîchissement';
        this.loading = false;
      }
    });
  }

  // Safe getter methods to avoid optional chaining warnings
  getTotalActifs(): number {
    return this.kpiData?.totalActifs || 0;
  }

  getOperationnels(): number {
    return this.kpiData?.actifsOperationnels || 0;
  }

  getTotalAnomalies(): number {
    return this.kpiData?.totalAnomalies || 0;
  }

  getTauxDisponibilite(): number {
    return this.kpiData?.tauxDisponibilite || 0;
  }

  getMaintenances(): number {
    return this.kpiData?.actifsEnMaintenance || 0;
  }

  getHorsService(): number {
    return this.kpiData?.actifsHorsService || 0;
  }

  getPortefeuilles(): number {
    return this.kpiData?.portefeuilles || 0;
  }

  getFamilles(): number {
    return this.kpiData?.familles || 0;
  }

  getGroupes(): number {
    return this.kpiData?.groupes || 0;
  }

  getMaintenancesPrevues(): number {
    return this.kpiData?.maintenancesPrevues || 0;
  }

  getDisponibiliteColor(): string {
    const rate = this.getTauxDisponibilite();
    if (rate >= 95) return 'text-success';
    if (rate >= 85) return 'text-warning';
    if (rate > 0) return 'text-danger';
    return 'text-muted';
  }
}