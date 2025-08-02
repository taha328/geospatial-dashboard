import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaintenanceService } from '../../services/maintenance.service';
import { Maintenance } from '../../services/maintenance.service';

@Component({
  selector: 'app-complete-maintenance-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    .modal {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 1055 !important;
    }
    .modal-dialog {
      position: relative !important;
      width: auto !important;
      margin: 0.5rem !important;
    }
    .modal-content {
      position: relative !important;
      background-color: #fff !important;
      border: 1px solid rgba(0,0,0,.2) !important;
      border-radius: 0.375rem !important;
      box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,.075) !important;
    }
  `],
  template: `
    <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.5);" *ngIf="maintenance" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ maintenance?.statut === 'terminee' ? 'Réviser et Exporter le Rapport - ' : 'Terminer la Maintenance - ' }}{{ maintenance?.titre }}
            </h5>
            <button type="button" class="btn-close" (click)="close.emit()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="completionForm" (ngSubmit)="onSubmit()">
              
              <!-- Dates Section -->
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="dateDebut" class="form-label">Date de Début Réelle <span class="text-danger">*</span></label>
                    <input type="datetime-local" id="dateDebut" formControlName="dateDebut" class="form-control">
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="dateFin" class="form-label">Date de Fin Réelle <span class="text-danger">*</span></label>
                    <input type="datetime-local" id="dateFin" formControlName="dateFin" class="form-control">
                  </div>
                </div>
              </div>

              <!-- Cost Section -->
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="coutEstime" class="form-label">Coût Estimé (MAD)</label>
                    <input type="number" id="coutEstime" [value]="maintenance?.coutEstime || 0" class="form-control" readonly>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label for="coutReel" class="form-label">Coût Réel (MAD) <span class="text-danger">*</span></label>
                    <input type="number" id="coutReel" formControlName="coutReel" class="form-control" step="0.01" min="0">
                  </div>
                </div>
              </div>

              <!-- External Company -->
              <div class="mb-3">
                <label for="entrepriseExterne" class="form-label">Entreprise Externe</label>
                <input type="text" id="entrepriseExterne" formControlName="entrepriseExterne" class="form-control" 
                       placeholder="Nom de l'entreprise externe (si applicable)">
              </div>

              <!-- Intervention Report -->
              <div class="mb-3">
                <label for="rapportIntervention" class="form-label">Rapport d'Intervention <span class="text-danger">*</span></label>
                <textarea id="rapportIntervention" formControlName="rapportIntervention" class="form-control" rows="4" 
                          placeholder="Décrivez les travaux effectués, les problèmes rencontrés, et les solutions appliquées..."></textarea>
              </div>

              <!-- Replaced Parts -->
              <div class="mb-3">
                <label for="piecesRemplacees" class="form-label">Pièces Remplacées</label>
                <textarea id="piecesRemplacees" formControlName="piecesRemplacees" class="form-control" rows="3" 
                          placeholder="Liste des pièces remplacées avec références et quantités..."></textarea>
              </div>

              <!-- Document Annexe -->
              <div class="mb-3">
                <label for="documentAnnexe" class="form-label">Documents Annexes</label>
                <textarea id="documentAnnexe" formControlName="documentAnnexe" class="form-control" rows="2" 
                          placeholder="Références des documents, photos, ou certificats joints..."></textarea>
              </div>

              <!-- Resolve Anomaly Checkbox -->
              <div *ngIf="maintenance?.anomalieId" class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="resolveLinkedAnomaly" formControlName="resolveLinkedAnomaly">
                <label class="form-check-label" for="resolveLinkedAnomaly">
                  Marquer l'anomalie liée comme résolue
                </label>
              </div>

            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="close.emit()">Annuler</button>
            <button type="button" class="btn btn-primary" (click)="onSubmit()" [disabled]="completionForm.invalid || isSubmitting">
              {{ isSubmitting ? 'Traitement...' : (maintenance?.statut === 'terminee' ? 'Mettre à Jour et Exporter' : 'Terminer la Maintenance') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CompleteMaintenanceModalComponent implements OnInit {
  @Input() maintenance: Maintenance | any = null;
  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<any>();

  completionForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private maintenanceService: MaintenanceService,
  ) {
    this.completionForm = this.fb.group({
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      rapportIntervention: ['', Validators.required],
      coutReel: [null, [Validators.required, Validators.min(0)]],
      entrepriseExterne: [''],
      piecesRemplacees: [''],
      documentAnnexe: [''],
      resolveLinkedAnomaly: [true],
    });
  }

  ngOnInit() {
    console.log('CompleteMaintenanceModalComponent ngOnInit, maintenance:', this.maintenance);
    
    if (this.maintenance) {
      // Set default dates to current time if not already set
      const now = new Date();
      const dateTimeString = now.toISOString().slice(0, 16); // Format for datetime-local input
      
      // If maintenance is already completed, pre-fill with existing data
      if (this.maintenance.statut === 'terminee') {
        this.completionForm.patchValue({
          dateDebut: this.maintenance.dateDebut ? new Date(this.maintenance.dateDebut).toISOString().slice(0, 16) : dateTimeString,
          dateFin: this.maintenance.dateFin ? new Date(this.maintenance.dateFin).toISOString().slice(0, 16) : dateTimeString,
          coutReel: this.maintenance.coutReel || this.maintenance.coutEstime || 0,
          rapportIntervention: this.maintenance.rapportIntervention || '',
          entrepriseExterne: this.maintenance.entrepriseExterne || '',
          piecesRemplacees: Array.isArray(this.maintenance.piecesRemplacees) 
            ? this.maintenance.piecesRemplacees.join('\n') 
            : this.maintenance.piecesRemplacees || '',
          documentAnnexe: Array.isArray(this.maintenance.documentsAnnexes) 
            ? this.maintenance.documentsAnnexes.join('\n') 
            : this.maintenance.documentsAnnexes || '',
          resolveLinkedAnomaly: true,
        });
      } else {
        // For new completion, set default values
        this.completionForm.patchValue({
          dateDebut: dateTimeString,
          dateFin: dateTimeString,
          coutReel: this.maintenance.coutEstime || 0,
        });
      }
    }
  }

  onSubmit() {
    if (this.completionForm.invalid) {
      console.error('Form is invalid:', this.completionForm.errors);
      console.error('Form controls state:', Object.keys(this.completionForm.controls).map(key => ({
        [key]: {
          value: this.completionForm.get(key)?.value,
          valid: this.completionForm.get(key)?.valid,
          errors: this.completionForm.get(key)?.errors
        }
      })));
      return;
    }

    if (!this.maintenance || !this.maintenance.id) {
      console.error('No maintenance selected for completion');
      return;
    }

    this.isSubmitting = true;
    const formData = this.completionForm.value;
    
    console.log('Submitting completion data:', formData);
    console.log('Maintenance ID:', this.maintenance.id);
    console.log('Current maintenance status:', this.maintenance.statut);

    // Check maintenance status and handle accordingly
    if (this.maintenance.statut === 'terminee') {
      // Maintenance is already finished - update details and generate report
      console.log('Maintenance already finished, updating details and generating report...');
      this.updateMaintenanceAndGenerateReport(formData);
    } else if (this.maintenance.statut === 'planifiee') {
      console.log('Maintenance is not started yet, starting it first...');
      
      // Start the maintenance first, then complete it
      this.maintenanceService.startMaintenance(this.maintenance.id).subscribe({
        next: (startResult) => {
          console.log('Maintenance started successfully:', startResult);
          // Now complete the maintenance
          this.completeMaintenance(formData);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error starting maintenance:', err);
          alert(`Erreur lors du démarrage: ${err.error?.message || err.message || 'Erreur inconnue'}`);
        }
      });
    } else if (this.maintenance.statut === 'en_cours') {
      // Maintenance is already started, complete it directly
      this.completeMaintenance(formData);
    } else {
      this.isSubmitting = false;
      alert(`Cette maintenance ne peut pas être terminée. Statut actuel: ${this.maintenance.statut}`);
    }
  }

  private updateMaintenanceAndGenerateReport(formData: any) {
    // Use the specific update endpoint for completed maintenance
    this.maintenanceService.updateCompletedMaintenance(this.maintenance.id, formData)
      .subscribe({
        next: (result) => {
          console.log('Maintenance details updated successfully:', result);
          
          // Generate and download the professional report
          const reportUrl = `http://localhost:3000/reports/maintenance/${this.maintenance.id}/professional`;
          console.log('Opening professional report:', reportUrl);
          window.open(reportUrl, '_blank');
          
          this.isSubmitting = false;
          this.completed.emit(result);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error updating maintenance details:', err);
          console.error('Error details:', err.error);
          alert(`Erreur lors de la mise à jour: ${err.error?.message || err.message || 'Erreur inconnue'}`);
        }
      });
  }

  private completeMaintenance(formData: any) {
    this.maintenanceService.completeMaintenance(this.maintenance.id, formData)
      .subscribe({
        next: (result) => {
          this.isSubmitting = false;
          console.log('Maintenance completed successfully:', result);
          this.completed.emit(result);
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Error completing maintenance:', err);
          console.error('Error details:', err.error);
          alert(`Erreur: ${err.error?.message || err.message || 'Erreur inconnue'}`);
        }
      });
  }
}
