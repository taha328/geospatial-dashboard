import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkflowService } from '../../services/workflow.service'; // Make sure this path is correct

@Component({
  selector: 'app-create-maintenance-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop fade show"></div>
    <div class="modal fade show" style="display: block;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Créer une Maintenance pour l'Anomalie #{{ anomalieId }}</h5>
            <button type="button" class="btn-close" (click)="close.emit()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="maintenanceForm" (ngSubmit)="onSubmit()">
              <div class="mb-3">
                <label for="titre" class="form-label">Titre</label>
                <input type="text" id="titre" formControlName="titre" class="form-control">
              </div>
              <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea id="description" formControlName="description" class="form-control"></textarea>
              </div>
              <div class="mb-3">
                <label for="typeMaintenance" class="form-label">Type de Maintenance *</label>
                <select id="typeMaintenance" formControlName="typeMaintenance" class="form-control" required>
                  <option value="corrective">Corrective</option>
                  <option value="preventive">Préventive</option>
                  <option value="urgente">Urgente</option>
                  <option value="ameliorative">Améliorative</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="datePrevue" class="form-label">Date Prévue *</label>
                <input type="date" id="datePrevue" formControlName="datePrevue" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="technicienResponsable" class="form-label">Technicien Responsable</label>
                <input type="text" id="technicienResponsable" formControlName="technicienResponsable" class="form-control">
              </div>
              <div class="mb-3">
                <label for="coutEstime" class="form-label">Coût Estimé (MAD)</label>
                <input type="number" id="coutEstime" formControlName="coutEstime" class="form-control">
              </div>
              <div *ngIf="errorMessage" class="alert alert-danger mt-3">{{ errorMessage }}</div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="close.emit()">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="maintenanceForm.invalid || isSubmitting">
                  {{ isSubmitting ? 'Création...' : 'Créer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      opacity: 0.5;
    }
  `]
})
export class CreateMaintenanceModalComponent implements OnInit {
  @Input() anomalieId!: number;
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  maintenanceForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private workflowService: WorkflowService
  ) {
    this.maintenanceForm = this.fb.group({
      titre: ['Maintenance corrective'],
      description: [''],
      typeMaintenance: ['corrective', Validators.required],
      datePrevue: ['', Validators.required],
      technicienResponsable: [''],
      coutEstime: [0]
    });
  }

  ngOnInit() {
    // You could pre-fill the description based on the anomaly if you pass it as an @Input
  }

  onSubmit() {
    if (this.maintenanceForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.workflowService.createMaintenanceFromAnomalie(this.anomalieId, this.maintenanceForm.value)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.created.emit();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = 'Erreur lors de la création de la maintenance. Veuillez réessayer.';
          console.error(err);
        }
      });
  }
}
