import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Renderer2, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { VesselService } from '../../services/vessel.service';
import { PointService } from '../../services/point.service';

export interface Vessel {
  id: string;
  name: string;
  imo?: string;
  mmsi?: string;
  vesselType: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  status: 'active' | 'anchored' | 'moored' | 'unknown';
  lastUpdated: Date;
  flag?: string;
  length?: number;
  width?: number;
}

@Component({
  selector: 'app-vessel-finder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vessel-finder.component.html',
  styleUrls: ['./vessel-finder.component.scss']
})
export class VesselFinderComponent implements OnInit, AfterViewInit {
  @ViewChild('vesselMapContainer', { static: false }) vesselMapContainer!: ElementRef;

  vessels: Vessel[] = [];
  loading = false;
  error: string | null = null;
  
  // Map configuration for Tanger Med Port (VesselFinder format)
  mapConfig = {
    width: "100%",
    height: "400",
    latitude: "35.8845",    // Tanger Med Port coordinates
    longitude: "-5.5026", 
    zoom: "12",             // Zoomed in on the port
    names: true,            // Show ship names
    show_track: false,      // Don't show track lines initially
    mmsi: "",               // Can be set to track specific ship
    imo: "",                // Can be set to track specific ship
    fleet: "",              // Fleet tracking (if available)
    fleet_name: "",         // Fleet name
    fleet_timespan: "1440"  // Max age in minutes
  };

  // UI state
  showVesselList = true;
  showEmbeddedMap = true;
  selectedView: 'both' | 'map' | 'list' = 'both';

  // Statistics
  vesselStats = {
    total: 0,
    active: 0,
    anchored: 0,
    moored: 0,
    tankers: 0,
    containers: 0,
    cargo: 0
  };

  constructor(
    // private vesselService: VesselService,
    private pointService: PointService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loadVessels();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadVesselFinderMap();
    }
  }

  private loadVesselFinderMap() {
    // Since VesselFinder has CORS and X-Frame-Options restrictions, 
    // we'll create a useful alternative with OpenLayers map
    try {
      if (!this.vesselMapContainer) {
        console.error('Map container not found');
        return;
      }

      const mapContainer = this.vesselMapContainer.nativeElement;
      
      // Clear previous content
      mapContainer.innerHTML = '';

      // Create a comprehensive map alternative
      const mapAlternative = document.createElement('div');
      mapAlternative.innerHTML = `
        <div style="background: linear-gradient(135deg, #0077be 0%, #00a8e6 100%); 
                    color: white; padding: 20px; border-radius: 12px; text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px;">
            <div style="font-size: 32px;">🗺️</div>
            <h3 style="margin: 0; font-size: 22px;">Carte Maritime - Port Tanger Med</h3>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; font-size: 14px;">
              <div><strong>Latitude:</strong><br>${this.mapConfig.latitude}°N</div>
              <div><strong>Longitude:</strong><br>${this.mapConfig.longitude}°W</div>
              <div><strong>Zone:</strong><br>Détroit Gibraltar</div>
              <div><strong>Port:</strong><br>Tanger Med</div>
            </div>
          </div>

          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin: 20px 0;">
            <button onclick="window.open('https://www.vesselfinder.com/fr?latitude=${this.mapConfig.latitude}&longitude=${this.mapConfig.longitude}&zoom=${this.mapConfig.zoom}', '_blank')" 
                    style="padding: 10px 20px; background: #ffffff; color: #0077be; border: none; 
                           border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;">
              🚢 VesselFinder
            </button>
            <button onclick="window.open('https://www.marinetraffic.com/en/ais/home/centerx:${this.mapConfig.longitude}/centery:${this.mapConfig.latitude}/zoom:${this.mapConfig.zoom}', '_blank')" 
                    style="padding: 10px 20px; background: #ffffff; color: #0077be; border: none; 
                           border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;">
              🌊 MarineTraffic
            </button>
            <button onclick="window.open('https://www.myshiptracking.com/?lat=${this.mapConfig.latitude}&lng=${this.mapConfig.longitude}&zoom=${this.mapConfig.zoom}', '_blank')" 
                    style="padding: 10px 20px; background: #ffffff; color: #0077be; border: none; 
                           border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px;">
              📍 MyShipTracking
            </button>
          </div>

          <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 6px; font-size: 13px;">
            <div style="margin-bottom: 8px;"><strong>🎯 Zone de Surveillance</strong></div>
            <div>Port de Tanger Med • Principal hub logistique du Maroc</div>
            <div>Trafic de conteneurs • Connexions intercontinentales</div>
          </div>

          <div style="margin-top: 15px; font-size: 12px; opacity: 0.9;">
            Cliquez sur un service ci-dessus pour voir les navires en temps réel
          </div>
        </div>
      `;
      
      mapContainer.appendChild(mapAlternative);
      
      console.log('Map alternative displayed successfully');
      this.error = null;

    } catch (error) {
      console.error('Error loading map alternative:', error);
      this.error = 'Erreur lors du chargement de la carte';
    }
  }

  private tryScriptMethod() {
    // Fallback: Show informative placeholder with direct link
    try {
      if (!this.vesselMapContainer) {
        return;
      }

      const mapContainer = this.vesselMapContainer.nativeElement;
      mapContainer.innerHTML = '';

      // Create an informative placeholder
      const placeholder = document.createElement('div');
      placeholder.innerHTML = `
        <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); 
                    padding: 30px; text-align: center; border-radius: 12px; 
                    border: 2px solid #2196f3; margin: 10px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🚢</div>
          <h3 style="color: #1976d2; margin: 0 0 16px 0; font-size: 20px;">
            Carte VesselFinder - Port Tanger Med
          </h3>
          <p style="color: #424242; margin: 8px 0; font-size: 14px;">
            <strong>Position:</strong> ${this.mapConfig.latitude}°N, ${this.mapConfig.longitude}°W
          </p>
          <p style="color: #424242; margin: 8px 0 20px 0; font-size: 14px;">
            <strong>Zone de surveillance:</strong> Détroit de Gibraltar
          </p>
          <button onclick="window.open('https://www.vesselfinder.com/fr?latitude=${this.mapConfig.latitude}&longitude=${this.mapConfig.longitude}&zoom=${this.mapConfig.zoom}', '_blank')" 
                  style="padding: 12px 24px; background: #2196f3; color: white; border: none; 
                         border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;
                         box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3); transition: all 0.3s;">
            🔗 Ouvrir VesselFinder dans un nouvel onglet
          </button>
          <p style="color: #666; margin: 16px 0 0 0; font-size: 12px;">
            Cliquez pour voir les navires en temps réel dans la zone de Tanger Med
          </p>
        </div>
      `;
      
      mapContainer.appendChild(placeholder);
      
      console.log('VesselFinder fallback placeholder displayed');

    } catch (error) {
      console.error('Error in fallback method:', error);
      this.error = 'Échec du chargement de la carte des navires';
    }
  }

  async loadVessels() {
    this.loading = true;
    this.error = null;
    
    try {
      // For now, generate some sample vessel data for the Tanger Med area
      // TODO: Replace with real vessel tracking API integration
      this.vessels = this.generateSampleVessels();
      console.log('Sample vessel data loaded for demonstration');
      
      this.calculateStats();
      
    } catch (error) {
      console.error('Error loading vessels:', error);
      this.error = 'Impossible de charger les données des navires';
      this.vessels = [];
      this.calculateStats();
    } finally {
      this.loading = false;
    }
  }

  private generateSampleVessels(): Vessel[] {
    // Generate realistic sample data for Tanger Med area
    const sampleVessels: Vessel[] = [
      {
        id: 'tmd_001',
        name: 'MSC TANGER',
        imo: '9234567',
        mmsi: '242123456',
        vesselType: 'Container Ship',
        latitude: 35.8845 + (Math.random() - 0.5) * 0.01,
        longitude: -5.5026 + (Math.random() - 0.5) * 0.01,
        heading: Math.floor(Math.random() * 360),
        speed: Math.random() * 2,
        status: 'moored',
        flag: 'MA',
        length: 400,
        width: 59,
        lastUpdated: new Date(Date.now() - Math.random() * 600000)
      },
      {
        id: 'tmd_002',
        name: 'CMA CGM ATLAS',
        imo: '9345678',
        mmsi: '212234567',
        vesselType: 'Container Ship',
        latitude: 35.8850 + (Math.random() - 0.5) * 0.01,
        longitude: -5.5020 + (Math.random() - 0.5) * 0.01,
        heading: Math.floor(Math.random() * 360),
        speed: Math.random() * 15 + 5,
        status: 'active',
        flag: 'FR',
        length: 366,
        width: 51,
        lastUpdated: new Date(Date.now() - Math.random() * 300000)
      },
      {
        id: 'tmd_003',
        name: 'MAERSK GIBRALTAR',
        imo: '9456789',
        mmsi: '219345678',
        vesselType: 'Container Ship',
        latitude: 35.8840 + (Math.random() - 0.5) * 0.01,
        longitude: -5.5030 + (Math.random() - 0.5) * 0.01,
        heading: Math.floor(Math.random() * 360),
        speed: 0,
        status: 'anchored',
        flag: 'DK',
        length: 347,
        width: 42,
        lastUpdated: new Date(Date.now() - Math.random() * 600000)
      },
      {
        id: 'tmd_004',
        name: 'PILOT TANGER',
        mmsi: '242456789',
        vesselType: 'Tug',
        latitude: 35.8860 + (Math.random() - 0.5) * 0.005,
        longitude: -5.5010 + (Math.random() - 0.5) * 0.005,
        heading: Math.floor(Math.random() * 360),
        speed: Math.random() * 10 + 2,
        status: 'active',
        flag: 'MA',
        length: 28,
        width: 9,
        lastUpdated: new Date(Date.now() - Math.random() * 180000)
      },
      {
        id: 'tmd_005',
        name: 'ATLANTIC BRIDGE',
        imo: '9567890',
        mmsi: '351567890',
        vesselType: 'Cargo Ship',
        latitude: 35.8835 + (Math.random() - 0.5) * 0.01,
        longitude: -5.5035 + (Math.random() - 0.5) * 0.01,
        heading: Math.floor(Math.random() * 360),
        speed: Math.random() * 18 + 8,
        status: 'active',
        flag: 'PA',
        length: 225,
        width: 32,
        lastUpdated: new Date(Date.now() - Math.random() * 400000)
      }
    ];

    return sampleVessels;
  }

  private calculateStats() {
    this.vesselStats = {
      total: this.vessels.length,
      active: this.vessels.filter(v => v.status === 'active').length,
      anchored: this.vessels.filter(v => v.status === 'anchored').length,
      moored: this.vessels.filter(v => v.status === 'moored').length,
      tankers: this.vessels.filter(v => v.vesselType.toLowerCase().includes('tanker')).length,
      containers: this.vessels.filter(v => v.vesselType.toLowerCase().includes('container')).length,
      cargo: this.vessels.filter(v => v.vesselType.toLowerCase().includes('cargo')).length
    };
  }

  onViewChange(view: 'both' | 'map' | 'list') {
    this.selectedView = view;
    this.showVesselList = view === 'both' || view === 'list';
    this.showEmbeddedMap = view === 'both' || view === 'map';
  }

  refreshData() {
    this.loadVessels();
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return '🚢';
      case 'anchored': return '⚓';
      case 'moored': return '🔗';
      default: return '❓';
    }
  }

  getVesselTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'container ship': return '📦';
      case 'cargo ship': return '🚛';
      case 'tanker': return '🛢️';
      case 'passenger ship': return '🛳️';
      case 'fishing vessel': return '🎣';
      case 'tug': return '🚤';
      case 'supply ship': return '�';
      default: return '🚢';
    }
  }

  formatLastUpdate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
  }

  getFlagEmoji(countryCode: string): string {
    const flags: { [key: string]: string } = {
      'MA': '🇲🇦', 'FR': '🇫🇷', 'DK': '🇩🇰', 'PA': '🇵🇦',
      'LR': '🇱🇷', 'ES': '🇪🇸', 'IT': '🇮🇹', 'GB': '🇬🇧'
    };
    return flags[countryCode] || '🏳️';
  }

  trackByVesselId(index: number, vessel: Vessel): string {
    return vessel.id;
  }

  reloadVesselFinderMap() {
    // Reload the VesselFinder map
    if (isPlatformBrowser(this.platformId)) {
      this.loadVesselFinderMap();
    }
  }

  getCurrentTimeString(): string {
    return new Date().toLocaleTimeString('fr-FR');
  }

  // Methods to interact with VesselFinder map
  trackVesselByMMSI(mmsi: string) {
    this.mapConfig.mmsi = mmsi;
    this.mapConfig.imo = ""; // Clear IMO when using MMSI
    this.reloadVesselFinderMap();
  }

  trackVesselByIMO(imo: string) {
    this.mapConfig.imo = imo;
    this.mapConfig.mmsi = ""; // Clear MMSI when using IMO
    this.reloadVesselFinderMap();
  }

  toggleVesselNames() {
    this.mapConfig.names = !this.mapConfig.names;
    this.reloadVesselFinderMap();
  }

  toggleTrackLines() {
    this.mapConfig.show_track = !this.mapConfig.show_track;
    this.reloadVesselFinderMap();
  }

  resetMapView() {
    this.mapConfig.mmsi = "";
    this.mapConfig.imo = "";
    this.mapConfig.show_track = false;
    this.reloadVesselFinderMap();
  }
}
