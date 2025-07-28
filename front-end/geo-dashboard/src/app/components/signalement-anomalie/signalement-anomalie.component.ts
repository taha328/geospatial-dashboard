import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarteIntegrationService, SignalementAnomalie } from '../../services/carte-integration.service';
import { transform } from 'ol/proj';

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
  selectedFile: File | null = null;
  imagePreview: string | null = null;

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
      actifId: [null],
      image: [null]
    });
  }

  ngOnInit() {
    // Fix: Ensure coordinates are properly assigned
    if (this.latitude !== undefined && this.longitude !== undefined) {
      this.signalementForm.patchValue({
        latitude: this.latitude,   // Should be latitude value
        longitude: this.longitude  // Should be longitude value
      });
    }
  }

  getCoordinatesFromMap() {
    // Cette méthode sera appelée depuis le composant carte
    // pour pré-remplir les coordonnées du clic
  }

  setCoordinates(lat: number, lng: number) {
    // Fix: Ensure the parameters are correctly named and assigned
    this.signalementForm.patchValue({
      latitude: lat,   // First parameter should be latitude
      longitude: lng   // Second parameter should be longitude
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Seuls les fichiers image (JPEG, PNG, GIF) sont autorisés.';
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.errorMessage = 'La taille du fichier ne doit pas dépasser 5MB.';
        return;
      }

      this.selectedFile = file;
      this.signalementForm.patchValue({ image: file });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
      
      // Clear any previous error
      this.errorMessage = '';
    }
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.signalementForm.patchValue({ image: null });
    
    // Reset file input
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit() {
    if (this.signalementForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const formData = new FormData();
      const formValue = this.signalementForm.value;
      
      // Fix: Explicitly ensure coordinates are correctly formatted
      const latitude = parseFloat(formValue.latitude);
      const longitude = parseFloat(formValue.longitude);
      
      // Validate coordinate ranges
      if (latitude < -90 || latitude > 90) {
        this.errorMessage = 'Latitude doit être entre -90 et 90 degrés';
        this.isSubmitting = false;
        return;
      }
      
      if (longitude < -180 || longitude > 180) {
        this.errorMessage = 'Longitude doit être entre -180 et 180 degrés';
        this.isSubmitting = false;
        return;
      }
      
      // Add coordinates explicitly to ensure correct order
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      
      // Add other form fields
      Object.keys(formValue).forEach(key => {
        if (key !== 'image' && key !== 'latitude' && key !== 'longitude' && 
            formValue[key] !== null && formValue[key] !== undefined) {
          formData.append(key, formValue[key]);
        }
      });

      // Add image file if selected
      if (this.selectedFile) {
        formData.append('image', this.selectedFile, this.selectedFile.name);
      }

      this.carteIntegrationService.signalerAnomalieDepuisCarte(formData)
        .subscribe({
          next: (response) => {
            this.showSuccess = true;
            this.signalementForm.reset();
            this.signalementForm.patchValue({ priorite: 'moyen' });
            this.isSubmitting = false;
            this.selectedFile = null;
            this.imagePreview = null;
            
            const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
            
            this.anomalieSignaled.emit();
            
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

  // In your map component where you call setCoordinates
  onMapClick(event: any) {
    const coordinate = event.coordinate;
    // Transform coordinate from map projection to WGS84
    const lonLat = transform(coordinate, 'EPSG:3857', 'EPSG:4326');
    
    // Fix: Pass coordinates in correct order (latitude, longitude)
    this.setCoordinates(
      lonLat[1], // latitude (second element)
      lonLat[0]  // longitude (first element)
    );
  }
}
