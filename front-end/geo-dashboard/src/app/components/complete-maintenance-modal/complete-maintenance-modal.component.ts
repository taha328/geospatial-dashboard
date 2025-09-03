import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaintenanceService } from '../../services/maintenance.service';
import { Maintenance } from '../../services/maintenance.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-complete-maintenance-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './complete-maintenance-modal.component.html',
  styleUrls: ['./complete-maintenance-modal.component.scss'],
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
          
          // Generate and download the detailed report
          const reportUrl = `${environment.apiUrl}/reports/maintenance/${this.maintenance.id}/detailed`;
          console.log('Opening detailed report:', reportUrl);
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
