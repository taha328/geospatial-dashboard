import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarteIntegrationService, SignalementAnomalie } from '../../services/carte-integration.service';
import { ActifService } from '../../services/actif.service';
import { NotificationService } from '../../services/notification.service';
import { transform } from 'ol/proj';

interface ImagePreview {
  url: string;
  name: string;
  size: string;
  file: File;
}

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
  
  // Updated photo handling following project patterns
  selectedFiles: File[] = [];
  imagePreviews: ImagePreview[] = [];
  
  // Asset selection data following geospatial dashboard patterns
  allActifs: any[] = [];
  isLoadingActifs = false;

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
    private carteIntegrationService: CarteIntegrationService,
    private actifService: ActifService,
    private notificationService: NotificationService
  ) {
    this.signalementForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      typeAnomalie: ['', Validators.required],
      priorite: ['moyen', Validators.required],
      latitude: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      rapportePar: [''], // Added rapportePar field
      actifId: [null, Validators.required],
      photosAnnexes: [null] // Added photosAnnexes field
    });
  }

  ngOnInit() {
    // Initialize coordinates
    if (this.latitude !== undefined && this.longitude !== undefined) {
      this.signalementForm.patchValue({
        latitude: this.latitude,
        longitude: this.longitude
      });
    }
    
    // Load all assets following geospatial dashboard patterns
    this.loadAllActifs();
  }

  /**
   * Load all assets following project service patterns
   */
  async loadAllActifs() {
    try {
      this.isLoadingActifs = true;
      const allAssets = await this.actifService.getActifs().toPromise();
      this.allActifs = allAssets || [];
      
      console.log(`Loaded ${this.allActifs.length} actifs for anomaly reporting`);
    } catch (error) {
      console.error('Error loading all actifs:', error);
      this.errorMessage = 'Erreur lors du chargement des actifs disponibles.';
    } finally {
      this.isLoadingActifs = false;
    }
  }

  setCoordinates(lat: number, lng: number) {
    this.signalementForm.patchValue({
      latitude: lat,
      longitude: lng
    });
  }

  /**
   * Handle multiple file selection for photosAnnexes
   */
  onFileSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    
    if (files.length === 0) return;

    // Validate each file
    const validFiles: File[] = [];
    let hasErrors = false;

    files.forEach(file => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = `Le fichier ${file.name} n'est pas un format d'image valide.`;
        hasErrors = true;
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.errorMessage = `Le fichier ${file.name} dépasse la taille limite de 5MB.`;
        hasErrors = true;
        return;
      }

      validFiles.push(file);
    });

    if (hasErrors) return;

    // Add valid files to selection
    this.selectedFiles = [...this.selectedFiles, ...validFiles];
    
    // Update form control
    this.signalementForm.patchValue({ 
      photosAnnexes: this.selectedFiles.length > 0 ? this.selectedFiles : null 
    });

    // Create previews for new files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push({
          url: e.target.result,
          name: file.name,
          size: this.formatFileSize(file.size),
          file: file
        });
      };
      reader.readAsDataURL(file);
    });

    // Clear any previous error
    this.errorMessage = '';
  }

  /**
   * Remove image from selection
   */
  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
    
    // Update form control
    this.signalementForm.patchValue({ 
      photosAnnexes: this.selectedFiles.length > 0 ? this.selectedFiles : null 
    });
    
    // Reset file input if no files left
    if (this.selectedFiles.length === 0) {
      const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onSubmit() {
    if (this.signalementForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      const formData = new FormData();
      const formValue = this.signalementForm.value;
      
      // Validate coordinates following geospatial dashboard patterns
      const latitude = parseFloat(formValue.latitude);
      const longitude = parseFloat(formValue.longitude);
      
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

      // Ensure asset is selected to prevent null actifId
      if (!formValue.actifId) {
        this.errorMessage = 'Veuillez sélectionner un actif associé à cette anomalie';
        this.isSubmitting = false;
        return;
      }
      
      // Add coordinates explicitly to ensure correct order for PostGIS
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      
      // Add other form fields including rapportePar
      Object.keys(formValue).forEach(key => {
        if (key !== 'photosAnnexes' && key !== 'latitude' && key !== 'longitude' && 
            formValue[key] !== null && formValue[key] !== undefined && formValue[key] !== '') {
          formData.append(key, formValue[key]);
        }
      });

      // Add image files as photosAnnexes following backend entity structure
      if (this.selectedFiles.length > 0) {
        this.selectedFiles.forEach((file, index) => {
          formData.append(`photosAnnexes`, file, file.name);
        });
      }

      // Submit following geospatial dashboard service patterns
      this.carteIntegrationService.signalerAnomalieDepuisCarte(formData)
        .subscribe({
          next: (response) => {
            this.showSuccess = true;
            this.resetForm();
            this.isSubmitting = false;
            
            this.anomalieSignaled.emit();
            this.notificationService.triggerRefresh();
            
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
        if (fieldName === 'actifId') {
          return 'Veuillez sélectionner un actif associé';
        }
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

  onMapClick(event: any) {
    const coordinate = event.coordinate;
    // Transform coordinate from map projection to WGS84
    const lonLat = transform(coordinate, 'EPSG:3857', 'EPSG:4326');
    
    // Pass coordinates in correct order for PostGIS (latitude, longitude)
    this.setCoordinates(
      lonLat[1], // latitude (second element)
      lonLat[0]  // longitude (first element)
    );
  }

  /**
   * Get display text for selected asset following UI patterns
   */
  getSelectedActifDisplay(): string {
    const selectedId = this.signalementForm.get('actifId')?.value;
    if (!selectedId) return '';
    
    const selectedActif = this.allActifs.find(actif => actif.id === parseInt(selectedId));
    
    return selectedActif ? `${selectedActif.nom} (${selectedActif.code})` : '';
  }

  /**
   * Reset form to initial state
   */
  private resetForm(): void {
    this.signalementForm.reset();
    this.signalementForm.patchValue({ priorite: 'moyen' });
    this.showSuccess = false;
    this.errorMessage = '';
    this.selectedFiles = [];
    this.imagePreviews = [];
    
    // Reset file input
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
    // Set default coordinates if provided
    if (this.latitude && this.longitude) {
      this.signalementForm.patchValue({
        latitude: this.latitude,
        longitude: this.longitude
      });
    }
  }

  onReset(): void {
    this.resetForm();
  }
}
