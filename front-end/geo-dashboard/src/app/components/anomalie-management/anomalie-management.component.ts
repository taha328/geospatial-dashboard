import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AnomalieService, Anomalie } from '../../services/anomalie.service';
import { MaintenanceService } from '../../services/maintenance.service';
import { ActifService } from '../../services/actif.service';

interface AnomalieWithDetails extends Anomalie {
  actifNom?: string;
  actifCode?: string;
  actifType?: string;
  canCreateMaintenance?: boolean;
}

@Component({
  selector: 'app-anomalie-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="anomalie-management">
      <div class="management-header">
        <h2>⚠️ Gestion des Anomalies</h2>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="loadAnomalies()">
            <span>🔄</span> Actualiser
          </button>
          <button class="btn btn-success" (click)="showCreateForm = true">
            <span>➕</span> Nouvelle Anomalie
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label>Statut:</label>
          <select [(ngModel)]="filtreStatut" (change)="applyFilters()" class="form-control">
            <option value="">Tous</option>
            <option value="nouveau">Nouveau</option>
            <option value="en_cours">En cours</option>
            <option value="resolu">Résolu</option>
            <option value="ferme">Fermé</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Priorité:</label>
          <select [(ngModel)]="filtrePriorite" (change)="applyFilters()" class="form-control">
            <option value="">Toutes</option>
            <option value="critique">Critique</option>
            <option value="eleve">Élevé</option>
            <option value="moyen">Moyen</option>
            <option value="faible">Faible</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Type:</label>
          <select [(ngModel)]="filtreType" (change)="applyFilters()" class="form-control">
            <option value="">Tous</option>
            <option value="structural">Structural</option>
            <option value="mecanique">Mécanique</option>
            <option value="electrique">Électrique</option>
            <option value="securite">Sécurité</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div class="filter-group">
          <input 
            type="text" 
            [(ngModel)]="rechercheTexte" 
            (input)="applyFilters()"
            placeholder="Rechercher..."
            class="form-control">
        </div>
      </div>

      <!-- Anomalies List -->
      <div class="anomalies-list">
        <div class="list-header">
          <h3>Liste des Anomalies ({{filteredAnomalies.length}})</h3>
        </div>
        
        <div class="table-container">
          <table class="anomalies-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Actif</th>
                <th>Type</th>
                <th>Priorité</th>
                <th>Statut</th>
                <th>Date Détection</th>
                <th>Assigné à</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let anomalie of filteredAnomalies" 
                  [class.selected]="selectedAnomalie?.id === anomalie.id">
                <td>{{anomalie.id}}</td>
                <td>
                  <div class="anomalie-title">
                    {{anomalie.titre}}
                    <small class="anomalie-description">{{anomalie.description | slice:0:50}}...</small>
                  </div>
                </td>
                <td>
                  <div class="actif-info" *ngIf="anomalie.actif">
                    <strong>{{anomalie.actifNom}}</strong>
                    <small>{{anomalie.actifCode}}</small>
                    <span class="actif-type">{{anomalie.actifType}}</span>
                  </div>
                  <span *ngIf="!anomalie.actif" class="no-actif">Aucun actif lié</span>
                </td>
                <td>
                  <span class="type-badge" [ngClass]="'type-' + anomalie.typeAnomalie">
                    {{getTypeLabel(anomalie.typeAnomalie)}}
                  </span>
                </td>
                <td>
                  <span class="priority-badge" [ngClass]="'priority-' + anomalie.priorite">
                    {{getPriorityLabel(anomalie.priorite)}}
                  </span>
                </td>
                <td>
                  <span class="status-badge" [ngClass]="'status-' + anomalie.statut">
                    {{getStatusLabel(anomalie.statut)}}
                  </span>
                </td>
                <td>{{anomalie.dateDetection | date:'dd/MM/yyyy'}}</td>
                <td>{{anomalie.assigneA || 'Non assigné'}}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" 
                            (click)="viewAnomalieDetails(anomalie)"
                            title="Voir détails">
                      👁️
                    </button>
                    <button class="btn btn-sm btn-warning" 
                            (click)="editAnomalie(anomalie)"
                            title="Modifier">
                      ✏️
                    </button>
                    <button class="btn btn-sm btn-success" 
                            (click)="createMaintenanceFromAnomalie(anomalie)"
                            *ngIf="anomalie.canCreateMaintenance"
                            title="Créer maintenance">
                      🔧
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredAnomalies.length === 0">
                <td colspan="9" class="text-center">
                  <div class="no-data">
                    <p>Aucune anomalie trouvée</p>
                    <button class="btn btn-primary" (click)="loadSampleData()">
                      Charger des données d'exemple
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Maintenance from Anomalie Modal -->
      <div class="modal-overlay" *ngIf="showMaintenanceModal" (click)="closeMaintenanceModal()">
        <div class="modal-content maintenance-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>🔧 Créer une Maintenance pour l'Anomalie #{{selectedAnomalie?.id}}</h3>
            <button class="btn-close" (click)="closeMaintenanceModal()">×</button>
          </div>
          <div class="modal-body">
            <form [formGroup]="maintenanceForm" (ngSubmit)="createMaintenance()">
              <div class="form-grid">
                <div class="form-group">
                  <label for="titre">Titre de la maintenance *</label>
                  <input 
                    id="titre" 
                    type="text" 
                    formControlName="titre" 
                    class="form-control">
                </div>

                <div class="form-group">
                  <label for="typeMaintenance">Type de maintenance *</label>
                  <select id="typeMaintenance" formControlName="typeMaintenance" class="form-control">
                    <option value="corrective">Corrective</option>
                    <option value="preventive">Préventive</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="datePrevue">Date prévue *</label>
                  <input 
                    id="datePrevue" 
                    type="date" 
                    formControlName="datePrevue" 
                    class="form-control">
                </div>

                <div class="form-group">
                  <label for="technicienResponsable">Technicien responsable</label>
                  <input 
                    id="technicienResponsable" 
                    type="text" 
                    formControlName="technicienResponsable" 
                    class="form-control">
                </div>

                <div class="form-group full-width">
                  <label for="description">Description</label>
                  <textarea 
                    id="description" 
                    formControlName="description" 
                    class="form-control" 
                    rows="3"
                    placeholder="Description détaillée de la maintenance à effectuer..."></textarea>
                </div>

                <div class="form-group">
                  <label for="coutEstime">Coût estimé (€)</label>
                  <input 
                    id="coutEstime" 
                    type="number" 
                    formControlName="coutEstime" 
                    class="form-control" 
                    step="0.01">
                </div>

                <div class="form-group">
                  <label for="entrepriseExterne">Entreprise externe</label>
                  <input 
                    id="entrepriseExterne" 
                    type="text" 
                    formControlName="entrepriseExterne" 
                    class="form-control"
                    placeholder="Si maintenance externalisée">
                </div>
              </div>

              <div class="anomalie-context">
                <h4>Contexte de l'Anomalie</h4>
                <div class="context-info">
                  <p><strong>Anomalie:</strong> {{selectedAnomalie?.titre}}</p>
                  <p><strong>Type:</strong> {{getTypeLabel(selectedAnomalie?.typeAnomalie || '')}}</p>
                  <p><strong>Priorité:</strong> {{getPriorityLabel(selectedAnomalie?.priorite || '')}}</p>
                  <p><strong>Description:</strong> {{selectedAnomalie?.description}}</p>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="closeMaintenanceModal()">
                  Annuler
                </button>
                <button type="submit" class="btn btn-success" [disabled]="maintenanceForm.invalid || isSubmitting">
                  {{isSubmitting ? 'Création...' : '🔧 Créer Maintenance'}}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .anomalie-management {
      padding: 20px;
      background: #f8f9fa;
      min-height: 100vh;
    }

    .management-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .filters-section {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      min-width: 150px;
    }

    .filter-group label {
      font-weight: 600;
      margin-bottom: 5px;
      color: #333;
    }

    .form-control {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .anomalies-list {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .list-header {
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .table-container {
      overflow-x: auto;
    }

    .anomalies-table {
      width: 100%;
      border-collapse: collapse;
    }

    .anomalies-table th,
    .anomalies-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .anomalies-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #333;
    }

    .anomalies-table tr:hover {
      background: #f8f9fa;
    }

    .anomalies-table tr.selected {
      background: #e3f2fd;
    }

    .anomalie-title {
      display: flex;
      flex-direction: column;
    }

    .anomalie-description {
      color: #666;
      font-size: 12px;
      margin-top: 4px;
    }

    .actif-info {
      display: flex;
      flex-direction: column;
    }

    .actif-info small {
      color: #666;
      font-size: 12px;
    }

    .actif-type {
      background: #e9ecef;
      color: #495057;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 11px;
      margin-top: 4px;
      align-self: flex-start;
    }

    .no-actif {
      color: #888;
      font-style: italic;
    }

    .no-data {
      padding: 40px;
      text-align: center;
      color: #666;
    }

    .text-center {
      text-align: center;
    }

    .type-badge, .priority-badge, .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .type-structural { background: #e3f2fd; color: #1976d2; }
    .type-mecanique { background: #fff3e0; color: #f57c00; }
    .type-electrique { background: #f3e5f5; color: #7b1fa2; }
    .type-securite { background: #ffebee; color: #d32f2f; }
    .type-autre { background: #f5f5f5; color: #616161; }

    .priority-critique { background: #ffebee; color: #d32f2f; }
    .priority-eleve { background: #fff3e0; color: #f57c00; }
    .priority-moyen { background: #fff8e1; color: #ffa000; }
    .priority-faible { background: #e8f5e8; color: #388e3c; }

    .status-nouveau { background: #e3f2fd; color: #1976d2; }
    .status-en_cours { background: #fff3e0; color: #f57c00; }
    .status-resolu { background: #e8f5e8; color: #388e3c; }
    .status-ferme { background: #f5f5f5; color: #616161; }

    .action-buttons {
      display: flex;
      gap: 5px;
    }

    .btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s ease;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 12px;
    }

    .btn-primary { background: #007bff; color: white; }
    .btn-warning { background: #ffc107; color: #212529; }
    .btn-success { background: #28a745; color: white; }
    .btn-secondary { background: #6c757d; color: white; }

    .btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .maintenance-modal {
      width: 800px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    }

    .modal-body {
      padding: 20px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-weight: 600;
      margin-bottom: 5px;
      color: #333;
    }

    .anomalie-context {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }

    .context-info {
      background: white;
      padding: 10px;
      border-radius: 4px;
      border-left: 4px solid #ffc107;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  `]
})
export class AnomalieManagementComponent implements OnInit {
  anomalies: AnomalieWithDetails[] = [];
  filteredAnomalies: AnomalieWithDetails[] = [];
  selectedAnomalie: AnomalieWithDetails | null = null;
  
  // Filter properties
  filtreStatut = '';
  filtrePriorite = '';
  filtreType = '';
  rechercheTexte = '';
  
  // Modal states
  showMaintenanceModal = false;
  showCreateForm = false;
  
  // Form state
  maintenanceForm: FormGroup;
  isSubmitting = false;

  constructor(
    private anomalieService: AnomalieService,
    private maintenanceService: MaintenanceService,
    private actifService: ActifService,
    private fb: FormBuilder
  ) {
    this.maintenanceForm = this.createMaintenanceForm();
  }

  ngOnInit() {
    this.loadAnomalies();
  }

  private createMaintenanceForm(): FormGroup {
    return this.fb.group({
      titre: ['', Validators.required],
      description: [''],
      typeMaintenance: ['corrective', Validators.required],
      datePrevue: ['', Validators.required],
      technicienResponsable: [''],
      coutEstime: [0],
      entrepriseExterne: ['']
    });
  }

  loadAnomalies() {
    // For now, use sample data until backend is ready
    this.loadSampleData();
    
    // Uncomment when backend is ready:
    /*
    this.anomalieService.getAllAnomalies().subscribe({
      next: (anomalies) => {
        this.anomalies = anomalies.map(anomalie => ({
          ...anomalie,
          actifNom: anomalie.actif?.nom,
          actifCode: anomalie.actif?.code,
          actifType: anomalie.actif?.groupeActif?.type,
          canCreateMaintenance: this.canCreateMaintenanceForAnomalie(anomalie)
        }));
        this.applyFilters();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des anomalies:', error);
        this.loadSampleData(); // Fallback to sample data
      }
    });
    */
  }

  loadSampleData() {
    // Load some sample data for demonstration
    this.anomalies = [
      {
        id: 1,
        titre: 'Fissure sur quai principal',
        description: 'Fissure observée sur la structure béton du quai principal, nécessite inspection urgente',
        typeAnomalie: 'structural',
        priorite: 'critique',
        statut: 'nouveau',
        dateDetection: new Date('2024-01-15'),
        dateCreation: new Date('2024-01-15'),
        dateMiseAJour: new Date('2024-01-15'),
        rapportePar: 'Agent Maintenance',
        actif: {
          id: 101,
          nom: 'Quai Principal A',
          code: 'QP-A-001',
          groupeActif: {
            nom: 'Quais',
            type: 'infrastructure'
          }
        },
        actifNom: 'Quai Principal A',
        actifCode: 'QP-A-001',
        actifType: 'infrastructure',
        canCreateMaintenance: true
      },
      {
        id: 2,
        titre: 'Dysfonctionnement éclairage',
        description: 'Plusieurs luminaires ne fonctionnent plus dans la zone de stockage',
        typeAnomalie: 'electrique',
        priorite: 'moyen',
        statut: 'en_cours',
        dateDetection: new Date('2024-01-20'),
        dateCreation: new Date('2024-01-20'),
        dateMiseAJour: new Date('2024-01-20'),
        assigneA: 'Technicien Électrique',
        actif: {
          id: 102,
          nom: 'Éclairage Zone A',
          code: 'ECL-ZA-001',
          groupeActif: {
            nom: 'Éclairage',
            type: 'equipement'
          }
        },
        actifNom: 'Éclairage Zone A',
        actifCode: 'ECL-ZA-001',
        actifType: 'equipement',
        canCreateMaintenance: true
      },
      {
        id: 3,
        titre: 'Problème hydraulique grue',
        description: 'Perte de pression hydraulique sur la grue principale',
        typeAnomalie: 'mecanique',
        priorite: 'eleve',
        statut: 'nouveau',
        dateDetection: new Date('2024-01-22'),
        dateCreation: new Date('2024-01-22'),
        dateMiseAJour: new Date('2024-01-22'),
        rapportePar: 'Opérateur Grue',
        actif: {
          id: 103,
          nom: 'Grue Mobile 1',
          code: 'GRU-M1-001',
          groupeActif: {
            nom: 'Grues',
            type: 'equipement'
          }
        },
        actifNom: 'Grue Mobile 1',
        actifCode: 'GRU-M1-001',
        actifType: 'equipement',
        canCreateMaintenance: true
      }
    ];
    this.applyFilters();
  }

  private canCreateMaintenanceForAnomalie(anomalie: Anomalie): boolean {
    return !!anomalie.actif && 
           (anomalie.statut === 'nouveau' || anomalie.statut === 'en_cours');
  }

  applyFilters() {
    this.filteredAnomalies = this.anomalies.filter(anomalie => {
      const matchesStatut = !this.filtreStatut || anomalie.statut === this.filtreStatut;
      const matchesPriorite = !this.filtrePriorite || anomalie.priorite === this.filtrePriorite;
      const matchesType = !this.filtreType || anomalie.typeAnomalie === this.filtreType;
      const matchesTexte = !this.rechercheTexte || 
        anomalie.titre.toLowerCase().includes(this.rechercheTexte.toLowerCase()) ||
        anomalie.description.toLowerCase().includes(this.rechercheTexte.toLowerCase()) ||
        (anomalie.actifNom && anomalie.actifNom.toLowerCase().includes(this.rechercheTexte.toLowerCase()));
      
      return matchesStatut && matchesPriorite && matchesType && matchesTexte;
    });
  }

  viewAnomalieDetails(anomalie: AnomalieWithDetails) {
    this.selectedAnomalie = anomalie;
  }

  editAnomalie(anomalie: AnomalieWithDetails) {
    console.log('Edit anomalie:', anomalie);
    // TODO: Implement edit functionality
  }

  createMaintenanceFromAnomalie(anomalie: AnomalieWithDetails) {
    this.selectedAnomalie = anomalie;
    this.prepareMaintenanceForm(anomalie);
    this.showMaintenanceModal = true;
  }

  private prepareMaintenanceForm(anomalie: AnomalieWithDetails) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.maintenanceForm.patchValue({
      titre: `Maintenance - ${anomalie.titre}`,
      description: `Maintenance corrective suite à l'anomalie: ${anomalie.description}`,
      typeMaintenance: anomalie.priorite === 'critique' ? 'urgente' : 'corrective',
      datePrevue: tomorrow.toISOString().split('T')[0]
    });
  }

  closeMaintenanceModal() {
    this.showMaintenanceModal = false;
    this.selectedAnomalie = null;
    this.maintenanceForm.reset();
  }

  createMaintenance() {
    if (this.maintenanceForm.valid && this.selectedAnomalie) {
      this.isSubmitting = true;
      
      const maintenanceData = {
        ...this.maintenanceForm.value,
        actifId: this.selectedAnomalie.actif?.id,
        anomalieId: this.selectedAnomalie.id,
        statut: 'planifiee'
      };

      // Simulate API call
      setTimeout(() => {
        console.log('Maintenance créée:', maintenanceData);
        this.closeMaintenanceModal();
        this.isSubmitting = false;
      }, 1000);
    }
  }

  getTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      structural: 'Structural',
      mecanique: 'Mécanique',
      electrique: 'Électrique',
      securite: 'Sécurité',
      autre: 'Autre'
    };
    return types[type] || type;
  }

  getPriorityLabel(priorite: string): string {
    const priorities: { [key: string]: string } = {
      critique: 'Critique',
      eleve: 'Élevé',
      moyen: 'Moyen',
      faible: 'Faible'
    };
    return priorities[priorite] || priorite;
  }

  getStatusLabel(statut: string): string {
    const statuses: { [key: string]: string } = {
      nouveau: 'Nouveau',
      en_cours: 'En cours',
      resolu: 'Résolu',
      ferme: 'Fermé'
    };
    return statuses[statut] || statut;
  }
}
