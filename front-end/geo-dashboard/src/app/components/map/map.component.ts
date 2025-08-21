import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource, Cluster, XYZ } from 'ol/source';
import { Feature } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import { Point, Polygon, LineString, Geometry } from 'ol/geom';
import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import { fromLonLat, transform } from 'ol/proj';
import { GeoJSON } from 'ol/format';
import { Draw, Modify, Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import { ZoneService } from '../../services/zone.service';
import { UserService } from '../../services/user.service';
import { CarteIntegrationService, ActifPourCarte, AnomaliePourCarte } from '../../services/carte-integration.service';
import { ActifService } from '../../services/actif.service';
import { DataRefreshService } from '../../services/data-refresh.service';
import { SelectEvent } from 'ol/interaction/Select';
import { ol_layer_AnimatedCluster } from './ol-animated-cluster-ext.layer';
import { SignalementAnomalieComponent } from '../signalement-anomalie/signalement-anomalie.component';
import { ActifFormComponent } from '../actif-form/actif-form.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule, SignalementAnomalieComponent, ActifFormComponent],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  get popupPositionStyle(): any {
    if (!this.selectedFeature || !this.map) return { display: 'none' };
    const geometry = this.selectedFeature.getGeometry();
    if (!geometry) return { display: 'none' };
    let coordinate: [number, number];
    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      coordinate = [coords[0], coords[1]];
    } else {
      const extent = geometry.getExtent();
      coordinate = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
    }
    const pixel = this.map.getPixelFromCoordinate(coordinate);
    if (!pixel) return { display: 'none' };
    return {
      position: 'absolute',
      left: pixel[0] + 'px',
      top: pixel[1] + 'px',
      zIndex: 1000
    };
  }
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map!: Map;
  private zoneSource!: VectorSource;
  private actifSource!: VectorSource;
  private anomalieSource!: VectorSource;
  private clusterSource!: Cluster;
  private clusterLayer!: ol_layer_AnimatedCluster;
  private zoneLayer!: VectorLayer<VectorSource>;
  private anomalieLayer!: VectorLayer<VectorSource>;
  private drawInteraction!: Draw;
  private modifyInteraction!: Modify;
  private selectInteraction!: Select;

  isDrawing = false;
  drawType: 'Point' | 'Polygon' | 'LineString' = 'Point';
  selectedFeature: Feature<Geometry> | null = null;

  newGeometry = {
    name: '',
    color: '#ff0000',
    opacity: 0.5,
  };

  zones: any[] = [];
  actifs: ActifPourCarte[] = [];
  anomalies: AnomaliePourCarte[] = [];
  loading = false;
  error: string | null = null;

  sidebarCollapsed = false;
  isFullscreen = false;
  mouseCoordinates = '';

  showActifs = true;
  showAnomalies = true;
  showSignalementForm = false;
  showActifForm = false;
  clickCoordinates: [number, number] | null = null;
  currentDrawnGeometry: any = null;
  currentDrawnFeature: Feature<Geometry> | null = null;
  selectedAssetForAnomalie: Feature<Geometry> | null = null;

  constructor(
    private zoneService: ZoneService,
    private userService: UserService,
    private carteIntegrationService: CarteIntegrationService,
    private actifService: ActifService,
    private dataRefreshService: DataRefreshService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.initializeMap();
    this.loadMapData();
    this.loadActifsData();
    this.loadAnomaliesData();
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'signalAnomalie') {
        console.log('Navigate to anomaly reporting mode');
      }
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.setTarget(undefined);
    }
  }

  private initializeMap() {
    // Create sources first
    this.actifSource = new VectorSource();
    this.anomalieSource = new VectorSource();
    this.zoneSource = new VectorSource();
    
    // Create cluster source for POINTS ONLY
    this.clusterSource = new Cluster({
      distance: 40, // Adjust this value to control clustering distance
      minDistance: 20, // Minimum distance between clusters
      source: this.actifSource, // Only cluster point actifs
    });

    // Create layers
    this.clusterLayer = new ol_layer_AnimatedCluster({
      source: this.clusterSource,
      style: (feature: FeatureLike) => this.getClusterStyle(feature)
    });

    this.zoneLayer = new VectorLayer({
      source: this.zoneSource,
      style: (feature: FeatureLike) => this.getZoneStyle(feature)
    });

    this.anomalieLayer = new VectorLayer({
      source: this.anomalieSource,
      style: (feature: FeatureLike) => this.getAnomalieStyle(feature)
    });

    this.map = new Map({
      target: this.mapContainer.nativeElement,
      layers: [
        new TileLayer({ source: new XYZ({url: 'http://mt3.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}'}) }),
        this.zoneLayer,
        this.clusterLayer, // Only one layer for point actifs
        this.anomalieLayer,
      ],
      view: new View({
        center: fromLonLat([-5.5026, 35.8845]),
        zoom: 12
      })
    });

    // Fix select interaction - only target cluster, zone, and anomalie layers
    this.selectInteraction = new Select({
      condition: click,
      layers: [this.clusterLayer, this.zoneLayer, this.anomalieLayer], // Remove duplicate actifLayer
      style: (feature: FeatureLike) => this.getSelectedStyle(feature)
    });

    this.modifyInteraction = new Modify({
      features: this.selectInteraction.getFeatures()
    });

    this.map.addInteraction(this.selectInteraction);
    this.map.addInteraction(this.modifyInteraction);

    // Setup event handlers
    this.setupEventHandlers();

    // Make cluster distance zoom-dependent for better clustering
    this.map.getView().on('change:resolution', () => {
      const zoom = this.map.getView().getZoom() || 10;
      const distance = Math.max(20, 60 - zoom * 2); // Smaller distance at higher zoom
      this.clusterSource.setDistance(distance);
    });

    this.map.on('pointermove', (evt) => {
      const coordinate = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
      this.mouseCoordinates = `${coordinate[1].toFixed(4)}°N, ${coordinate[0].toFixed(4)}°E`;
    });
  }

  private setupEventHandlers() {
    this.selectInteraction.on('select', (e: SelectEvent) => {
      this.selectedFeature = null;
      this.resetForm();

      if (e.selected.length > 0) {
        const feature = e.selected[0];
        const clusteredFeatures = feature.get('features');

        if (Array.isArray(clusteredFeatures) && clusteredFeatures.length > 1) {
          // Multiple features in cluster - zoom in to expand
          const geometry = feature.getGeometry();
          if (geometry instanceof Point) {
            const currentZoom = this.map.getView().getZoom();
            const targetZoom = currentZoom !== undefined ? Math.min(currentZoom + 2, 20) : 14;
            this.map.getView().animate({
              center: geometry.getCoordinates(),
              zoom: targetZoom,
              duration: 400
            });
          }
          // Clear selection to allow re-selection after zoom
          this.selectInteraction.getFeatures().clear();
        } else {
          // Single feature - select it
          const actualFeature = clusteredFeatures ? clusteredFeatures[0] : feature;
          this.selectedFeature = actualFeature as Feature<Geometry>;
          this.onFeatureSelected(this.selectedFeature);
        }
      }
    });

    this.modifyInteraction.on('modifyend', (e) => {
      if (this.selectedFeature) {
        this.updateGeometry(this.selectedFeature);
      }
    });
  }

  private loadMapData() {
    this.loading = true;
    this.error = null;

    this.zoneService.getZones().subscribe({
      next: (zones) => {
        this.zones = zones;
        this.addZonesToMap(zones);
        this.loading = false;
      },
      error: (err) => { this.error = 'Failed to load zones'; console.error(err); this.loading = false; }
    });
  }

  private addZonesToMap(zones: any[]) {
    const geoJsonFormat = new GeoJSON();
    zones.forEach(zone => {
      try {
        if (zone.geometry) {
          const features = geoJsonFormat.readFeatures(JSON.parse(zone.geometry), {
            featureProjection: 'EPSG:3857'
          });
          features.forEach(feature => {
            feature.setProperties({
              id: zone.id,
              type: 'zone',
              data: zone
            });
            this.zoneSource.addFeature(feature);
          });
        }
      } catch (error) {
        console.error('Error parsing zone geometry:', error);
      }
    });
  }

  // Improved cluster style with better zoom-based behavior
  private getClusterStyle(feature: FeatureLike): Style | Style[] {
    if (!feature) {
      return new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: '#cccccc' }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        })
      });
    }

    const clusteredFeatures = feature.get('features');
    if (!Array.isArray(clusteredFeatures)) {
      // Not a cluster - style as single feature
      const data = feature.get('data');
      return new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: data?.statusColor || '#007bff' }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        }),
        text: new Text({
          text: data?.nom || '',
          font: '12px Arial',
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
          offsetY: -20
        })
      });
    }

    const size = clusteredFeatures.length;
    
    if (size > 1) {
      // Cluster style - scale with number of features
      const radius = Math.min(12 + Math.sqrt(size) * 2, 30);
      return new Style({
        image: new CircleStyle({
          radius: radius,
          fill: new Fill({ color: '#ff9800' }), // Orange for clusters
          stroke: new Stroke({ color: '#fff', width: 3 })
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({ color: '#fff' }),
          font: 'bold 12px sans-serif'
        }),
      });
    } else {
      // Single feature in cluster
      const actualFeature = clusteredFeatures[0];
      const data = actualFeature?.get('data');
      return new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: data?.statusColor || '#007bff' }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        }),
        text: new Text({
          text: data?.nom || '',
          font: '12px Arial',
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
          offsetY: -20
        })
      });
    }
  }

  private getZoneStyle(feature: FeatureLike): Style {
    const data = feature.get('data');
    const color = data?.color || '#ff0000';
    const opacity = data?.opacity || 0.5;
    const rgb = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
    return new Style({
      fill: new Fill({ color: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})` }),
      stroke: new Stroke({ color: color, width: 2 })
    });
  }

  private getAnomalieStyle(feature: FeatureLike): Style {
    const data = feature.get('data');
    return new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: data?.priorityColor || '#ffc107' }),
        stroke: new Stroke({ color: '#fff', width: 2 })
      }),
      text: new Text({
        text: '⚠️',
        font: '14px Arial',
        fill: new Fill({ color: '#000' }),
        offsetY: -15
      })
    });
  }

  private getSelectedStyle(feature: FeatureLike): Style {
    return new Style({
      fill: new Fill({ color: 'rgba(255, 255, 0, 0.4)' }),
      stroke: new Stroke({ color: '#ffff00', width: 4 }),
      image: new CircleStyle({
        radius: 10,
        fill: new Fill({ color: 'rgba(255, 255, 0, 0.4)' }),
        stroke: new Stroke({ color: '#ffff00', width: 4 })
      })
    });
  }

  startDrawing() {
    this.isDrawing = true;
    this.removeDrawInteraction();

    // Create a temporary source for drawing
    const tempSource = new VectorSource();

    this.drawInteraction = new Draw({
      source: tempSource, // Use temporary source instead of actifSource
      type: this.drawType
    });

    this.drawInteraction.on('drawend', (e) => {
      // Remove from temp source since we'll handle it manually
      tempSource.removeFeature(e.feature as Feature<Geometry>);
      this.onDrawEnd(e.feature as Feature<Geometry>);
    });

    this.map.addInteraction(this.drawInteraction);
  }

  stopDrawing() {
    this.isDrawing = false;
    this.removeDrawInteraction();
    this.map.getViewport().style.cursor = 'default';
  }

  private removeDrawInteraction() {
    if (this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
    }
  }

  private onDrawEnd(feature: Feature<Geometry>) {
    this.selectedFeature = feature;

    // Add to appropriate source based on geometry type
    const geometry = feature.getGeometry();
    if (geometry instanceof Point) {
      // Points go to actif source (for clustering)
      this.actifSource.addFeature(feature);
    } else {
      // Polygons and LineStrings go to zone source (not clustered)
      this.zoneSource.addFeature(feature);
    }

    this.showActifFormForGeometry(feature);
  }

  private showActifFormForGeometry(feature: Feature<Geometry>) {
    const geometry = feature.getGeometry();
    if (!geometry) return;

    let coordinates: [number, number];

    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      const lonLat = transform(coords, 'EPSG:3857', 'EPSG:4326');
      coordinates = [lonLat[0], lonLat[1]];
    } else {
      const extent = geometry.getExtent();
      const centerCoords = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
      const lonLat = transform(centerCoords, 'EPSG:3857', 'EPSG:4326');
      coordinates = [lonLat[0], lonLat[1]];
    }

    this.clickCoordinates = coordinates;
    this.currentDrawnFeature = feature;
    this.showActifForm = true;
    this.stopDrawing();
  }

  private updateGeometry(feature: Feature<Geometry>) {
    const data = feature.get('data');
    const geometry = feature.getGeometry();
    if (!geometry || !data) return;

    if (feature.get('type') === 'actif') {
      const coords = (geometry as Point).getCoordinates();
      const lonLat = transform(coords, 'EPSG:3857', 'EPSG:4326');
      const updatedActif = { ...data, longitude: lonLat[0], latitude: lonLat[1] };
      this.actifService.updateActif(data.id, updatedActif).subscribe({
        next: (actif) => feature.set('data', actif),
        error: (err) => console.error('Error updating actif:', err)
      });
    }
  }

  private onFeatureSelected(feature: Feature<Geometry> | null) {
    if (!feature) return;
    const data = feature.get('data');
    if (data) {
      this.newGeometry = {
        name: data.name || '',
        color: data.color || '#ff0000',
        opacity: data.opacity || 0.5
      };
    }
  }

  deleteSelectedFeature() {
    if (!this.selectedFeature) return;

    const data = this.selectedFeature.get('data');
    const type = this.selectedFeature.get('type');
    
    let source: VectorSource;
    if (type === 'actif') {
      const geometry = this.selectedFeature.getGeometry();
      source = geometry instanceof Point ? this.actifSource : this.zoneSource;
    } else if (type === 'anomalie') {
      source = this.anomalieSource;
    } else {
      source = this.zoneSource;
    }

    const featureToRemove = this.selectedFeature;
    this.selectedFeature = null;

    if (type === 'actif') {
      this.actifService.deleteActif(data.id).subscribe({
        next: () => {
          source.removeFeature(featureToRemove);
          this.actifs = this.actifs.filter(a => a.id !== data.id);
        },
        error: (err) => console.error('Error deleting actif:', err)
      });
    } else {
      this.zoneService.deleteZone(data.id).subscribe({
        next: () => {
          source.removeFeature(featureToRemove);
          this.zones = this.zones.filter(z => z.id !== data.id);
        },
        error: (err) => console.error('Error deleting zone:', err)
      });
    }
  }

  private resetForm() {
    this.newGeometry = { name: '', color: '#ff0000', opacity: 0.5 };
  }

  refreshData() {
    this.actifSource.clear();
    this.zoneSource.clear();
    this.anomalieSource.clear();
    this.loadMapData();
    this.loadActifsData();
    this.loadAnomaliesData();
  }

  getDrawingStatusText(): string {
    if (this.drawType === 'Point') {
      return 'Cliquez sur la carte pour placer un actif point';
    } else if (this.drawType === 'Polygon') {
      return 'Dessinez une zone pour créer un actif zone';
    } else {
      return 'Dessinez une route pour créer un actif route';
    }
  }

  getFeatureTypeDisplay(): string {
    if (!this.selectedFeature) return '';
    const type = this.selectedFeature.get('type');
    switch (type) {
      case 'actif': return 'Actif';
      case 'anomalie': return 'Anomalie';
      case 'zone': return 'Zone';
      default: return type || 'Inconnu';
    }
  }

  getFeatureName(): string {
    if (!this.selectedFeature) return '';
    const data = this.selectedFeature.get('data');
    return (
      data?.nom ||
      data?.name ||
      (data && (data as any).libelle) ||
      (data && (data as any).label) ||
      (data && (data as any).designation) ||
      ''
    );
  }

  isExistingAsset(): boolean {
    if (!this.selectedFeature) return false;
    const type = this.selectedFeature.get('type');
    return type === 'actif' || type === 'zone';
  }

  signalAnomalieForSelectedFeature(): void {
    if (!this.selectedFeature) return;

    const geometry = this.selectedFeature.getGeometry();
    if (!geometry) return;

    let coordinates: [number, number];

    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      const lonLat = transform(coords, 'EPSG:3857', 'EPSG:4326');
      coordinates = [lonLat[0], lonLat[1]];
    } else {
      const extent = geometry.getExtent();
      const centerCoords = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
      const lonLat = transform(centerCoords, 'EPSG:3857', 'EPSG:4326');
      coordinates = [lonLat[0], lonLat[1]];
    }

    this.clickCoordinates = coordinates;
    this.selectedAssetForAnomalie = this.selectedFeature;
    this.showSignalementForm = true;
  }

  getSelectedAssetData(): any {
    if (!this.selectedAssetForAnomalie) {
      return null;
    }
    const properties: Record<string, any> = this.selectedAssetForAnomalie.getProperties();
    const { geometry, Geometry, ...rest } = properties;
    const id = rest['id'] ?? rest['actifId'] ?? rest['objectId'];
    const code = rest['code'] ?? (id !== undefined ? String(id) : undefined);
    const nom = rest['nom'] ?? rest['name'] ?? 'Actif sélectionné';
    const type = rest['type'] ?? rest['famille_type'] ?? rest['categorie'] ?? rest['assetType'];
    return {
      id,
      code: code || '',
      nom,
      type: type || 'inconnu',
      ...rest
    };
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  resetView() {
    if (this.map) {
      this.map.getView().setCenter(fromLonLat([2.3522, 48.8566]));
      this.map.getView().setZoom(10);
    }
  }

  zoomIn() {
    if (this.map) {
      const view = this.map.getView();
      const zoom = view.getZoom();
      if (zoom !== undefined) {
        view.setZoom(zoom + 1);
      }
    }
  }

  zoomOut() {
    if (this.map) {
      const view = this.map.getView();
      const zoom = view.getZoom();
      if (zoom !== undefined) {
        view.setZoom(zoom - 1);
      }
    }
  }

  toggleLayer(layerType: string) {
    console.log('Toggle layer:', layerType);
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    if (this.isFullscreen) {
      this.mapContainer.nativeElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  exportData() {
    const features = [
      ...this.actifSource.getFeatures(),
      ...this.zoneSource.getFeatures(),
      ...this.anomalieSource.getFeatures()
    ];
    const geojson = new GeoJSON().writeFeatures(features, {
      featureProjection: 'EPSG:3857',
      dataProjection: 'EPSG:4326'
    });
    const blob = new Blob([geojson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map-data.geojson';
    a.click();
    URL.revokeObjectURL(url);
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.geojson';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const geojson = JSON.parse(e.target.result);
            const features = new GeoJSON().readFeatures(geojson, {
              featureProjection: 'EPSG:3857',
              dataProjection: 'EPSG:4326'
            });
            features.forEach(feature => {
              const geom = feature.getGeometry();
              if (geom instanceof Point) {
                this.actifSource.addFeature(feature);
              } else {
                this.zoneSource.addFeature(feature);
              }
            });
            console.log('Data imported successfully');
          } catch (error) {
            console.error('Error importing data:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  private loadActifsData() {
    this.carteIntegrationService.getActifsForMap().subscribe({
      next: (actifs) => {
        console.log(`Chargement de ${actifs.length} actifs sur la carte:`, actifs);
        this.actifs = actifs;
        this.addActifsToMap(actifs);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des actifs:', err);
      }
    });
  }

  private loadAnomaliesData() {
    this.carteIntegrationService.getAnomaliesForMap().subscribe({
      next: (anomalies) => {
        this.anomalies = anomalies;
        this.addAnomaliesToMap(anomalies);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des anomalies:', err);
      }
    });
  }

  // Fixed addActifsToMap method to prevent duplication
  private addActifsToMap(actifs: ActifPourCarte[]) {
    // Clear ONLY the actifSource (for points) - don't clear zoneSource to preserve user zones
    this.actifSource.clear();
    
    actifs.forEach(actif => {
      if (actif.latitude != null && actif.longitude != null) {
        // POINTS: Add to actifSource (will be automatically clustered)
        const feature = new Feature({
          geometry: new Point(fromLonLat([actif.longitude, actif.latitude])),
        });
        
        // Set properties properly
        feature.setProperties({
          id: actif.id,
          type: 'actif',
          data: actif
        });
        
        this.actifSource.addFeature(feature);
        
      } else if (actif.geometry) {
        // POLYGONS/LINESTRINGS: Add to zoneSource (not clustered)
        try {
          const geoJsonFormat = new GeoJSON();
          const geojson = typeof actif.geometry === 'string' ? JSON.parse(actif.geometry) : actif.geometry;
          const features = geoJsonFormat.readFeatures({
            type: 'Feature',
            geometry: geojson,
            properties: {}
          }, {
            featureProjection: 'EPSG:3857'
          });
          
          features.forEach(zoneFeature => {
            zoneFeature.setId(actif.id);
            zoneFeature.setProperties({
              id: actif.id,
              type: 'actif',
              data: actif
            });
            this.zoneSource.addFeature(zoneFeature);
          });
        } catch (e) {
          console.error('Erreur lors du parsing de la géométrie GeoJSON de l\'actif:', e, actif);
        }
      }
    });
  }

  private addAnomaliesToMap(anomalies: AnomaliePourCarte[]) {
    this.anomalieSource.clear();
    anomalies.forEach(anomalie => {
      if (anomalie.latitude && anomalie.longitude) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([anomalie.longitude, anomalie.latitude])),
        });
        
        feature.setProperties({
          id: anomalie.id,
          type: 'anomalie',
          data: anomalie
        });
        
        this.anomalieSource.addFeature(feature);
      }
    });
  }

  // Fixed toggle methods to work with corrected layer structure
  toggleActifsLayer() {
    this.showActifs = !this.showActifs;
    if (this.clusterLayer) {
      this.clusterLayer.setVisible(this.showActifs);
    }
  }

  toggleAnomaliesLayer() {
    this.showAnomalies = !this.showAnomalies;
    if (this.anomalieLayer) {
      this.anomalieLayer.setVisible(this.showAnomalies);
    }
  }

  onAnomalieSignaled() {
    console.log('Anomalie signalée depuis la carte!');
    this.dataRefreshService.notifyAnomalieAdded();
    this.loadAnomaliesData();
    this.showSignalementForm = false;
    this.clickCoordinates = null;
    this.selectedAssetForAnomalie = null;
    alert('Anomalie signalée avec succès! Les KPI seront mis à jour automatiquement.');
  }

  onSignalementCancelled() {
    this.showSignalementForm = false;
    this.clickCoordinates = null;
    this.selectedAssetForAnomalie = null;
    this.map.getViewport().style.cursor = 'default';
  }

  onActifFormCancel() {
    this.showActifForm = false;
    this.clickCoordinates = null;
    this.currentDrawnGeometry = null;
    if (this.currentDrawnFeature) {
      const geometry = this.currentDrawnFeature.getGeometry();

      // Remove from the correct source
      if (geometry instanceof Point) {
        this.actifSource.removeFeature(this.currentDrawnFeature);
      } else {
        this.zoneSource.removeFeature(this.currentDrawnFeature);
      }

      this.currentDrawnFeature = null;
    }
    this.map.getViewport().style.cursor = 'default';
  }

  onActifCreated(actifData: any) {
    console.log('Actif créé avec succès:', actifData);
    if (this.currentDrawnFeature) {
      this.currentDrawnFeature.setProperties({
        id: actifData.id,
        type: 'actif',
        data: actifData
      });

      // Make sure the feature stays in the correct source
      const geometry = this.currentDrawnFeature.getGeometry();
      if (geometry instanceof Point) {
        if (!this.actifSource.getFeatures().includes(this.currentDrawnFeature)) {
          this.actifSource.addFeature(this.currentDrawnFeature);
        }
      } else {
        if (!this.zoneSource.getFeatures().includes(this.currentDrawnFeature)) {
          this.zoneSource.addFeature(this.currentDrawnFeature);
        }
      }

      this.currentDrawnFeature = null;
    }
    this.loadActifsData();
    this.showActifForm = false;
    this.clickCoordinates = null;
    this.currentDrawnGeometry = null;
    this.map.getViewport().style.cursor = 'default';
  }

  addLocalActifFeature(actifData: any) {
    const feature = new Feature({
      geometry: new Point(fromLonLat([actifData.longitude, actifData.latitude])),
    });
    
    feature.setProperties({
      id: actifData.id || Date.now(), // Generate ID if not provided
      type: 'actif',
      data: {
        nom: actifData.nom,
        code: actifData.code,
        type: actifData.type,
        statutOperationnel: actifData.statutOperationnel,
        etatGeneral: actifData.etatGeneral,
        statusColor: '#007bff'
      }
    });
    
    this.actifSource.addFeature(feature);
    this.showActifForm = false;
    this.clickCoordinates = null;
    this.map.getViewport().style.cursor = 'default';
    alert('Actif créé localement (mode démo) !');
  }

  // Additional debugging method
  debugClusterState() {
    console.log('=== Cluster Debug Info ===');
    console.log('ActifSource features:', this.actifSource.getFeatures().length);
    console.log('ZoneSource features:', this.zoneSource.getFeatures().length);
    console.log('AnomalieSource features:', this.anomalieSource.getFeatures().length);
    console.log('ClusterLayer visible:', this.clusterLayer.getVisible());
    console.log('Current zoom:', this.map.getView().getZoom());
    console.log('Cluster distance:', this.clusterSource.getDistance());
    
    // Check for duplicate features
    const actifIds = this.actifSource.getFeatures().map(f => f.get('id'));
    const duplicates = actifIds.filter((id, index) => actifIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      console.warn('Duplicate actif IDs found:', duplicates);
    }

    // Check cluster source
    const clusterFeatures = this.clusterSource.getFeatures();
    console.log('Cluster source features:', clusterFeatures.length);
    clusterFeatures.forEach((feature, index) => {
      const clusteredFeatures = feature.get('features');
      if (clusteredFeatures && clusteredFeatures.length > 0) {
        console.log(`Cluster ${index}: ${clusteredFeatures.length} features`);
      }
    });
  }

  // Method to manually refresh cluster
  refreshCluster() {
    this.clusterSource.refresh();
    console.log('Cluster refreshed');
  }

  // Method to adjust cluster distance dynamically
  setClusterDistance(distance: number) {
    if (this.clusterSource) {
      this.clusterSource.setDistance(distance);
      console.log(`Cluster distance set to: ${distance}`);
    }
  }

  // Method to get current cluster settings
  getClusterInfo() {
    return {
      distance: this.clusterSource?.getDistance(),
      minDistance: this.clusterSource?.getMinDistance?.(), // May not be available in all versions
      featureCount: this.actifSource?.getFeatures().length,
      clusterCount: this.clusterSource?.getFeatures().length
    };
  }
}