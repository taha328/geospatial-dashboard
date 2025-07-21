import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarteIntegrationService } from '../../services/carte-integration.service';
import { ActifService } from '../../services/actif.service';
import { AnomalieService } from '../../services/anomalie.service';

@Component({
  selector: 'app-dashboard-integre',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-integre.component.html',
  styleUrls: ['./dashboard-integre.component.scss']
})
export class DashboardIntegreComponent implements OnInit {
  carteDashboard: any = null;
  gestinoactifsStats: any = null;
  loading = false;
  error: string | null = null;

  constructor(
    private carteIntegrationService: CarteIntegrationService,
    private actifService: ActifService,
    private anomalieService: AnomalieService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;

    // Charger les données de la carte
    this.carteIntegrationService.getCarteDashboard().subscribe({
      next: (carteData) => {
        this.carteDashboard = carteData;
        this.checkLoadingComplete();
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des données carte';
        this.loading = false;
        console.error('Erreur dashboard carte:', error);
      }
    });

    // Charger les statistiques des actifs
    this.actifService.getStatistiques().subscribe({
      next: (statsData: any) => {
        this.gestinoactifsStats = statsData;
        this.checkLoadingComplete();
      },
      error: (error: any) => {
        this.error = 'Erreur lors du chargement des statistiques actifs';
        this.loading = false;
        console.error('Erreur stats actifs:', error);
      }
    });
  }

  private checkLoadingComplete() {
    if (this.carteDashboard && this.gestinoactifsStats) {
      this.loading = false;
    }
  }

  refreshDashboard() {
    this.loadDashboardData();
  }

  getStatutColor(statut: string): string {
    const colors = {
      'operationnel': '#28a745',
      'maintenance': '#ffc107',
      'hors_service': '#dc3545',
      'inactif': '#6c757d'
    };
    return colors[statut as keyof typeof colors] || '#6c757d';
  }

  getPrioriteColor(priorite: string): string {
    const colors = {
      'critique': '#dc3545',
      'eleve': '#fd7e14',
      'moyen': '#ffc107',
      'faible': '#28a745'
    };
    return colors[priorite as keyof typeof colors] || '#6c757d';
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }
}
