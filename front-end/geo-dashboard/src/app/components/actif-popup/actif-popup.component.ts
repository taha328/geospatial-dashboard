import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActifPourCarte } from '../../services/carte-integration.service';

@Component({
  selector: 'app-actif-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './actif-popup.component.html',
  styleUrls: ['./actif-popup.component.scss'],
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
