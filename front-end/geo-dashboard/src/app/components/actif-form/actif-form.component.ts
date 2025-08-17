import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActifService, Portefeuille, FamilleActif, GroupeActif } from '../../services/actif.service';
import { CarteIntegrationService } from '../../services/carte-integration.service';

@Component({
  selector: 'app-actif-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './actif-form.component.html',
  styleUrls: ['./actif-form.component.scss'],
})
export class ActifFormComponent implements OnInit {
  @Input() coordinates: [number, number] | null = null;
  @Input() geometry: any = null; // GeoJSON geometry for polygon/linestring actifs
  @Input() editMode = false;
  @Input() actifId: number | null = null;
  
  @Output() cancel = new EventEmitter<void>();
  @Output() submit = new EventEmitter<any>();
  
  actifForm!: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  
  portefeuilles: Portefeuille[] = [];
  familles: FamilleActif[] = [];
  groupes: GroupeActif[] = [];
  
  constructor(
    private fb: FormBuilder,
    private actifService: ActifService,
    private carteIntegrationService: CarteIntegrationService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadPortefeuilles();
    
    if (this.coordinates) {
      // Coordonnées sont dans le format [longitude, latitude] standard GeoJSON
      this.actifForm.patchValue({
        longitude: this.coordinates[0], // longitude
        latitude: this.coordinates[1]   // latitude
      });
    }

    if (this.geometry) {
      // For polygon/linestring actifs, we don't need lat/lng
      this.actifForm.get('latitude')?.setValidators(null);
      this.actifForm.get('longitude')?.setValidators(null);
      this.actifForm.get('latitude')?.updateValueAndValidity();
      this.actifForm.get('longitude')?.updateValueAndValidity();
    }
    
    if (this.editMode && this.actifId) {
      this.loadActifDetails();
    }
  }
  
  initForm(): void {
    this.actifForm = this.fb.group({
      portefeuilleId: ['', Validators.required],
      familleActifId: ['', Validators.required],
      groupeActifId: ['', Validators.required],
      nom: ['', Validators.required],
      code: [{ value: this.editMode ? '' : '(Généré automatiquement)', disabled: !this.editMode }, this.editMode ? Validators.required : null],
      type: ['', Validators.required],
      description: [''],
      statutOperationnel: ['operationnel'],
      etatGeneral: ['bon'],
      latitude: [null, this.geometry ? null : Validators.required],
      longitude: [null, this.geometry ? null : Validators.required],
      dateMiseEnService: [this.formatDate(new Date())],
      dateFinGarantie: [''],
      fournisseur: [''],
      valeurAcquisition: [null],
      specifications: [{}]
    });
  }
  
  loadPortefeuilles(): void {
    this.actifService.getPortefeuilles().subscribe({
      next: (data) => {
        this.portefeuilles = data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des portefeuilles', error);
      }
    });
  }
  
  loadActifDetails(): void {
    if (!this.actifId) return;
    
    this.actifService.getActif(this.actifId).subscribe({
      next: (actif) => {
        // Pour un actif existant, il faut d'abord charger sa hiérarchie
        this.loadHierarchyForActif(actif);
        
        // Puis on remplit le formulaire avec les détails
        this.actifForm.patchValue({
          groupeActifId: actif.groupeActifId,
          nom: actif.nom,
          code: actif.code,
          type: actif.type,
          description: actif.description,
          statutOperationnel: actif.statutOperationnel,
          etatGeneral: actif.etatGeneral,
          latitude: actif.latitude,
          longitude: actif.longitude,
          dateMiseEnService: this.formatDate(actif.dateMiseEnService),
          dateFinGarantie: this.formatDate(actif.dateFinGarantie),
          fournisseur: actif.fournisseur,
          valeurAcquisition: actif.valeurAcquisition,
          specifications: actif.specifications
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails de l\'actif', error);
      }
    });
  }
  
  loadHierarchyForActif(actif: any): void {
    // Cette méthode serait utilisée pour charger la hiérarchie complète d'un actif existant
    // Vous devriez implémenter un endpoint API pour récupérer cette hiérarchie
    // Pour l'instant, c'est simplifié
  }
  
  onPortefeuilleChange(): void {
    const portefeuilleId = this.actifForm.get('portefeuilleId')?.value;
    if (portefeuilleId) {
      // Reset des sélections dépendantes
      this.actifForm.get('familleActifId')?.setValue('');
      this.actifForm.get('groupeActifId')?.setValue('');
      this.familles = [];
      this.groupes = [];
      
      // Charger les familles d'actifs pour ce portefeuille
      this.loadFamillesForPortefeuille(portefeuilleId);
    }
  }
  
  loadFamillesForPortefeuille(portefeuilleId: number): void {
    // Dans un cas réel, vous auriez un endpoint API pour cela
    // Pour l'exemple, on utilise une méthode simulée
    this.actifService.getHierarchy().subscribe({
      next: (hierarchie) => {
        const portefeuille = hierarchie.find(p => p.id === parseInt(portefeuilleId.toString(), 10));
        if (portefeuille && portefeuille.children) {
          this.familles = portefeuille.children as unknown as FamilleActif[];
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des familles', error);
      }
    });
  }
  
  onFamilleChange(): void {
    const familleId = this.actifForm.get('familleActifId')?.value;
    if (familleId) {
      // Reset de la sélection de groupe
      this.actifForm.get('groupeActifId')?.setValue('');
      this.groupes = [];
      
      // Charger les groupes d'actifs pour cette famille
      this.loadGroupesForFamille(familleId);
    }
  }
  
  loadGroupesForFamille(familleId: number): void {
    // Dans un cas réel, vous auriez un endpoint API pour cela
    // Pour l'exemple, on utilise une méthode simulée
    this.actifService.getHierarchy().subscribe({
      next: (hierarchie) => {
        const portefeuilleId = this.actifForm.get('portefeuilleId')?.value;
        const portefeuille = hierarchie.find(p => p.id === parseInt(portefeuilleId.toString(), 10));
        if (portefeuille && portefeuille.children) {
          const famille = portefeuille.children.find(f => f.id === parseInt(familleId.toString(), 10));
          if (famille && famille.children) {
            this.groupes = famille.children as unknown as GroupeActif[];
          }
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des groupes', error);
      }
    });
  }
  
  onSubmit(): void {
    if (this.actifForm.invalid || this.isSubmitting) {
      // Marquer tous les champs comme touchés pour montrer les validations
      Object.keys(this.actifForm.controls).forEach(key => {
        const control = this.actifForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.isSubmitting = true;
    this.errorMessage = null;
    const actifData = this.prepareActifData();
    
    if (this.editMode && this.actifId) {
      this.actifService.updateActif(this.actifId, actifData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.submit.emit(response);
          this.actifForm.reset();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.message || 'Une erreur est survenue lors de la mise à jour.';
          console.error('Erreur lors de la mise à jour de l\'actif', error);
        }
      });
    } else {
      this.createActifWithRetry(actifData);
    }
  }

  /**
   * Crée un actif avec retry automatique en cas de code dupliqué
   */
  private createActifWithRetry(actifData: any, retryCount: number = 0): void {
    if (retryCount >= 3) {
      this.isSubmitting = false;
      this.errorMessage = 'Impossible de générer un code unique après 3 tentatives. Veuillez réessayer.';
      return;
    }

    // Si l'actif a des coordonnées ou une géométrie, utiliser le service de carte
    // Sinon, utiliser le service actif normal (pour les actifs créés depuis le formulaire de gestion)
    let createObservable;
    
    if (this.coordinates || this.geometry) {
      // Préparer les données pour l'API de carte (format spécialisé)
      const geoData = {
        ...actifData,
        // Always send lat/lng if available, even with geometry
        latitude: this.coordinates ? this.coordinates[1] : actifData.latitude,
        longitude: this.coordinates ? this.coordinates[0] : actifData.longitude,
        geometry: this.geometry ? this.geometry : undefined,
        fournisseur: actifData.fournisseur,
        valeurAcquisition: actifData.valeurAcquisition,
        specifications: actifData.specifications,
        groupeActifId: actifData.groupeActifId
      };
      // Remove geometry if not present
      if (!this.geometry) {
        delete geoData.geometry;
      }
      createObservable = this.carteIntegrationService.createActif(geoData);
    } else {
      // Utiliser le service actif normal
      createObservable = this.actifService.createActif(actifData);
    }

    createObservable.subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.submit.emit(response);
        this.actifForm.reset();
      },
      error: (error) => {
        // Vérifier s'il s'agit d'une erreur de code dupliqué
        if (error?.error?.message && error.error.message.includes('existe déjà')) {
          console.log(`Code dupliqué détecté, tentative ${retryCount + 1}/3 - Génération d'un nouveau code...`);
          
          // Générer un nouveau code
          const formValue = this.actifForm.getRawValue();
          const newCode = this.generateUniqueCode(formValue.nom, formValue.type);
          
          // Mettre à jour les données avec le nouveau code
          const newActifData = { ...actifData, code: newCode };
          
          // Retry avec le nouveau code
          this.createActifWithRetry(newActifData, retryCount + 1);
        } else {
          // Autre type d'erreur
          this.isSubmitting = false;
          this.errorMessage = error?.error?.message || error.message || 'Une erreur est survenue lors de la création.';
          console.error('Erreur lors de la création de l\'actif', error);
        }
      }
    });
  }

  prepareActifData(): any {
    // Récupérer les valeurs, y compris celles des contrôles désactivés
    const formValue = this.actifForm.getRawValue();
    
    // Générer un code unique s'il s'agit d'une création (pas d'édition)
    const code = this.editMode 
      ? formValue.code
      : this.generateUniqueCode(formValue.nom, formValue.type);
    
    return {
      nom: formValue.nom,
      code: code,
      type: formValue.type,
      description: formValue.description,
      statutOperationnel: formValue.statutOperationnel,
      etatGeneral: formValue.etatGeneral,
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      dateMiseEnService: formValue.dateMiseEnService,
      dateFinGarantie: formValue.dateFinGarantie,
      fournisseur: formValue.fournisseur,
      valeurAcquisition: formValue.valeurAcquisition,
      specifications: formValue.specifications,
      groupeActifId: formValue.groupeActifId !== '' && formValue.groupeActifId !== null && formValue.groupeActifId !== undefined ? Number(formValue.groupeActifId) : null
    };
  }
  
  onCancel(): void {
    this.cancel.emit();
  }
  
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }
  
  /**
   * Génère un code unique pour un actif basé sur son nom, son type, un timestamp et un nombre aléatoire
   * Format: [Préfixe du type]-[Trois premières lettres du nom]-[Timestamp + nombre aléatoire]
   */
  generateUniqueCode(nom: string, type: string): string {
    // Utilise un timestamp plus précis (incluant millisecondes) + un nombre aléatoire plus grand
    const now = new Date();
    const timestamp = now.getTime().toString(); // Timestamp complet en millisecondes
    const microTimestamp = performance.now().toString().replace('.', ''); // Plus de précision
    const randomPart = Math.floor(Math.random() * 999999).toString().padStart(6, '0'); // Nombre aléatoire à 6 chiffres
    
    // Définir un préfixe en fonction du type d'actif
    let prefix = 'ACT';
    switch(type?.toLowerCase()) {
      case 'bollard':
        prefix = 'BOL';
        break;
      case 'defense':
        prefix = 'DEF';
        break;
      case 'quai':
        prefix = 'QUA';
        break;
      case 'grue':
        prefix = 'GRU';
        break;
      case 'entrepot':
        prefix = 'ENT';
        break;
      case 'eclairage':
        prefix = 'ECL';
        break;
      case 'vehicule':
        prefix = 'VEH';
        break;
      default:
        prefix = 'ACT';
    }
    
    // Extraire les trois premières lettres du nom (ou moins si le nom est plus court)
    const nomPrefix = nom ? nom.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() : 'XXX';
    
    // Combiner timestamp et nombre aléatoire pour plus d'unicité
    const uniqueId = (timestamp.slice(-8) + microTimestamp.slice(-4) + randomPart).slice(-10);
    
    return `${prefix}-${nomPrefix}-${uniqueId}`;
  }
}