import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActifService, Portefeuille, FamilleActif, GroupeActif } from '../../services/actif.service';
import { CarteIntegrationService } from '../../services/carte-integration.service';

@Component({
  selector: 'app-actif-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="actif-form-container">
      <div class="form-header">
        <h2>{{ editMode ? 'Modifier' : 'Créer' }} un actif</h2>
        <button type="button" class="btn-close" (click)="cancel.emit()">×</button>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <form [formGroup]="actifForm" (ngSubmit)="onSubmit()">
        <!-- Hiérarchie - Portefeuille, Famille, Groupe -->
        <div class="hierarchy-section">
          <h3>Hiérarchie</h3>
          
          <div class="form-group">
            <label for="portefeuille">Portefeuille</label>
            <select id="portefeuille" formControlName="portefeuilleId" class="form-control" (change)="onPortefeuilleChange()">
              <option value="">Sélectionner un portefeuille</option>
              <option *ngFor="let p of portefeuilles" [value]="p.id">{{ p.nom }}</option>
            </select>
            <div *ngIf="actifForm.get('portefeuilleId')?.invalid && actifForm.get('portefeuilleId')?.touched" class="error-message">
              Portefeuille requis
            </div>
          </div>
          
          <div class="form-group">
            <label for="famille">Famille d'actifs</label>
            <select id="famille" formControlName="familleActifId" class="form-control" [disabled]="!familles.length" (change)="onFamilleChange()">
              <option value="">Sélectionner une famille</option>
              <option *ngFor="let f of familles" [value]="f.id">{{ f.nom }}</option>
            </select>
            <div *ngIf="actifForm.get('familleActifId')?.invalid && actifForm.get('familleActifId')?.touched" class="error-message">
              Famille requise
            </div>
          </div>
          
          <div class="form-group">
            <label for="groupe">Groupe d'actifs</label>
            <select id="groupe" formControlName="groupeActifId" class="form-control" [disabled]="!groupes.length">
              <option value="">Sélectionner un groupe</option>
              <option *ngFor="let g of groupes" [value]="g.id">{{ g.nom }}</option>
            </select>
            <div *ngIf="actifForm.get('groupeActifId')?.invalid && actifForm.get('groupeActifId')?.touched" class="error-message">
              Groupe requis
            </div>
          </div>
        </div>
        
        <!-- Informations de base -->
        <div class="basic-info-section">
          <h3>Informations de base</h3>
          
          <div class="form-group">
            <label for="nom">Nom de l'actif</label>
            <input id="nom" type="text" formControlName="nom" class="form-control">
            <div *ngIf="actifForm.get('nom')?.invalid && actifForm.get('nom')?.touched" class="error-message">
              Nom requis
            </div>
          </div>
          
          <div class="form-group">
            <label for="code">Code</label>
            <input id="code" type="text" formControlName="code" class="form-control" [readonly]="!editMode">
            <div *ngIf="!editMode" class="form-text text-muted">
              Le code sera généré automatiquement lors de la création de l'actif
            </div>
            <div *ngIf="actifForm.get('code')?.invalid && actifForm.get('code')?.touched" class="error-message">
              Code requis
            </div>
          </div>
          
          <div class="form-group">
            <label for="type">Type d'actif</label>
            <select id="type" formControlName="type" class="form-control">
              <option value="">Sélectionner un type</option>
              <option value="bollard">Bollard</option>
              <option value="defense">Défense</option>
              <option value="quai">Quai</option>
              <option value="grue">Grue</option>
              <option value="entrepot">Entrepôt</option>
              <option value="eclairage">Éclairage</option>
              <option value="vehicule">Véhicule</option>
              <option value="autre">Autre</option>
            </select>
            <div *ngIf="actifForm.get('type')?.invalid && actifForm.get('type')?.touched" class="error-message">
              Type requis
            </div>
          </div>
          
          <div class="form-group">
            <label for="numeroSerie">Numéro de série</label>
            <input id="numeroSerie" type="text" formControlName="numeroSerie" class="form-control">
          </div>
        </div>
        
        <!-- État et statut -->
        <div class="status-section">
          <h3>État et statut</h3>
          
          <div class="form-group">
            <label for="statutOperationnel">Statut opérationnel</label>
            <select id="statutOperationnel" formControlName="statutOperationnel" class="form-control">
              <option value="operationnel">Opérationnel</option>
              <option value="maintenance">En maintenance</option>
              <option value="hors_service">Hors service</option>
              <option value="alerte">En alerte</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="etatGeneral">État général</label>
            <select id="etatGeneral" formControlName="etatGeneral" class="form-control">
              <option value="bon">Bon</option>
              <option value="moyen">Moyen</option>
              <option value="mauvais">Mauvais</option>
              <option value="critique">Critique</option>
            </select>
          </div>
        </div>
        
        <!-- Localisation -->
        <div class="location-section">
          <h3>Localisation</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="latitude">Latitude</label>
              <input id="latitude" type="number" formControlName="latitude" class="form-control" [readonly]="true">
            </div>
            
            <div class="form-group">
              <label for="longitude">Longitude</label>
              <input id="longitude" type="number" formControlName="longitude" class="form-control" [readonly]="true">
            </div>
          </div>
        </div>
        
        <!-- Informations additionnelles -->
        <div class="additional-info-section">
          <h3>Informations additionnelles</h3>
          
          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" formControlName="description" class="form-control" rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label for="dateMiseEnService">Date de mise en service</label>
            <input id="dateMiseEnService" type="date" formControlName="dateMiseEnService" class="form-control">
          </div>
          
          <div class="form-group">
            <label for="dateFinGarantie">Date de fin de garantie</label>
            <input id="dateFinGarantie" type="date" formControlName="dateFinGarantie" class="form-control">
          </div>
          
          <div class="form-group">
            <label for="fournisseur">Fournisseur</label>
            <input id="fournisseur" type="text" formControlName="fournisseur" class="form-control">
          </div>
          
          <div class="form-group">
            <label for="valeurAcquisition">Valeur d'acquisition (€)</label>
            <input id="valeurAcquisition" type="number" formControlName="valeurAcquisition" class="form-control">
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel.emit()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="actifForm.invalid || isSubmitting">
            {{ editMode ? 'Mettre à jour' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .actif-form-container {
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      padding: 20px;
      width: 600px;
      max-width: 100%;
      max-height: 80vh;
      overflow-y: auto;
    }
    
    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    
    .form-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
    }
    
    h3 {
      font-size: 1.1rem;
      color: #333;
      margin: 15px 0 10px;
      border-bottom: 1px solid #f0f0f0;
      padding-bottom: 5px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
    }
    
    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .form-row {
      display: flex;
      gap: 15px;
    }
    
    .form-row .form-group {
      flex: 1;
    }
    
    .error-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      border-top: 1px solid #eee;
      padding-top: 15px;
    }
    
    .btn {
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      border: none;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #0069d9;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background-color: #5a6268;
    }
    
    .hierarchy-section,
    .basic-info-section,
    .status-section,
    .location-section,
    .additional-info-section {
      background-color: #f9f9f9;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    select:disabled, input:disabled {
      background-color: #e9ecef;
      cursor: not-allowed;
    }
  `]
})
export class ActifFormComponent implements OnInit {
  @Input() coordinates: [number, number] | null = null;
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
      numeroSerie: [''],
      statutOperationnel: ['operationnel'],
      etatGeneral: ['bon'],
      latitude: [null, Validators.required],
      longitude: [null, Validators.required],
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
          numeroSerie: actif.numeroSerie,
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

    // Si l'actif a des coordonnées, utiliser le service de carte (pour les actifs créés depuis la carte)
    // Sinon, utiliser le service actif normal (pour les actifs créés depuis le formulaire de gestion)
    let createObservable;
    
    if (actifData.latitude && actifData.longitude && this.coordinates) {
      // Préparer les données pour l'API de carte (format GeoJSON)
      const geoData = {
        ...actifData,
        geom: {
          type: 'Point',
          coordinates: [actifData.longitude, actifData.latitude]
        }
      };
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
      numeroSerie: formValue.numeroSerie,
      statutOperationnel: formValue.statutOperationnel,
      etatGeneral: formValue.etatGeneral,
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      dateMiseEnService: formValue.dateMiseEnService,
      dateFinGarantie: formValue.dateFinGarantie,
      fournisseur: formValue.fournisseur,
      valeurAcquisition: formValue.valeurAcquisition,
      specifications: formValue.specifications,
      groupeActifId: formValue.groupeActifId
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
