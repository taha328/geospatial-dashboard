import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActifPourCarte } from '../../services/carte-integration.service';

@Component({
  selector: 'app-actif-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="actif-popup" *ngIf="actif">
      <div class="popup-header">
        <div class="actif-icon">{{ getActifIcon(actif.typeActif) }}</div>
        <div class="actif-info">
          <h4>{{ actif.nom }}</h4>
          <p class="actif-code">{{ actif.code }}</p>
        </div>
        <div class="statut-badge" [style.background-color]="getStatutColor(actif.statutOperationnel)">
          {{ getStatutLabel(actif.statutOperationnel) }}
        </div>
      </div>
      
      <div class="popup-content">
        <div class="info-section">
          <h5>📍 Localisation</h5>
          <p>{{ actif.latitude.toFixed(6) }}, {{ actif.longitude.toFixed(6) }}</p>
        </div>
        
        <div class="info-section">
          <h5>🏢 Hiérarchie</h5>
          <div class="hierarchy-path">
            <span class="hierarchy-item">{{ actif.portefeuilleNom }}</span>
            <span class="separator">›</span>
            <span class="hierarchy-item">{{ actif.familleNom }}</span>
            <span class="separator">›</span>
            <span class="hierarchy-item">{{ actif.groupeNom }}</span>
          </div>
        </div>
        
        <div class="info-section">
          <h5>📊 État</h5>
          <div class="etat-info">
            <span class="etat-label">État général:</span>
            <span class="etat-value" [style.color]="getEtatColor(actif.etatGeneral)">
              {{ getEtatLabel(actif.etatGeneral) }}
            </span>
          </div>
        </div>
        
        <div class="info-section" *ngIf="actif.numeroSerie">
          <h5>🔢 Numéro de série</h5>
          <p>{{ actif.numeroSerie }}</p>
        </div>
      </div>
      
      <div class="popup-actions">
        <button class="btn btn-primary" (click)="voirDetails()">
          <i class="fas fa-eye"></i>
          Voir Détails
        </button>
        <button class="btn btn-warning" (click)="signalerAnomalie()">
          <i class="fas fa-exclamation-triangle"></i>
          Signaler Anomalie
        </button>
      </div>
    </div>
  `,
  styles: [`
    .actif-popup {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      padding: 16px;
      max-width: 300px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .popup-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e9ecef;
    }
    
    .actif-icon {
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .actif-info {
      flex: 1;
    }
    
    .actif-info h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .actif-code {
      margin: 0;
      font-size: 12px;
      color: #6c757d;
      font-family: monospace;
    }
    
    .statut-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: white;
      letter-spacing: 0.5px;
    }
    
    .popup-content {
      margin-bottom: 16px;
    }
    
    .info-section {
      margin-bottom: 12px;
    }
    
    .info-section h5 {
      margin: 0 0 6px 0;
      font-size: 12px;
      font-weight: 600;
      color: #495057;
    }
    
    .info-section p {
      margin: 0;
      font-size: 14px;
      color: #6c757d;
    }
    
    .hierarchy-path {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    
    .hierarchy-item {
      font-size: 12px;
      color: #495057;
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 4px;
    }
    
    .separator {
      color: #adb5bd;
      font-size: 12px;
    }
    
    .etat-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .etat-label {
      font-size: 12px;
      color: #6c757d;
    }
    
    .etat-value {
      font-size: 12px;
      font-weight: 600;
      text-transform: capitalize;
    }
    
    .popup-actions {
      display: flex;
      gap: 8px;
    }
    
    .btn {
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .btn-primary {
      background: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background: #0056b3;
    }
    
    .btn-warning {
      background: #ffc107;
      color: #212529;
    }
    
    .btn-warning:hover {
      background: #e0a800;
    }
    
    .btn i {
      font-size: 10px;
    }
  `]
})
export class ActifPopupComponent implements OnInit {
  @Input() actif: ActifPourCarte | null = null;
  @Output() voirDetailsClicked = new EventEmitter<ActifPourCarte>();
  @Output() signalerAnomalieClicked = new EventEmitter<ActifPourCarte>();

  ngOnInit() {}

  getActifIcon(type: string): string {
    const icons = {
      'bollards': '⚓',
      'defenses': '🛡️',
      'grues': '🏗️',
      'eclairage': '💡',
      'signalisation': '🚥',
      'quais': '🚢',
      'entrepots': '🏭'
    };
    return icons[type as keyof typeof icons] || '⚙️';
  }

  getStatutColor(statut: string): string {
    const colors = {
      'operationnel': '#28a745',
      'maintenance': '#ffc107',
      'hors_service': '#dc3545',
      'alerte': '#fd7e14',
      'inactif': '#6c757d'
    };
    return colors[statut as keyof typeof colors] || '#6c757d';
  }

  getStatutLabel(statut: string): string {
    const labels = {
      'operationnel': 'Opérationnel',
      'maintenance': 'Maintenance',
      'hors_service': 'Hors Service',
      'alerte': 'Alerte',
      'inactif': 'Inactif'
    };
    return labels[statut as keyof typeof labels] || statut;
  }

  getEtatColor(etat: string): string {
    const colors = {
      'bon': '#28a745',
      'moyen': '#ffc107',
      'mauvais': '#fd7e14',
      'critique': '#dc3545'
    };
    return colors[etat as keyof typeof colors] || '#6c757d';
  }

  getEtatLabel(etat: string): string {
    const labels = {
      'bon': 'Bon',
      'moyen': 'Moyen',
      'mauvais': 'Mauvais',
      'critique': 'Critique'
    };
    return labels[etat as keyof typeof labels] || etat;
  }

  voirDetails() {
    if (this.actif) {
      this.voirDetailsClicked.emit(this.actif);
    }
  }

  signalerAnomalie() {
    if (this.actif) {
      this.signalerAnomalieClicked.emit(this.actif);
    }
  }
}
