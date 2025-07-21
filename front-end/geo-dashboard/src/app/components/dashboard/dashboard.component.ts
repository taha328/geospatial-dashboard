import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KpiService, KPIResponse } from '../../services/kpi.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule], // Add RouterModule for routerLink directives
  template: `
    <div class="dashboard-container">
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des indicateurs...</p>
      </div>
      
      <div *ngIf="error && !loading" class="error-state">
        <div class="error-content">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Erreur de chargement</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary" (click)="refreshKPIs()">
            <i class="fas fa-redo"></i>
            Réessayer
          </button>
        </div>
      </div>
      
      <div *ngIf="kpiData && !loading" class="dashboard-content">
        <!-- Header -->
        <div class="dashboard-header">
          <h1>
            <i class="fas fa-tachometer-alt"></i>
            Tableau de Bord Principal
          </h1>
          <button class="btn btn-outline-primary" (click)="refreshKPIs()">
            <i class="fas fa-sync-alt"></i>
            Actualiser
          </button>
        </div>

        <!-- KPI Grid following geospatial dashboard patterns -->
        <div class="kpi-grid">
          <div class="kpi-card primary">
            <div class="kpi-icon">
              <i class="fas fa-cogs"></i>
            </div>
            <div class="kpi-content">
              <h3>Total Actifs</h3>
              <!-- Fix: Remove optional chaining warnings by using safe access method -->
              <p class="kpi-value">{{ getTotalActifs() }}</p>
              <span class="kpi-label">Actifs géolocalisés</span>
            </div>
          </div>

          <div class="kpi-card success">
            <div class="kpi-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="kpi-content">
              <h3>Opérationnels</h3>
              <p class="kpi-value">{{ getOperationnels() }}</p>
              <span class="kpi-label">En service</span>
            </div>
          </div>

          <div class="kpi-card warning">
            <div class="kpi-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="kpi-content">
              <h3>Anomalies</h3>
              <p class="kpi-value">{{ getTotalAnomalies() }}</p>
              <span class="kpi-label">Signalées</span>
            </div>
          </div>

          <div class="kpi-card info">
            <div class="kpi-icon">
              <i class="fas fa-percentage"></i>
            </div>
            <div class="kpi-content">
              <h3>Disponibilité</h3>
              <p class="kpi-value" [class]="getDisponibiliteColor()">
                {{ getTauxDisponibilite() }}%
              </p>
              <span class="kpi-label">Taux de disponibilité</span>
            </div>
          </div>

          <!-- Additional KPIs following project patterns -->
          <div class="kpi-card secondary">
            <div class="kpi-icon">
              <i class="fas fa-wrench"></i>
            </div>
            <div class="kpi-content">
              <h3>Maintenance</h3>
              <p class="kpi-value">{{ getMaintenances() }}</p>
              <span class="kpi-label">En maintenance</span>
            </div>
          </div>

          <div class="kpi-card danger">
            <div class="kpi-icon">
              <i class="fas fa-times-circle"></i>
            </div>
            <div class="kpi-content">
              <h3>Hors Service</h3>
              <p class="kpi-value">{{ getHorsService() }}</p>
              <span class="kpi-label">Non disponibles</span>
            </div>
          </div>
        </div>

        <!-- Summary Statistics following monorepo patterns -->
        <div class="stats-section">
          <div class="stats-header">
            <h2>
              <i class="fas fa-chart-bar"></i>
              Statistiques Générales
            </h2>
          </div>
          
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Portefeuilles</span>
              <span class="stat-value">{{ getPortefeuilles() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Familles d'Actifs</span>
              <span class="stat-value">{{ getFamilles() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Groupes d'Actifs</span>
              <span class="stat-value">{{ getGroupes() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Maintenances Prévues</span>
              <span class="stat-value">{{ getMaintenancesPrevues() }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions following dashboard patterns from MAP_SYSTEM_README.md -->
        <div class="actions-section">
          <div class="actions-header">
            <h2>
              <i class="fas fa-tools"></i>
              Actions Rapides
            </h2>
          </div>
          
          <div class="actions-grid">
            <!-- Following routing patterns from geospatial project -->
            <a routerLink="/map" class="action-card">
              <div class="action-icon">
                <i class="fas fa-map-marked-alt"></i>
              </div>
              <div class="action-content">
                <h4>Carte Interactive</h4>
                <p>Visualiser et signaler des anomalies sur la carte</p>
              </div>
            </a>

            <a routerLink="/assets" class="action-card">
              <div class="action-icon">
                <i class="fas fa-cogs"></i>
              </div>
              <div class="action-content">
                <h4>Gestion des Actifs</h4>
                <p>Consulter et modifier les actifs portuaires</p>
              </div>
            </a>

            <a routerLink="/users" class="action-card">
              <div class="action-icon">
                <i class="fas fa-users"></i>
              </div>
              <div class="action-content">
                <h4>Gestion des Utilisateurs</h4>
                <p>Administration des comptes et rôles</p>
              </div>
            </a>

            <a routerLink="/vessels" class="action-card">
              <div class="action-icon">
                <i class="fas fa-ship"></i>
              </div>
              <div class="action-content">
                <h4>Suivi des Navires</h4>
                <p>Localisation et tracking en temps réel</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
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