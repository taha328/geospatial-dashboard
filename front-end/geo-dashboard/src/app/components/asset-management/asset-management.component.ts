import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ActifService, HierarchyNode, StatistiquesActifs, ActifPourCarte } from '../../services/actif.service';
import { AnomalieService, StatistiquesAnomalies, Anomalie } from '../../services/anomalie.service';
import { MaintenanceService, StatistiquesMaintenance, Maintenance } from '../../services/maintenance.service';
import { WorkflowService, AssetWorkflowSummary } from '../../services/workflow.service';
import { CarteIntegrationService } from '../../services/carte-integration.service';
import { DataRefreshService } from '../../services/data-refresh.service';

@Component({
  selector: 'app-asset-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, DatePipe],
  templateUrl: './asset-management.component.html',
  styleUrls: ['./asset-management.component.scss']
})
export class AssetManagementComponent implements OnInit, OnDestroy {
  // Data properties
  hierarchyData: HierarchyNode[] = [];
  statistiquesActifs: StatistiquesActifs | null = null;
  statistiquesAnomalies: StatistiquesAnomalies | null = null;
  statistiquesMaintenance: StatistiquesMaintenance | null = null;
  actifsPourCarte: ActifPourCarte[] = [];
  carteDashboard: any = null;
  
  // Données réelles pour les onglets
  anomaliesData: any[] = [];
  maintenanceData: any[] = [];
  selectedActifDetails: any = null;

  // UI state
  loading = false;
  error: string | null = null;
  activeTab = 'dashboard';
  expandedNodes = new Set<string>();
  selectedNode: HierarchyNode | null = null;
  selectedActif: ActifPourCarte | null = null;

  // Filters
  filtreStatut = 'tous';
  filtreType = 'tous';
  filtrePriorite = 'tous';
  rechercheTexte = '';

  // Anomalie filters
  anomalieSearchTerm = '';
  selectedPriorityFilter = '';
  selectedStatusFilter = '';

  // Maintenance filters
  maintenanceSearchTerm = '';
  maintenanceStatusFilter = '';
  maintenanceTypeFilter = '';

  // Map properties
  showActifsOnMap = true;
  showAnomaliesOnMap = false;
  selectedMapFilter = 'tous';
  mapUrl = 'http://localhost:4200/map';
  
  // Modal states for enhanced workflow
  showAssetDetailsModal = false;
  showCreateAnomalieModal = false;
  showScheduleMaintenanceModal = false;
  selectedAssetForAction: ActifPourCarte | null = null;
  
  // Reactive forms
  createAnomalieForm: FormGroup;
  scheduleMaintenanceForm: FormGroup;
  
  // Form submission states
  anomalieSubmitting = false;
  maintenanceSubmitting = false;
  
  // Synchronization properties
  lastSyncTime: Date | null = null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error' = 'idle';

  // Current time for template
  currentTime = new Date();

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private actifService: ActifService,
    private anomalieService: AnomalieService,
    private maintenanceService: MaintenanceService,
    private workflowService: WorkflowService,
    private carteIntegrationService: CarteIntegrationService,
    private dataRefreshService: DataRefreshService
  ) {
    // Initialize reactive forms
    this.createAnomalieForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      typeAnomalie: ['', Validators.required],
      priorite: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      rapportePar: ['Utilisateur système']
    });

    this.scheduleMaintenanceForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      typeMaintenance: ['', Validators.required],
      datePrevue: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      coutEstime: [0, [Validators.min(0)]],
      technicienResponsable: ['']
    });
    
    // Update time every second for template binding
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  // Add formatCurrency method for template
  formatCurrency(value: number): string {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(value);
  }

  // Method to get current time string for template
  getCurrentTimeString(): string {
    return this.currentTime.toLocaleTimeString('fr-FR');
  }

  ngOnInit() {
    console.log('🚀 AssetManagementComponent initializing...');
    this.loadDashboardData();
    
    // Load initial anomalies and maintenance data
    this.loadAnomaliesData();
    this.loadMaintenanceData();
    
    // Load synchronized map data
    this.loadSynchronizedMapData();
    
    // Subscribe to data refresh events
    this.subscriptions.push(
      this.dataRefreshService.anomalieAdded$.subscribe(() => {
        console.log('Nouvelle anomalie détectée, rafraîchissement des KPI...');
        this.refreshKPIData();
        this.loadSynchronizedMapData();
        if (this.activeTab === 'anomalies') {
          this.loadAnomaliesData();
        }
      })
    );

    this.subscriptions.push(
      this.dataRefreshService.maintenanceUpdated$.subscribe(() => {
        console.log('Maintenance mise à jour, rafraîchissement des KPI...');
        this.refreshKPIData();
        this.loadSynchronizedMapData();
        if (this.activeTab === 'maintenance') {
          this.loadMaintenanceData();
        }
      })
    );
    
    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      this.refreshKPIData();
    }, 30000);

    this.subscriptions.push({
      unsubscribe: () => clearInterval(intervalId)
    } as Subscription);

    // Refresh on window focus
    const focusHandler = () => {
      this.refreshKPIData();
    };
    window.addEventListener('focus', focusHandler);
    
    this.subscriptions.push({
      unsubscribe: () => window.removeEventListener('focus', focusHandler)
    } as Subscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Public methods for external access - keep automatic sync only
  public refreshAllData() {
    this.loadDashboardData();
    this.loadAnomaliesData();
    this.loadMaintenanceData();
  }

  // Tab navigation
  setActiveTab(tab: string) {
    this.activeTab = tab;
    
    switch(tab) {
      case 'anomalies':
        this.loadAnomaliesData();
        break;
      case 'maintenance':
        this.loadMaintenanceData();
        break;
      case 'hierarchy':
        break;
      default:
        break;
    }
  }

  // Data loading methods
  loadDashboardData() {
    this.loading = true;
    this.error = null;

    console.log('🔄 Loading dashboard data with map synchronization...');

    // Load carte dashboard data
    this.carteIntegrationService.getCarteDashboard().subscribe({
      next: (carteData) => {
        console.log('✅ Carte dashboard data loaded:', carteData);
        this.carteDashboard = carteData;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('❌ Error loading carte dashboard data:', error);
        this.checkLoadingComplete();
      }
    });

    // Load assets from map (source of truth)
    this.carteIntegrationService.getActifsForMap().subscribe({
      next: (actifsFromMap) => {
        console.log('✅ Assets from map loaded:', actifsFromMap);
        this.actifsPourCarte = this.convertMapActifsToCardActifs(actifsFromMap);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('❌ Error loading assets from map:', error);
        this.actifService.getActifsPourCarte().subscribe({
          next: (actifsPourCarte) => {
            this.actifsPourCarte = actifsPourCarte;
            this.checkLoadingComplete();
          },
          error: (fallbackError) => {
            console.error('❌ Fallback error loading actifs:', fallbackError);
            this.checkLoadingComplete();
          }
        });
      }
    });

    this.refreshKPIData();
    this.loadHierarchyData();
  }

  refreshKPIData() {
    console.log('🔄 Refreshing KPI data...');
    
    // Load anomalies statistics
    this.anomalieService.getStatistiques().subscribe({
      next: (statsAnomalies) => {
        console.log('✅ KPI Anomalies stats loaded:', statsAnomalies);
        this.statistiquesAnomalies = statsAnomalies;
      },
      error: (error) => {
        console.error('❌ Error refreshing anomalies statistics:', error);
        this.statistiquesAnomalies = this.getTestStatistiquesAnomalies();
      }
    });

    // Load maintenance statistics  
    this.maintenanceService.getStatistiques().subscribe({
      next: (statsMaintenance) => {
        console.log('✅ KPI Maintenance stats loaded:', statsMaintenance);
        this.statistiquesMaintenance = statsMaintenance;
      },
      error: (error) => {
        console.error('❌ Error refreshing maintenance statistics:', error);
        this.statistiquesMaintenance = this.getTestStatistiquesMaintenance();
      }
    });

    // Load assets statistics
    this.actifService.getStatistiques().subscribe({
      next: (statsActifs) => {
        console.log('✅ KPI Assets stats loaded:', statsActifs);
        this.statistiquesActifs = statsActifs;
      },
      error: (error) => {
        console.error('❌ Error refreshing assets statistics:', error);
      }
    });
  }

  loadAnomaliesData() {
    console.log('🔍 Loading anomalies data...');
    
    this.carteIntegrationService.getAnomaliesForMap().subscribe({
      next: (anomaliesFromMap) => {
        console.log('✅ Received anomalies from map:', anomaliesFromMap);
        if (anomaliesFromMap && anomaliesFromMap.length > 0) {
          this.anomaliesData = this.convertMapAnomaliesToDashboardAnomalies(anomaliesFromMap);
          this.updateActifCounters();
        } else {
          this.loadAnomaliesFromService();
        }
      },
      error: (error) => {
        console.error('❌ Error loading anomalies from map:', error);
        this.loadAnomaliesFromService();
      }
    });
  }

  loadMaintenanceData() {
    console.log('🔍 Loading maintenance data...');
    
    this.maintenanceService.getMaintenances().subscribe({
      next: (maintenances) => {
        console.log('✅ Received maintenance data:', maintenances);
        this.maintenanceData = maintenances || [];
        this.updateActifCounters();
        
        if (this.maintenanceData.length === 0) {
          console.log('⚠️ No maintenance found, adding test data');
          this.maintenanceData = this.getTestMaintenanceData();
        }
      },
      error: (error) => {
        console.error('❌ Error loading maintenance data:', error);
        this.maintenanceData = this.getTestMaintenanceData();
        this.updateActifCounters();
      }
    });
  }

  // Synchronization methods
  loadSynchronizedMapData() {
    this.syncStatus = 'syncing';
    
    this.carteIntegrationService.getCarteDashboard().subscribe({
      next: (data) => {
        this.carteDashboard = data;
        this.lastSyncTime = new Date();
        this.syncStatus = 'success';
        console.log('✅ Map data synchronized successfully');
      },
      error: (error) => {
        console.error('❌ Error synchronizing map data:', error);
        this.syncStatus = 'error';
      }
    });
  }

  // Template helper methods for filtering data
  getAnomaliesByPriorite(priorite: string): any[] {
    return this.anomaliesData.filter(a => a.priorite === priorite);
  }

  getAnomaliesByStatut(statut: string): any[] {
    return this.anomaliesData.filter(a => a.statut === statut);
  }

  getAnomaliesWithMaintenance(): any[] {
    return this.anomaliesData.filter(a => a.maintenanceId);
  }

  // New methods for professional anomaly management
  getFilteredAnomalies(): any[] {
    return this.anomaliesData.filter(anomalie => {
      // Search term filter
      if (this.anomalieSearchTerm) {
        const searchLower = this.anomalieSearchTerm.toLowerCase();
        const matchesSearch = 
          anomalie.titre?.toLowerCase().includes(searchLower) ||
          anomalie.description?.toLowerCase().includes(searchLower) ||
          anomalie.actif?.nom?.toLowerCase().includes(searchLower) ||
          anomalie.actif?.code?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Priority filter
      if (this.selectedPriorityFilter && anomalie.priorite !== this.selectedPriorityFilter) {
        return false;
      }

      // Status filter
      if (this.selectedStatusFilter && anomalie.statut !== this.selectedStatusFilter) {
        return false;
      }

      return true;
    });
  }

  getAnomalieProgress(anomalie: any): number {
    if (anomalie.statut === 'resolu') return 100;
    if (anomalie.maintenanceId && anomalie.maintenance?.statut === 'terminee') return 90;
    if (anomalie.maintenanceId && anomalie.maintenance?.statut === 'en_cours') return 70;
    if (anomalie.statut === 'en_cours') return 50;
    if (anomalie.statut === 'nouveau') return 25;
    return 0;
  }

  getStatusLabel(statut: string): string {
    const statusLabels: { [key: string]: string } = {
      'nouveau': 'Nouveau',
      'en_cours': 'En cours',
      'resolu': 'Résolu',
      'ferme': 'Fermé'
    };
    return statusLabels[statut] || statut;
  }

  openCreateAnomalieModal(): void {
    this.showCreateAnomalieModal = true;
  }

  getMaintenancesByStatut(statut: string): any[] {
    return this.maintenanceData.filter(m => m.statut === statut);
  }

  getMaintenancesByType(type: string): any[] {
    return this.maintenanceData.filter(m => m.typeMaintenance === type);
  }

  // New methods for professional maintenance management
  getFilteredMaintenances(): any[] {
    return this.maintenanceData.filter(maintenance => {
      // Search term filter
      if (this.maintenanceSearchTerm) {
        const searchLower = this.maintenanceSearchTerm.toLowerCase();
        const matchesSearch = 
          maintenance.titre?.toLowerCase().includes(searchLower) ||
          maintenance.description?.toLowerCase().includes(searchLower) ||
          maintenance.actif?.nom?.toLowerCase().includes(searchLower) ||
          maintenance.actif?.code?.toLowerCase().includes(searchLower) ||
          maintenance.technicienResponsable?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (this.maintenanceStatusFilter && maintenance.statut !== this.maintenanceStatusFilter) {
        return false;
      }

      // Type filter
      if (this.maintenanceTypeFilter && maintenance.typeMaintenance !== this.maintenanceTypeFilter) {
        return false;
      }

      return true;
    });
  }

  getMaintenanceTypeIcon(type: string): string {
    const typeIcons: { [key: string]: string } = {
      'preventive': '🛡️',
      'corrective': '🔧',
      'urgente': '🚨',
      'ameliorative': '⬆️'
    };
    return typeIcons[type] || '🔧';
  }

  getMaintenanceStatusLabel(statut: string): string {
    const statusLabels: { [key: string]: string } = {
      'planifiee': 'Planifiée',
      'en_cours': 'En cours',
      'terminee': 'Terminée',
      'annulee': 'Annulée'
    };
    return statusLabels[statut] || statut;
  }

  resetMaintenanceFilters(): void {
    this.maintenanceSearchTerm = '';
    this.maintenanceStatusFilter = '';
    this.maintenanceTypeFilter = '';
  }

  showCreateMaintenanceModal(): void {
    this.showScheduleMaintenanceModal = true;
  }

  viewMaintenanceDetails(maintenance: any): void {
    // Implementation for viewing maintenance details
    console.log('Viewing maintenance details:', maintenance);
  }

  // Color utility methods
  getPrioriteColor(priorite: string): string {
    const colors: { [key: string]: string } = {
      'critique': '#dc3545',
      'eleve': '#fd7e14', 
      'moyen': '#ffc107',
      'faible': '#28a745'
    };
    return colors[priorite] || '#6c757d';
  }

  getStatutColor(statut: string): string {
    const colors: { [key: string]: string } = {
      'operationnel': '#28a745',
      'maintenance': '#ffc107',
      'hors_service': '#dc3545',
      'alerte': '#fd7e14'
    };
    return colors[statut] || '#6c757d';
  }

  getEtatColor(etat: string): string {
    const colors: { [key: string]: string } = {
      'excellent': '#28a745',
      'bon': '#28a745',
      'moyen': '#ffc107',
      'mauvais': '#dc3545'
    };
    return colors[etat] || '#6c757d';
  }

  // Asset management methods
  getActifIcon(actif: ActifPourCarte): string {
    const icons: { [key: string]: string } = {
      'quai': '🚢',
      'grue': '🏗️',
      'bollard': '⚓',
      'defense': '🛡️',
      'eclairage': '💡',
      'signalisation': '🚦'
    };
    return icons[actif.type] || '🏭';
  }

  updateActifStatut(actifId: number, newStatut: string) {
    const actif = this.actifsPourCarte.find(a => a.id === actifId);
    if (actif) {
      actif.statutOperationnel = newStatut;
      console.log(`Status updated for actif ${actifId}:`, newStatut);
      // Call backend service to update
      this.actifService.updateActif(actifId, { statutOperationnel: newStatut }).subscribe({
        next: () => {
          console.log('✅ Asset status updated in backend');
          this.refreshKPIData();
        },
        error: (error) => console.error('❌ Error updating asset status:', error)
      });
    }
  }

  // Hierarchy navigation methods - consolidated implementation
  toggleNode(nodeOrId: HierarchyNode | string): void {
    let nodeId: string;
    
    if (typeof nodeOrId === 'string') {
      nodeId = nodeOrId;
    } else {
      nodeId = `${nodeOrId.type}-${nodeOrId.id}`;
    }
    
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }
  }

  isNodeExpanded(nodeOrId: HierarchyNode | string): boolean {
    let nodeId: string;
    
    if (typeof nodeOrId === 'string') {
      nodeId = nodeOrId;
    } else {
      nodeId = `${nodeOrId.type}-${nodeOrId.id}`;
    }
    
    return this.expandedNodes.has(nodeId);
  }

  selectNode(node: HierarchyNode) {
    this.selectedNode = node;
    if (node.type === 'actif') {
      this.loadActifDetails(node.id);
    }
  }

  getNodeIcon(node: HierarchyNode): string {
    const icons: { [key: string]: string } = {
      'portefeuille': '📁',
      'famille': '📂', 
      'groupe': '📦',
      'actif': '🏗️'
    };
    return icons[node.type] || '📄';
  }

  // Asset filtering methods
  getUniqueTypes(): string[] {
    const types = this.actifsPourCarte.map(actif => actif.type);
    return [...new Set(types)].filter(Boolean);
  }

  // Enhanced filtering with priority support (moved to enhanced section)
  // This method is now implemented in the enhanced section below

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  // Add missing methods for template usage

  // Format percentage for KPI display
  formatPercentage(value: number): string {
    if (!value && value !== 0) return '0%';
    return `${Math.round(value)}%`;
  }

  // Get total active anomalies for quick stats
  getTotalAnomaliesActives(): number {
    return this.anomaliesData.filter(a => 
      a.statut === 'nouveau' || a.statut === 'en_cours'
    ).length;
  }

  // Get total scheduled maintenances for quick stats
  getTotalMaintenancesPrevues(): number {
    return this.maintenanceData.filter(m => 
      m.statut === 'planifiee'
    ).length;
  }

  // Map control methods following geospatial dashboard patterns
  toggleMapActifs(): void {
    this.showActifsOnMap = !this.showActifsOnMap;
    console.log('🗺️ Toggle map actifs:', this.showActifsOnMap);
    // Integrate with OpenLayers map service if available
    this.synchronizeMapLayers();
  }

  toggleMapAnomalies(): void {
    this.showAnomaliesOnMap = !this.showAnomaliesOnMap;
    console.log('🗺️ Toggle map anomalies:', this.showAnomaliesOnMap);
    // Integrate with OpenLayers map service if available
    this.synchronizeMapLayers();
  }

  centerMapOnActifs(): void {
    console.log('🗺️ Center map on actifs');
    // Following geospatial dashboard patterns for map centering
    if (this.actifsPourCarte.length > 0) {
      const validActifs = this.actifsPourCarte.filter(a => a.latitude && a.longitude);
      if (validActifs.length > 0) {
        // Calculate bounding box for all assets
        const coordinates = validActifs.map(a => [a.longitude!, a.latitude!]);
        console.log('📍 Centering on coordinates:', coordinates);
        // Integration point for OpenLayers map service
      }
    }
  }

  getMapUrl(): string {
    const params = new URLSearchParams();
    if (this.showActifsOnMap) params.set('showActifs', 'true');
    if (this.showAnomaliesOnMap) params.set('showAnomalies', 'true');
    if (this.selectedMapFilter !== 'tous') params.set('filter', this.selectedMapFilter);
    
    return `${this.mapUrl}?${params.toString()}`;
  }

  signalAnomalieFromMap(): void {
    console.log('🚨 Signal anomalie from map');
    // Following project patterns for anomaly reporting
    // Open anomaly reporting dialog/form or redirect to map
    this.openFullMap();
  }

  openFullMap(): void {
    const mapUrl = this.getMapUrl();
    console.log('🗺️ Opening full map:', mapUrl);
    window.open(mapUrl, '_blank');
  }

  // Private map synchronization method
  private synchronizeMapLayers(): void {
    // Following geospatial dashboard integration patterns
    console.log('🔄 Synchronizing map layers with current filters');
    // This would integrate with the OpenLayers map service
    // to update layer visibility based on component state
  }

  // Private helper methods
  private loadHierarchyData() {
    this.actifService.getHierarchy().subscribe({
      next: (hierarchyData) => {
        this.hierarchyData = hierarchyData;
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la hiérarchie:', error);
        this.checkLoadingComplete();
      }
    });
  }

  private loadAnomaliesFromService() {
    this.anomalieService.getAnomalies().subscribe({
      next: (anomalies) => {
        console.log('✅ Received anomalies from service:', anomalies);
        this.anomaliesData = anomalies || [];
        this.updateActifCounters();
        
        if (this.anomaliesData.length === 0) {
          console.log('⚠️ No anomalies found, adding test data');
          this.anomaliesData = this.getTestAnomaliesData();
        }
      },
      error: (error) => {
        console.error('❌ Error loading anomalies from service:', error);
        this.anomaliesData = this.getTestAnomaliesData();
        this.updateActifCounters();
      }
    });
  }

  private loadActifDetails(actifId: number) {
    this.actifService.getActif(actifId).subscribe({
      next: (actif) => {
        this.selectedActifDetails = actif;
      },
      error: (error) => {
        console.error('Error loading actif details:', error);
      }
    });
  }

  private checkLoadingComplete() {
    if (this.statistiquesActifs && this.hierarchyData.length > 0 && this.actifsPourCarte.length > 0) {
      this.loading = false;
    }
  }

  private updateActifCounters() {
    console.log(`📊 Updated counters - Anomalies: ${this.anomaliesData.length}, Maintenance: ${this.maintenanceData.length}`);
  }

  // Data conversion utilities for map synchronization
  private convertMapActifsToCardActifs(mapActifs: any[]): ActifPourCarte[] {
    return mapActifs.map(actif => ({
      id: actif.id,
      nom: actif.nom || actif.name,
      code: actif.code || `ACT-${actif.id}`,
      type: actif.type,
      statutOperationnel: actif.status || actif.statutOperationnel || 'operationnel',
      etatGeneral: actif.condition || actif.etatGeneral || 'bon',
      latitude: actif.latitude,
      longitude: actif.longitude,
      anomaliesActives: actif.anomaliesActives || 0,
      maintenancesPrevues: actif.maintenancesPrevues || 0
    }));
  }

  private convertMapAnomaliesToDashboardAnomalies(mapAnomalies: any[]): any[] {
    return mapAnomalies.map(anomalie => ({
      id: anomalie.id,
      titre: anomalie.title || anomalie.titre || 'Anomalie détectée',
      description: anomalie.description,
      priorite: anomalie.priority || anomalie.priorite || 'moyen',
      statut: anomalie.status || anomalie.statut || 'nouveau',
      typeAnomalie: anomalie.type || anomalie.typeAnomalie || 'autre',
      actif: anomalie.actif || { nom: 'Actif inconnu', code: 'N/A' },
      actifId: anomalie.assetId || anomalie.actifId,
      dateDetection: anomalie.dateDetection || anomalie.dateSignalement || new Date(),
      rapportePar: anomalie.reportedBy || anomalie.rapportePar || 'Système'
    }));
  }

  // Test data methods
  private getTestStatistiquesAnomalies(): StatistiquesAnomalies {
    return {
      total: this.anomaliesData.length,
      nouvelles: this.anomaliesData.filter(a => a.statut === 'nouveau').length,
      enCours: this.anomaliesData.filter(a => a.statut === 'en_cours').length,
      resolues: this.anomaliesData.filter(a => a.statut === 'resolu').length,
      critiques: this.anomaliesData.filter(a => a.priorite === 'critique').length,
      parPriorite: {
        critique: this.anomaliesData.filter(a => a.priorite === 'critique').length,
        eleve: this.anomaliesData.filter(a => a.priorite === 'eleve').length,
        moyen: this.anomaliesData.filter(a => a.priorite === 'moyen').length,
        faible: this.anomaliesData.filter(a => a.priorite === 'faible').length
      }
    };
  }

  private getTestStatistiquesMaintenance(): StatistiquesMaintenance {
    return {
      total: this.maintenanceData.length,
      planifiees: this.maintenanceData.filter(m => m.statut === 'planifiee').length,
      enCours: this.maintenanceData.filter(m => m.statut === 'en_cours').length,
      terminees: this.maintenanceData.filter(m => m.statut === 'terminee').length,
      parType: {
        preventive: this.maintenanceData.filter(m => m.typeMaintenance === 'preventive').length,
        corrective: this.maintenanceData.filter(m => m.typeMaintenance === 'corrective').length,
        predictive: this.maintenanceData.filter(m => m.typeMaintenance === 'predictive').length
      }
    };
  }

  private getTestAnomaliesData(): any[] {
    return [
      {
        id: 999,
        titre: 'Dysfonctionnement éclairage quai',
        description: 'Plusieurs points lumineux ne fonctionnent plus sur le quai principal',
        priorite: 'eleve',
        statut: 'nouveau',
        typeAnomalie: 'electrique',
        actif: { nom: 'Éclairage Quai A', code: 'ECL-001' },
        actifId: 1,
        dateDetection: new Date(Date.now() - 86400000),
        rapportePar: 'Agent sécurité'
      },
      {
        id: 998,
        titre: 'Fissure dans le revêtement',
        description: 'Fissure observée sur la voie d\'accès principale',
        priorite: 'moyen',
        statut: 'en_cours',
        typeAnomalie: 'structural',
        actif: { nom: 'Voie d\'accès A', code: 'VOI-002' },
        actifId: 2,
        dateDetection: new Date(Date.now() - 172800000),
        rapportePar: 'Technicien maintenance'
      }
    ];
  }

  private getTestMaintenanceData(): any[] {
    return [
      {
        id: 999,
        titre: 'Inspection mensuelle des grues',
        description: 'Inspection mensuelle des grues',
        typeMaintenance: 'preventive',
        statut: 'planifiee',
        actif: { nom: 'Grue portique A', code: 'GRU-001' },
        actifId: 1,
        datePrevue: new Date(Date.now() + 604800000),
        technicienResponsable: 'Jean Dupont',
        coutEstime: 1500
      },
      {
        id: 998,
        titre: 'Réparation système hydraulique',
        description: 'Réparation système hydraulique',
        typeMaintenance: 'corrective',
        statut: 'en_cours',
        actif: { nom: 'Grue mobile B', code: 'GRU-002' },
        actifId: 2,
        datePrevue: new Date(),
        technicienResponsable: 'Marie Martin',
        coutEstime: 2500
      }
    ];
  }

  // ================================
  // ENHANCED ASSET MANAGEMENT METHODS
  // ================================

  // Filter and priority management
  onFilterChange() {
    // This method can be used to trigger additional logic when filters change
    console.log('Filters changed:', {
      statut: this.filtreStatut,
      type: this.filtreType,
      priorite: this.filtrePriorite,
      recherche: this.rechercheTexte
    });
  }

  getAssetsByPriority(priority: string): ActifPourCarte[] {
    return this.getFilteredActifs().filter(actif => this.getAssetPriority(actif) === priority);
  }

  getAssetPriority(actif: ActifPourCarte): string {
    if (actif.anomaliesActives > 0) {
      return 'critique';
    }
    if (actif.maintenancesPrevues > 0) {
      return 'maintenance';
    }
    return 'normal';
  }

  getAssetPriorityLabel(actif: ActifPourCarte): string {
    const priority = this.getAssetPriority(actif);
    switch (priority) {
      case 'critique': return 'Critique';
      case 'maintenance': return 'Maintenance requise';
      default: return 'Normal';
    }
  }

  getPriorityClass(actif: ActifPourCarte): string {
    const priority = this.getAssetPriority(actif);
    return `priority-${priority}`;
  }

  getStatusClass(statut: string): string {
    return `status-${statut.toLowerCase().replace(' ', '-')}`;
  }

  // Issue detection methods
  hasUrgentIssues(actif: ActifPourCarte): boolean {
    return actif.anomaliesActives > 0;
  }

  needsMaintenance(actif: ActifPourCarte): boolean {
    return actif.maintenancesPrevues > 0;
  }

  hasIssuesOrMaintenance(actif: ActifPourCarte): boolean {
    return actif.anomaliesActives > 0 || actif.maintenancesPrevues > 0;
  }

  // Enhanced filtering with priority support
  getFilteredActifs(): ActifPourCarte[] {
    return this.actifsPourCarte.filter(actif => {
      // Status filter
      if (this.filtreStatut !== 'tous' && actif.statutOperationnel !== this.filtreStatut) {
        return false;
      }

      // Type filter
      if (this.filtreType !== 'tous' && actif.type !== this.filtreType) {
        return false;
      }

      // Priority filter
      if (this.filtrePriorite !== 'tous') {
        const priority = this.getAssetPriority(actif);
        if (priority !== this.filtrePriorite) {
          return false;
        }
      }

      // Text search filter
      if (this.rechercheTexte) {
        const searchText = this.rechercheTexte.toLowerCase();
        const searchableText = [
          actif.nom,
          actif.code,
          actif.type,
          actif.groupe,
          actif.famille,
          actif.portefeuille
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchText)) {
          return false;
        }
      }

      return true;
    });
  }

  // Asset action methods
  selectActif(actif: ActifPourCarte) {
    this.selectedActif = actif;
    console.log('Selected actif:', actif);
  }

  viewAssetDetails(actif: ActifPourCarte, event: Event) {
    event.stopPropagation();
    this.selectedAssetForAction = actif;
    this.showAssetDetailsModal = true;
    
    // Load detailed information for the asset using existing method
    this.actifService.getActif(actif.id).subscribe({
      next: (details: any) => {
        this.selectedActifDetails = details;
        console.log('Asset details loaded:', details);
      },
      error: (error: any) => {
        console.error('Error loading asset details:', error);
        this.selectedActifDetails = actif; // Fallback to basic info
      }
    });
  }

  createAnomalieForActif(actif: ActifPourCarte, event: Event) {
    event.stopPropagation();
    this.selectedAssetForAction = actif;
    this.showCreateAnomalieModal = true;
    console.log('Opening anomalie creation for asset:', actif.nom);
  }

  scheduleMaintenanceForActif(actif: ActifPourCarte, event: Event) {
    event.stopPropagation();
    this.selectedAssetForAction = actif;
    this.showScheduleMaintenanceModal = true;
    console.log('Opening maintenance scheduling for asset:', actif.nom);
  }

  showActifOnMap(actif: ActifPourCarte, event: Event) {
    event.stopPropagation();
    if (actif.latitude && actif.longitude) {
      try {
        const lat = typeof actif.latitude === 'number' ? actif.latitude : parseFloat(actif.latitude);
        const lng = typeof actif.longitude === 'number' ? actif.longitude : parseFloat(actif.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          console.log('Switching to map view for asset:', actif.nom, 'at coordinates:', lat, lng);
          // Switch to map tab - the map component will handle highlighting this asset
          this.setActiveTab('carte');
          
          // Store the selected asset so the map can focus on it
          this.selectedActif = actif;
        } else {
          console.warn('Invalid coordinates for asset:', actif);
          alert('Cet actif a des coordonnées invalides.');
        }
      } catch (error) {
        console.error('Error parsing coordinates:', error);
        alert('Erreur lors du traitement des coordonnées de l\'actif.');
      }
    } else {
      console.warn('Asset has no coordinates:', actif);
      alert('Cet actif n\'a pas de coordonnées pour être affiché sur la carte.');
    }
  }

  viewAnomaliesForActif(actif: ActifPourCarte, event: Event) {
    event.stopPropagation();
    // Switch to anomalies tab with actif filter
    this.setActiveTab('anomalies');
    // TODO: Implement anomalie filtering by actif
    console.log('Viewing anomalies for:', actif.nom);
  }

  viewMaintenanceForActif(actif: ActifPourCarte, event: Event) {
    event.stopPropagation();
    // Switch to maintenance tab with actif filter
    this.setActiveTab('maintenance');
    // TODO: Implement maintenance filtering by actif
    console.log('Viewing maintenance for:', actif.nom);
  }

  // Modal management
  closeAssetDetailsModal() {
    this.showAssetDetailsModal = false;
    this.selectedAssetForAction = null;
  }

  closeCreateAnomalieModal() {
    this.showCreateAnomalieModal = false;
    this.selectedAssetForAction = null;
    this.createAnomalieForm.reset();
  }

  closeScheduleMaintenanceModal() {
    this.showScheduleMaintenanceModal = false;
    this.selectedAssetForAction = null;
    this.scheduleMaintenanceForm.reset();
  }

  // Form submission methods
  async submitAnomalieForm(): Promise<void> {
    if (this.createAnomalieForm.valid && this.selectedAssetForAction) {
      this.anomalieSubmitting = true;
      
      try {
        const formValue = this.createAnomalieForm.value;
        const anomalieData = {
          titre: formValue.titre,
          description: formValue.description,
          typeAnomalie: formValue.typeAnomalie,
          priorite: formValue.priorite,
          actifId: this.selectedAssetForAction.id,
          rapportePar: formValue.rapportePar,
          dateDetection: new Date(),
          statut: 'nouveau' as const,
          latitude: this.selectedAssetForAction.latitude,
          longitude: this.selectedAssetForAction.longitude
        };

        await this.anomalieService.createAnomalie(anomalieData).toPromise();
        
        // Refresh data and close modal
        this.loadAnomaliesData();
        this.refreshKPIData();
        this.closeCreateAnomalieModal();
        
        console.log('Anomalie créée avec succès');
      } catch (error) {
        console.error('Erreur lors de la création de l\'anomalie:', error);
      } finally {
        this.anomalieSubmitting = false;
      }
    } else {
      // Mark all fields as touched to show validation errors
      this.createAnomalieForm.markAllAsTouched();
    }
  }

  async submitMaintenanceForm(): Promise<void> {
    if (this.scheduleMaintenanceForm.valid && this.selectedAssetForAction) {
      this.maintenanceSubmitting = true;
      
      try {
        const formValue = this.scheduleMaintenanceForm.value;
        const maintenanceData = {
          titre: formValue.titre,
          description: formValue.description,
          typeMaintenance: formValue.typeMaintenance,
          datePrevue: new Date(formValue.datePrevue),
          actifId: this.selectedAssetForAction.id,
          statut: 'planifiee' as const,
          coutEstime: formValue.coutEstime || 0,
          technicienResponsable: formValue.technicienResponsable
        };

        await this.maintenanceService.createMaintenance(maintenanceData).toPromise();
        
        // Refresh data and close modal
        this.loadMaintenanceData();
        this.refreshKPIData();
        this.closeScheduleMaintenanceModal();
        
        console.log('Maintenance planifiée avec succès');
      } catch (error) {
        console.error('Erreur lors de la planification de la maintenance:', error);
      } finally {
        this.maintenanceSubmitting = false;
      }
    } else {
      // Mark all fields as touched to show validation errors
      this.scheduleMaintenanceForm.markAllAsTouched();
    }
  }

  // Form validation helpers
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['minlength']) return `${fieldName} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['min']) return `${fieldName} doit être supérieur à ${field.errors['min'].min}`;
    }
    return '';
  }

  // Summary calculations
  get totalActifs(): number {
    return this.actifsPourCarte.length;
  }

  get criticalActifs(): number {
    return this.actifsPourCarte.filter((actif: ActifPourCarte) => this.getAssetPriority(actif) === 'critique').length;
  }

  get maintenanceRequiredActifs(): number {
    return this.actifsPourCarte.filter((actif: ActifPourCarte) => this.getAssetPriority(actif) === 'maintenance').length;
  }

  // Status formatting
  formatStatus(statut: string): string {
    switch (statut) {
      case 'operationnel': return 'Opérationnel';
      case 'maintenance': return 'En Maintenance';
      case 'hors-service': return 'Hors Service';
      case 'alerte': return 'En Alerte';
      default: return statut || 'Non défini';
    }
  }

  formatPriority(priority: string): string {
    switch (priority) {
      case 'critique': return 'Critique';
      case 'maintenance': return 'Maintenance';
      case 'normal': return 'Normal';
      default: return 'Normal';
    }
  }

  // Coordinate formatting
  formatCoordinates(actif: ActifPourCarte): string {
    if (!actif) return 'Non localisé';
    
    // Handle latitude/longitude from ActifPourCarte
    if (actif.latitude !== null && actif.latitude !== undefined && 
        actif.longitude !== null && actif.longitude !== undefined) {
      try {
        const lat = typeof actif.latitude === 'number' ? actif.latitude : parseFloat(actif.latitude);
        const lng = typeof actif.longitude === 'number' ? actif.longitude : parseFloat(actif.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
      } catch (error) {
        console.warn('Error formatting coordinates:', error);
      }
    }
    
    return 'Coordonnées invalides';
  }

  // Workflow logic helpers
  canResolveAnomalie(anomalie: any): boolean {
    // Can resolve if:
    // 1. Anomaly is 'en_cours' (assigned/in progress) AND no maintenance is linked (simple fix)
    // 2. OR anomaly has linked maintenance that is completed
    return (
      anomalie.statut === 'en_cours' && 
      (
        !anomalie.maintenanceId || 
        (anomalie.maintenance && anomalie.maintenance.statut === 'terminee')
      )
    );
  }

  // Asset counts by status
  getStatusCount(actif: any, type: 'anomalies' | 'maintenance'): number {
    // Mock data - replace with actual service calls
    if (type === 'anomalies') {
      // Simulate some anomalies based on asset status
      return actif.statut === 'alerte' ? 3 : actif.statut === 'hors-service' ? 5 : 0;
    } else {
      // Simulate maintenance items
      return actif.statut === 'maintenance' ? 2 : 1;
    }
  }

  // ========================================
  // WORKFLOW METHODS
  // ========================================

  // Anomaly workflow methods
 
  async takeAnomalieAction(anomalie: any): Promise<void> {
    // Mark anomaly as in progress
    try {
      await this.anomalieService.updateAnomalie(anomalie.id, {
        statut: 'en_cours',
        assigneA: 'Équipe technique'
      }).toPromise();
      
      this.loadAnomaliesData();
      console.log('Anomalie prise en charge:', anomalie.titre);
    } catch (error) {
      console.error('Erreur lors de la prise en charge:', error);
    }
  }

  async resolveAnomalie(anomalie: any): Promise<void> {
    try {
      const resolutionData = {
        actionsCorrectives: 'Anomalie résolue manuellement',
        resolvedBy: 'Utilisateur système'
      };

      await this.workflowService.resolveAnomalie(anomalie.id, resolutionData).toPromise();
      
      this.loadAnomaliesData();
      this.refreshKPIData();
      
      console.log('Anomalie résolue:', anomalie.titre);
    } catch (error) {
      console.error('Erreur lors de la résolution:', error);
    }
  }

  viewLinkedMaintenance(maintenanceId: number): void {
    this.setActiveTab('maintenance');
    // TODO: Scroll to and highlight the specific maintenance item
    console.log('Navigation vers maintenance:', maintenanceId);
  }

  // Maintenance workflow methods
  async startMaintenance(maintenance: any): Promise<void> {
    try {
      await this.workflowService.startMaintenance(maintenance.id).toPromise();
      
      this.loadMaintenanceData();
      this.refreshKPIData();
      
      console.log('Maintenance démarrée:', maintenance.titre);
    } catch (error) {
      console.error('Erreur lors du démarrage:', error);
    }
  }

  async completeMaintenance(maintenance: any): Promise<void> {
    try {
      const completionData = {
        rapportIntervention: 'Maintenance terminée avec succès',
        coutReel: maintenance.coutEstime,
        resolveLinkedAnomaly: false
      };

      await this.workflowService.completeMaintenance(maintenance.id, completionData).toPromise();
      
      this.loadMaintenanceData();
      this.refreshKPIData();
      
      console.log('Maintenance terminée:', maintenance.titre);
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
    }
  }

  async completeMaintenanceAndResolveAnomalie(maintenance: any): Promise<void> {
    try {
      const completionData = {
        rapportIntervention: 'Maintenance terminée - Anomalie résolue',
        coutReel: maintenance.coutEstime,
        resolveLinkedAnomaly: true
      };

      await this.workflowService.completeMaintenance(maintenance.id, completionData).toPromise();
      
      this.loadMaintenanceData();
      this.loadAnomaliesData();
      this.refreshKPIData();
      
      console.log('Maintenance terminée et anomalie résolue:', maintenance.titre);
    } catch (error) {
      console.error('Erreur lors de la finalisation complète:', error);
    }
  }

  viewLinkedAnomalie(anomalieId: number): void {
    this.setActiveTab('anomalies');
    // TODO: Scroll to and highlight the specific anomalie item
    console.log('Navigation vers anomalie:', anomalieId);
  }

  async createMaintenanceFromAnomalie(anomalie: any): Promise<void> {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const maintenanceData = {
        titre: `Maintenance corrective - ${anomalie.titre}`,
        description: `Maintenance corrective pour l'anomalie: ${anomalie.description}`,
        datePrevue: nextWeek.toISOString(), // Use ISO string for backend compatibility
        technicienResponsable: 'À assigner',
        coutEstime: anomalie.priorite === 'critique' ? 1000 : 500
      };

      console.log('Creating maintenance for anomalie:', anomalie.id, maintenanceData);

      // Use the workflow service following geospatial dashboard patterns
      await this.workflowService.createMaintenanceFromAnomalie(anomalie.id, maintenanceData).toPromise();
      
      // Refresh data using correct method names
      this.loadAnomaliesData();
      this.loadMaintenanceData();
      this.refreshKPIData();
      
      console.log('✅ Maintenance corrective créée pour l\'anomalie:', anomalie.titre);
      
      // Optional: Show success notification following project UI patterns
      // this.showSuccessMessage('Maintenance créée avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la création de la maintenance:', error);
      // Optional: Show error notification following project UI patterns  
      // this.showErrorMessage('Erreur lors de la création de la maintenance');
    }
  }
}
