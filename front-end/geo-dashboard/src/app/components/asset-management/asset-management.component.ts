import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ActifService, HierarchyNode, StatistiquesActifs, ActifPourCarte } from '../../services/actif.service';
import { AnomalieService, StatistiquesAnomalies, Anomalie } from '../../services/anomalie.service';
import { MaintenanceService, StatistiquesMaintenance, Maintenance } from '../../services/maintenance.service';
import { CarteIntegrationService } from '../../services/carte-integration.service';
import { DataRefreshService } from '../../services/data-refresh.service';

@Component({
  selector: 'app-asset-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
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
  rechercheTexte = '';

  // Map properties
  showActifsOnMap = true;
  showAnomaliesOnMap = false;
  selectedMapFilter = 'tous';
  mapUrl = 'http://localhost:4200/map';
  
  // Synchronization properties
  lastSyncTime: Date | null = null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error' = 'idle';

  // Current time for template
  currentTime = new Date();

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private actifService: ActifService,
    private anomalieService: AnomalieService,
    private maintenanceService: MaintenanceService,
    private carteIntegrationService: CarteIntegrationService,
    private dataRefreshService: DataRefreshService
  ) {
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

  getMaintenancesByStatut(statut: string): any[] {
    return this.maintenanceData.filter(m => m.statut === statut);
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

  // Action methods for anomalies and maintenance
  resolveAnomalie(anomalie: any) {
    if (confirm(`Êtes-vous sûr de vouloir résoudre l'anomalie "${anomalie.titre}" ?`)) {
      anomalie.statut = 'resolu';
      console.log('Anomalie résolue:', anomalie);
      // Call backend service to update
      this.anomalieService.updateAnomalie(anomalie.id, anomalie).subscribe({
        next: () => {
          console.log('✅ Anomalie updated in backend');
          this.refreshKPIData();
        },
        error: (error) => console.error('❌ Error updating anomalie:', error)
      });
    }
  }

  startMaintenance(maintenance: any) {
    if (confirm(`Démarrer la maintenance "${maintenance.titre || maintenance.description}" ?`)) {
      maintenance.statut = 'en_cours';
      console.log('Maintenance démarrée:', maintenance);
      // Call backend service to update
      this.maintenanceService.updateMaintenance(maintenance.id, maintenance).subscribe({
        next: () => {
          console.log('✅ Maintenance updated in backend');
          this.refreshKPIData();
        },
        error: (error) => console.error('❌ Error updating maintenance:', error)
      });
    }
  }

  completeMaintenance(maintenance: any) {
    if (confirm(`Terminer la maintenance "${maintenance.titre || maintenance.description}" ?`)) {
      maintenance.statut = 'terminee';
      console.log('Maintenance terminée:', maintenance);
      // Call backend service to update
      this.maintenanceService.updateMaintenance(maintenance.id, maintenance).subscribe({
        next: () => {
          console.log('✅ Maintenance completed in backend');
          this.refreshKPIData();
        },
        error: (error) => console.error('❌ Error updating maintenance:', error)
      });
    }
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

  getFilteredActifs(): ActifPourCarte[] {
    return this.actifsPourCarte.filter(actif => {
      const matchesStatut = this.filtreStatut === 'tous' || actif.statutOperationnel === this.filtreStatut;
      const matchesType = this.filtreType === 'tous' || actif.type === this.filtreType;
      const matchesSearch = !this.rechercheTexte || 
        actif.nom.toLowerCase().includes(this.rechercheTexte.toLowerCase()) ||
        actif.code.toLowerCase().includes(this.rechercheTexte.toLowerCase());
      
      return matchesStatut && matchesType && matchesSearch;
    });
  }

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
}
