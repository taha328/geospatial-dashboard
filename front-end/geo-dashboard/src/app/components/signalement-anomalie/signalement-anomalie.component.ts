import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarteIntegrationService, SignalementAnomalie } from '../../services/carte-integration.service';

@Component({
  selector: 'app-signalement-anomalie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signalement-anomalie.component.html',
  styleUrls: ['./signalement-anomalie.component.scss']
})
export class SignalementAnomalieComponent implements OnInit {
  @Input() latitude?: number;
  @Input() longitude?: number;
  @Output() anomalieSignaled = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  signalementForm: FormGroup;
  isSubmitting = false;
  showSuccess = false;
  errorMessage = '';

  typesAnomalies = [
    { value: 'structural', label: 'Structurel' },
    { value: 'mecanique', label: 'Mécanique' },
    { value: 'electrique', label: 'Électrique' },
    { value: 'securite', label: 'Sécurité' },
    { value: 'autre', label: 'Autre' }
  ];

  priorites = [
    { value: 'faible', label: 'Faible', color: '#28a745' },
    { value: 'moyen', label: 'Moyenne', color: '#ffc107' },
    { value: 'eleve', label: 'Élevée', color: '#fd7e14' },
    { value: 'critique', label: 'Critique', color: '#dc3545' }
  ];

  constructor(
    private fb: FormBuilder,
    private carteIntegrationService: CarteIntegrationService
  ) {
    this.signalementForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      typeAnomalie: ['', Validators.required],
      priorite: ['moyen', Validators.required],
      latitude: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      rapportePar: [''],
      actifId: [null]
    });
  }

  ngOnInit() {
    // Pré-remplir les coordonnées si disponibles
    if (this.latitude && this.longitude) {
      this.signalementForm.patchValue({
        latitude: this.latitude,
        longitude: this.longitude
      });
    }
  }

  getCoordinatesFromMap() {
    // Cette méthode sera appelée depuis le composant carte
    // pour pré-remplir les coordonnées du clic
  }

  setCoordinates(lat: number, lng: number) {
    this.signalementForm.patchValue({
      latitude: lat,
      longitude: lng
    });
  }

  onSubmit() {
    if (this.signalementForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const signalement: SignalementAnomalie = this.signalementForm.value;

      this.carteIntegrationService.signalerAnomalieDepuisCarte(signalement)
        .subscribe({
          next: (response) => {
            this.showSuccess = true;
            this.signalementForm.reset();
            this.signalementForm.patchValue({ priorite: 'moyen' });
            this.isSubmitting = false;
            
            // Émettre l'événement de succès
            this.anomalieSignaled.emit();
            
            // Cacher le message de succès après 3 secondes
            setTimeout(() => {
              this.showSuccess = false;
            }, 3000);
          },
          error: (error) => {
            this.errorMessage = 'Erreur lors du signalement de l\'anomalie. Veuillez réessayer.';
            this.isSubmitting = false;
            console.error('Erreur signalement:', error);
          }
        });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.signalementForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldErrorMessage(fieldName: string): string {
    const field = this.signalementForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return 'Ce champ est requis';
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors['min'] || field.errors['max']) {
        return 'Coordonnées invalides';
      }
    }
    return '';
  }

  onCancel() {
    this.cancelled.emit();
  }
}
