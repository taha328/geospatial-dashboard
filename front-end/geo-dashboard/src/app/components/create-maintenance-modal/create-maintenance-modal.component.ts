import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkflowService } from '../../services/workflow.service'; // Make sure this path is correct

@Component({
  selector: 'app-create-maintenance-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-maintenance-modal.component.html',
  styleUrls: ['./create-maintenance-modal.component.scss']
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
