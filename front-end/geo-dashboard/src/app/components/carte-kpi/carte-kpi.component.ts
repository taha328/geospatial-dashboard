import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarteIntegrationService } from '../../services/carte-integration.service';

@Component({
  selector: 'app-carte-kpi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carte-kpi.component.html',
  styleUrls: ['./carte-kpi.component.scss']
})
export class CarteKpiComponent implements OnInit {
  dashboard: any = null;
  loading = false;
  error: string | null = null;

  constructor(private carteIntegrationService: CarteIntegrationService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.error = null;

    this.carteIntegrationService.getCarteDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des données';
        this.loading = false;
        console.error('Erreur dashboard carte:', error);
      }
    });
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

  refreshDashboard() {
    this.loadDashboard();
  }
}
