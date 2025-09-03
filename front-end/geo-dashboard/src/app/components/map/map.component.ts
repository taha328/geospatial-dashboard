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

// Add this import at the top of your map.component.ts file
import ol_control_LayerSwitcher from './ol_control_LayerSwitcher'; // Adjust path as needed
import ol_control_Legend from './ol_control_Legend';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule, SignalementAnomalieComponent, ActifFormComponent],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  // LayerSwitcher control property
  private layerSwitcher!: ol_control_LayerSwitcher;
  // Legend control (project control)
  private legendControl?: any;
  
  // Popup position tracking
  private popupCoordinate: [number, number] | null = null;
  
  get popupPositionStyle(): any {
    if (!this.selectedFeature || !this.map || !this.popupCoordinate) return { display: 'none' };
    
    const pixel = this.map.getPixelFromCoordinate(this.popupCoordinate);
    if (!pixel) return { display: 'none' };

    // Get map container dimensions
    const mapElement = this.mapContainer.nativeElement;
    const mapRect = mapElement.getBoundingClientRect();
    const popupWidth = 320; // max-width from CSS
    const popupHeight = 300; // estimated height

    // Calculate optimal position to keep popup within viewport
    let left = pixel[0];
    let top = pixel[1] - popupHeight - 20; // Position above the marker with some margin

    // Adjust horizontal position if popup would overflow
    if (left + popupWidth > mapRect.width) {
      left = mapRect.width - popupWidth - 10;
    }
    if (left < 10) {
      left = 10;
    }

    // Adjust vertical position if popup would overflow
    if (top < 10) {
      top = pixel[1] + 30; // Position below the marker if not enough space above
    }

    return {
      position: 'absolute',
      left: left + 'px',
      top: top + 'px',
      zIndex: 1000,
      transform: 'translate(0, 0)' // Remove any transform that might cause issues
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

      /**
       * Returns the OpenLayers map canvas element (if present).
       */
      getMapCanvasElement(): HTMLCanvasElement | null {
        if (!this.map) return null;
        // OL map viewport contains the canvas
        const viewport = this.map.getViewport();
        return viewport.querySelector('canvas');
      }

      /**
       * Gets the 2D context with willReadFrequently option, with fallback.
       */
      getMapCanvasContext2D(): CanvasRenderingContext2D | null {
        const canvas = this.getMapCanvasElement();
        if (!canvas) return null;
        // TypeScript-safe: cast options as any if needed
        return (
          canvas.getContext('2d', { willReadFrequently: true } as any) as CanvasRenderingContext2D
        ) || canvas.getContext('2d');
      }

      /**
       * Example usage: read pixel data after map render
       */
      readMapPixelDataExample() {
        const ctx = this.getMapCanvasContext2D();
        if (!ctx) {
          console.warn('Map canvas context not available');
          return;
        }
        // Example: get pixel at (x, y)
        const imageData = ctx.getImageData(0, 0, 1, 1);
        console.log('Pixel RGBA:', imageData.data);
      }
  ngOnInit() {
    this.initializeMap();
    
    // Add keyboard event listener for closing popup
    document.addEventListener('keydown', this.handleKeydown);
    
    // Subscribe to data change notifications so the map can refresh automatically
    this.dataRefreshService.dataChanged$.subscribe(() => {
      console.log('DataRefreshService: data changed - refreshing map data (forced)');
      // Force refresh to clear caches and fetch latest data from the server
      this.refreshData(true);
    });
    // Subscribe to single-actif creation events to add the new feature immediately
// Replace your actifCreated subscription in ngOnInit with this fixed version:

this.dataRefreshService.actifCreated$.subscribe((actif: any) => {
  try {
    console.log('DataRefreshService: new actif created, adding to map', actif);
    
    if (actif.geometry) {
      const geoJsonFormat = new GeoJSON();
      let geojson = typeof actif.geometry === 'string' ? JSON.parse(actif.geometry) : actif.geometry;
      
      // Remove any crs properties to avoid parser issues
      geojson = this.stripCrsDeep(geojson);

      console.log('Processing actifCreated geometry:', {
        actifId: actif.id,
        geometryType: geojson?.type,
        coordinates: geojson?.coordinates,
        coordinateCount: geojson?.coordinates?.[0]?.length || 'unknown'
      });

      let features: Feature<Geometry>[];
      
      try {
        // CRITICAL FIX: The backend returns geometry in EPSG:4326, transform to EPSG:3857
        features = geoJsonFormat.readFeatures(
          { type: 'Feature', geometry: geojson, properties: {} }, 
          { 
            dataProjection: 'EPSG:4326',    // Backend always returns EPSG:4326
            featureProjection: 'EPSG:3857'  // OpenLayers uses EPSG:3857
          }
        );
        
        if (!features || features.length === 0) {
          throw new Error('No features created from geometry');
        }

        // Validate the parsed feature
        const feature = features[0];
        const geometry = feature.getGeometry();
        
        if (!geometry) {
          throw new Error('Feature has no geometry after parsing');
        }

        const extent = geometry.getExtent();
        
        // Check for invalid extent
        if (!extent || extent.some(val => !isFinite(val) || isNaN(val))) {
          console.error('Invalid extent after parsing:', extent);
          
          // FALLBACK: Use currentDrawnGeometry if available
          if (this.currentDrawnGeometry) {
            console.log('Using currentDrawnGeometry as fallback');
            try {
              const fallbackFeatures = geoJsonFormat.readFeatures(
                { type: 'Feature', geometry: this.currentDrawnGeometry, properties: {} },
                { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }
              );
              
              if (fallbackFeatures && fallbackFeatures[0]) {
                const fallbackGeom = fallbackFeatures[0].getGeometry();
                const fallbackExtent = fallbackGeom?.getExtent();
                
                if (fallbackExtent && fallbackExtent.every(val => isFinite(val) && !isNaN(val))) {
                  features = fallbackFeatures as Feature<Geometry>[];
                  console.log('Successfully used fallback geometry');
                } else {
                  throw new Error('Fallback geometry also has invalid extent');
                }
              }
            } catch (fallbackError) {
              console.error('Fallback geometry parsing failed:', fallbackError);
              // Use lat/lng as last resort
              if (actif.latitude != null && actif.longitude != null) {
                const pointFeature = new Feature({
                  geometry: new Point(fromLonLat([actif.longitude, actif.latitude]))
                });
                features = [pointFeature];
                console.log('Used lat/lng point as final fallback');
              } else {
                throw new Error('No valid fallback available');
              }
            }
          } else if (actif.latitude != null && actif.longitude != null) {
            // Use lat/lng as fallback
            const pointFeature = new Feature({
              geometry: new Point(fromLonLat([actif.longitude, actif.latitude]))
            });
            features = [pointFeature];
            console.log('Used lat/lng point as fallback');
          } else {
            throw new Error('Cannot create valid feature - no fallback available');
          }
        } else {
          console.log('Valid extent after parsing:', extent);
        }

      } catch (parseError) {
        console.error('Geometry parsing failed:', parseError);
        
        // Try using currentDrawnGeometry first
        if (this.currentDrawnGeometry) {
          try {
            features = geoJsonFormat.readFeatures(
              { type: 'Feature', geometry: this.currentDrawnGeometry, properties: {} },
              { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }
            );
            console.log('Used currentDrawnGeometry after parse failure');
          } catch (drawGeomError) {
            console.error('currentDrawnGeometry also failed:', drawGeomError);
            // Final fallback to point
            if (actif.latitude != null && actif.longitude != null) {
              features = [new Feature({
                geometry: new Point(fromLonLat([actif.longitude, actif.latitude]))
              })];
              console.log('Used point fallback after all geometry parsing failed');
            } else {
              throw new Error('All geometry parsing attempts failed');
            }
          }
        } else if (actif.latitude != null && actif.longitude != null) {
          // Direct fallback to point
          features = [new Feature({
            geometry: new Point(fromLonLat([actif.longitude, actif.latitude]))
          })];
          console.log('Used point fallback - no drawn geometry available');
        } else {
          throw new Error('Cannot create feature - no valid geometry or coordinates');
        }
      }

      // Add the validated features to the map
      const added: Feature<Geometry>[] = [];
      
      features.forEach(f => {
        f.setId(actif.id);
        f.setProperties({ id: actif.id, type: 'actif', data: actif });
        
        const geom = f.getGeometry();
        const type = geom?.getType?.() || '';
        
        if (type.toLowerCase().includes('polygon') || type.toLowerCase().includes('linestring')) {
          this.zoneSource.addFeature(f);
          added.push(f);
          console.log(`Added ${type} feature to zoneSource`);
          
          // Auto-zoom to polygon for immediate feedback
          if (type.toLowerCase().includes('polygon')) {
            setTimeout(() => {
              const extent = geom!.getExtent();
              if (extent && extent.every(val => isFinite(val) && !isNaN(val))) {
                this.map.getView().fit(extent, { 
                  padding: [50, 50, 50, 50], 
                  maxZoom: 16,
                  duration: 1000 
                });
                console.log('Auto-zoomed to new polygon');
              }
            }, 100);
          }
        } else {
          this.actifSource.addFeature(f);
          added.push(f);
          console.log(`Added ${type || 'Point'} feature to actifSource`);
        }
      });

      // Ensure zone layer is visible and force refresh
      if (this.zoneLayer && !this.zoneLayer.getVisible()) {
        this.zoneLayer.setVisible(true);
      }

      // Force refresh sources
      this.zoneSource.changed();
      this.actifSource.changed();
      
      console.log(`Successfully added ${added.length} features for actif ${actif.id}`);

    } else if (actif.latitude != null && actif.longitude != null) {
      // Handle non-geometry actifs
      const feature = new Feature({ geometry: new Point(fromLonLat([actif.longitude, actif.latitude])) });
      feature.setId(actif.id);
      feature.setProperties({ id: actif.id, type: 'actif', data: actif });
      this.actifSource.addFeature(feature);
      console.log('Added point actif from lat/lng');
      
    } else if (this.currentDrawnFeature) {
      // Use the drawn feature if available
      this.currentDrawnFeature.setId(actif.id);
      this.currentDrawnFeature.setProperties({ id: actif.id, type: 'actif', data: actif });
      
      const geom = this.currentDrawnFeature.getGeometry();
      if (geom && geom.getType && geom.getType().toLowerCase().includes('polygon')) {
        this.zoneSource.addFeature(this.currentDrawnFeature);
      } else {
        this.actifSource.addFeature(this.currentDrawnFeature);
      }
      
      this.currentDrawnFeature = null;
      console.log('Used currentDrawnFeature as fallback');
    }
    
    // Clear the drawn geometry reference
    this.currentDrawnGeometry = null;
    
  } catch (e) {
    console.error('Failed to add created actif to map:', e, actif);
  }
});
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
    // Remove keyboard event listener
    document.removeEventListener('keydown', this.handleKeydown);
    
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
        this.clusterLayer,
        this.zoneLayer,
        this.anomalieLayer,
      ],
      view: new View({
        center: fromLonLat([-5.5026, 35.8845]),
        zoom: 12
      })
    });

    // Ensure deterministic z-order: clusters below zones, anomalies on top
    try {
      if (this.clusterLayer && this.clusterLayer.setZIndex) this.clusterLayer.setZIndex(100);
      if (this.zoneLayer && this.zoneLayer.setZIndex) this.zoneLayer.setZIndex(200);
      if (this.anomalieLayer && this.anomalieLayer.setZIndex) this.anomalieLayer.setZIndex(300);
    } catch (e) {
      // ignore if setZIndex isn't available
    }

    // Create and add the LayerSwitcher control
    this.layerSwitcher = new ol_control_LayerSwitcher({
      collapsed: false,
      reordering: true,
      trash: true,
      extent: true,
      selection: false,
      counter: true,
      show_progress: true,
      mouseover: false,
      displayInLayerSwitcher: (layer: any) => {
        return layer.get('displayInLayerSwitcher') !== false;
      }
    });

    // Add the control to the map
    this.map.addControl(this.layerSwitcher);

    // Set layer properties for better display in layer switcher
    this.setupLayerProperties();

    // Optional: Add event listeners for layer switcher events
    this.setupLayerSwitcherEvents();
    
    // Fix select interaction - only target cluster, zone, and anomalie layers
    this.selectInteraction = new Select({
      condition: click,
      layers: [this.clusterLayer, this.zoneLayer, this.anomalieLayer],
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
      const distance = Math.max(20, 60 - zoom * 2);
      this.clusterSource.setDistance(distance);
    });

    this.map.on('pointermove', (evt) => {
      const coordinate = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
      this.mouseCoordinates = `${coordinate[1].toFixed(4)}°N, ${coordinate[0].toFixed(4)}°E`;
    });

  // Initialize project legend control
  this.initializeLegendControl();

    // DEV: expose quick debug handles for console inspection
    try {
      (window as any).__mapDebug = {
        map: this.map,
        zoneSource: this.zoneSource,
        actifSource: this.actifSource,
        anomalieSource: this.anomalieSource,
        zoneLayer: this.zoneLayer,
        clusterLayer: this.clusterLayer
      };
      console.debug('[MapComponent] __mapDebug exposed on window for runtime inspection');
    } catch (e) {
      // ignore in non-browser environments
    }
  }

  // Add this new method to set proper layer names and properties
  private setupLayerProperties() {
    // Set properties for base layer
    const baseLayers = this.map.getLayers().getArray();
    if (baseLayers[0]) {
      baseLayers[0].set('title', 'Satellite');
      baseLayers[0].set('baseLayer', true);
      baseLayers[0].set('displayInLayerSwitcher', true);
    }

    // Set properties for your custom layers
    this.zoneLayer.set('title', 'Zones');
    this.zoneLayer.set('displayInLayerSwitcher', true);
    
    this.clusterLayer.set('title', 'Actifs');
    this.clusterLayer.set('displayInLayerSwitcher', true);
    
    this.anomalieLayer.set('title', 'Anomalies');
    this.anomalieLayer.set('displayInLayerSwitcher', true);
  }

  // Recursively strip any `crs` properties from GeoJSON-like objects to avoid parser/runtime issues
  private stripCrsDeep<T = any>(obj: T): T {
    if (obj == null) return obj;
    if (Array.isArray(obj)) {
      return obj.map((v: any) => this.stripCrsDeep(v)) as unknown as T;
    }
    if (typeof obj === 'object') {
      const out: any = {};
      for (const key of Object.keys(obj as any)) {
        if (key === 'crs') continue;
        out[key] = this.stripCrsDeep((obj as any)[key]);
      }
      return out as T;
    }
    return obj;
  }

  // Heuristic to detect whether a GeoJSON geometry is already in WebMercator (EPSG:3857)
  // or in geographic coordinates (EPSG:4326). Scans numeric coordinates and returns
  // the most likely dataProjection to use when reading with ol/format/GeoJSON.
private detectGeoJSONProjection(geojson: any): 'EPSG:4326' | 'EPSG:3857' {
  if (!geojson) return 'EPSG:4326';
  
  let maxAbs = 0;
  let coordinateCount = 0;
  let validCoordPairs = 0;
  
  const scan = (v: any) => {
    if (v == null) return;
    if (Array.isArray(v)) {
      if (v.length >= 2 && typeof v[0] === 'number' && typeof v[1] === 'number') {
        const x = Math.abs(v[0]);
        const y = Math.abs(v[1]);
        maxAbs = Math.max(maxAbs, x, y);
        coordinateCount += 2;
        
        // Check if coordinates are in reasonable lat/lng range
        if (x <= 180 && y <= 90) {
          validCoordPairs++;
        }
      } else {
        v.forEach(scan);
      }
    } else if (typeof v === 'object') {
      Object.values(v).forEach(scan);
    }
  };
  
  scan(geojson.coordinates ?? geojson);
  
  // Enhanced heuristics:
  // 1. If max absolute value > 1e6, definitely meters (EPSG:3857)
  // 2. If all coordinates are within lat/lng bounds and max < 1000, likely EPSG:4326
  // 3. For Morocco specifically, longitude should be around -5 to -10, latitude around 30-36
  if (maxAbs > 1e6) {
    return 'EPSG:3857';
  }
  
  if (maxAbs < 1000 && validCoordPairs > 0) {
    return 'EPSG:4326';
  }
  
  // Default to 4326 for ambiguous cases since backend now stores in 4326
  return 'EPSG:4326';
}


  // Recursively swap coordinate pairs [x,y] -> [y,x] where found in arrays of numbers of length 2
  private swapCoordsDeep<T = any>(obj: T): T {
    if (obj == null) return obj;
    if (Array.isArray(obj)) {
      // If this is an array of two numbers, swap them
      if (obj.length === 2 && typeof obj[0] === 'number' && typeof obj[1] === 'number') {
        return [obj[1], obj[0]] as unknown as T;
      }
      return obj.map((v: any) => this.swapCoordsDeep(v)) as unknown as T;
    }
    if (typeof obj === 'object') {
      const out: any = {};
      for (const key of Object.keys(obj as any)) {
        out[key] = this.swapCoordsDeep((obj as any)[key]);
      }
      return out as T;
    }
    return obj;
  }

  // Return the current map center in EPSG:4326 (lon, lat)
  private getMapCenter4326(): [number, number] | null {
    try {
      const center = this.map.getView().getCenter();
      if (!center) return null;
      return transform(center, 'EPSG:3857', 'EPSG:4326') as [number, number];
    } catch (e) {
      return null;
    }
  }

  // Simple degree-space distance between two lon/lat pairs
  private lonLatDegDistance(a: [number, number], b: [number, number]): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Optional: Add event listeners for layer switcher events
  private setupLayerSwitcherEvents() {
    this.layerSwitcher.on('toggle' as any, (e: any) => {
      console.log('Layer switcher toggled:', e.collapsed);
    });

    this.layerSwitcher.on('layer:visible' as any, (e: any) => {
      console.log('Layer visibility changed:', e.layer.get('title'));
    });

    this.layerSwitcher.on('layer:opacity' as any, (e: any) => {
      console.log('Layer opacity changed:', e.layer.get('title'));
    });

    this.layerSwitcher.on('info' as any, (e: any) => {
      console.log('Layer info requested for:', e.layer.get('title'));
    });

    this.layerSwitcher.on('extent' as any, (e: any) => {
      console.log('Zoom to extent requested for:', e.layer.get('title'));
      const extent = e.layer.getExtent();
      if (extent) {
        this.map.getView().fit(extent);
      }
    });
  }

  private setupEventHandlers() {
    this.selectInteraction.on('select', (e: SelectEvent) => {
      this.selectedFeature = null;
      this.popupCoordinate = null; // Clear popup coordinate
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
          this.setPopupCoordinate(this.selectedFeature);
          this.onFeatureSelected(this.selectedFeature);
        }
      }
    });

    this.modifyInteraction.on('modifyend', (e) => {
      if (this.selectedFeature) {
        this.updateGeometry(this.selectedFeature);
      }
    });

    // Add view change listeners to update popup position
    this.map.getView().on('change:center', () => {
      // Recalculate popup position from the selected feature
      if (this.selectedFeature) {
        this.setPopupCoordinate(this.selectedFeature);
      }
    });

    this.map.getView().on('change:resolution', () => {
      // Recalculate popup position from the selected feature  
      if (this.selectedFeature) {
        this.setPopupCoordinate(this.selectedFeature);
      }
    });
  }

  // Helper method to set popup coordinate from selected feature
  private setPopupCoordinate(feature: Feature<Geometry>) {
    const geometry = feature.getGeometry();
    if (!geometry) {
      this.popupCoordinate = null;
      return;
    }

    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      this.popupCoordinate = [coords[0], coords[1]];
    } else {
      const extent = geometry.getExtent();
      this.popupCoordinate = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
    }
  }

  // Method to close popup
  closePopup() {
    this.selectedFeature = null;
    this.popupCoordinate = null;
    // Clear selection interaction
    this.selectInteraction.getFeatures().clear();
  }

  // Method to handle keyboard events - bound as arrow function for proper this context
  private handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.selectedFeature) {
      this.closePopup();
    }
  };

  private loadMapData() {
  // Zones are represented as actifs with polygon geometries in this setup.
  // We no longer load separate 'zones' from a ZoneService. Ensure UI state is consistent.
  this.error = null;
  this.zones = []; // will be populated from actifs after loadActifsData
  }

  private addZonesToMap(zones: any[]) {
  // Deprecated: zones are represented as actifs with polygon geometries.
  // This function is intentionally left as a no-op to avoid double-loading features.
  return;
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
    // Unified actif styling - handles both points and polygons
    const data = feature.get('data') || {};
    const actifType = data?.type || 'unknown';
    const status = data?.statutOperationnel || 'unknown';

    // Color based on operational status
    const statusColors: { [key: string]: string } = {
      'operationnel': '#28a745',      // Green
      'maintenance': '#ffc107',       // Yellow
      'hors_service': '#dc3545',      // Red
      'inactif': '#6c757d',           // Gray
      'unknown': '#007bff'            // Blue default
    };

    // Use feature-specific color/opacity if provided, otherwise use status color and a default opacity
    const baseColorHex: string = (data?.color && typeof data.color === 'string') ? data.color : (statusColors[status] || statusColors['unknown']);
    const opacity: number = (typeof data?.opacity === 'number') ? data.opacity : 0.25;

    // Convert hex to rgba string
    const hex = baseColorHex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const fillColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;

    return new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: baseColorHex, width: 3 }),
      text: new Text({
        text: data?.nom || data?.code || '',
        font: 'bold 14px Arial, sans-serif',
        fill: new Fill({ color: '#000' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
        overflow: true,
        placement: 'point'
      })
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
  const geometry = feature.getGeometry();
  if (!geometry) return;

  // Convert OpenLayers geometry to GeoJSON IMMEDIATELY
  const geoJsonFormat = new GeoJSON();
  const geoJsonFeature = geoJsonFormat.writeFeatureObject(feature, {
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:4326'
  });
  
  // Store the GeoJSON geometry
  this.currentDrawnGeometry = geoJsonFeature.geometry;
  
  console.log('Stored geometry for form:', this.currentDrawnGeometry);

  this.selectedFeature = feature;

  // Add to appropriate source based on geometry type
  if (geometry instanceof Point) {
    this.actifSource.addFeature(feature);
  } else {
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
      // Clear any previously stored drawn geometry
      this.currentDrawnGeometry = null;
    } else {
      // For complex geometries (Polygon, LineString), calculate proper centroid
      let centerCoords: [number, number];
      
      if (geometry instanceof Polygon) {
        // Calculate actual polygon centroid, not just extent center
        const extent = geometry.getExtent();
        // Use extent center as fallback, but this will be more accurate than before
        centerCoords = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        
        // TODO: For perfect accuracy, implement proper polygon centroid calculation
        // For now, extent center is acceptable since backend will use geometry anyway
      } else {
        // For LineString and other geometries, use extent center
        const extent = geometry.getExtent();
        centerCoords = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
      }
      
      const lonLat = transform(centerCoords, 'EPSG:3857', 'EPSG:4326');
      coordinates = [lonLat[0], lonLat[1]];
      
      // Store the drawn geometry as GeoJSON (in EPSG:4326) so the form will send it
      try {
        const geoJsonFormat = new GeoJSON();
        this.currentDrawnGeometry = geoJsonFormat.writeGeometryObject(geometry, {
          featureProjection: 'EPSG:3857',
          dataProjection: 'EPSG:4326'
        });
        
        console.log('Stored polygon geometry:', {
          type: this.currentDrawnGeometry.type,
          coordinates: this.currentDrawnGeometry.coordinates ? 'present' : 'missing',
          extentCenter: coordinates
        });
      } catch (e) {
        console.error('Failed to serialize drawn geometry to GeoJSON', e);
        this.currentDrawnGeometry = null;
      }
    }

    // DEBUG: ensure the drawn geometry is captured before opening the form
    try {
      console.debug('[MapComponent] showActifFormForGeometry - clickCoordinates:', coordinates);
      console.debug('[MapComponent] showActifFormForGeometry - currentDrawnGeometry:', JSON.stringify(this.currentDrawnGeometry));
    } catch (e) {
      console.debug('[MapComponent] showActifFormForGeometry - currentDrawnGeometry (non-serializable):', this.currentDrawnGeometry);
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
    if (!this.selectedFeature) {
      console.warn('No feature selected for deletion');
      return;
    }

    const data = this.selectedFeature.get('data');
    if (!data || !data.id) {
      console.error('Selected feature has no valid data or ID:', data);
      alert('Erreur: Impossible de supprimer cet élément - données manquantes');
      return;
    }

    const type = this.selectedFeature.get('type');
    const featureName = this.getFeatureName() || 'cet élément';

    // Show confirmation dialog
    const confirmDelete = confirm(`Êtes-vous sûr de vouloir supprimer ${featureName} ? Cette action est irréversible.`);

    if (!confirmDelete) {
      return;
    }

    console.log('Deleting feature:', { id: data.id, type, name: featureName });

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

    // Treat any polygon feature as an actif (delete via actifService)
    this.actifService.deleteActif(data.id).subscribe({
      next: (response) => {
        console.log('Delete successful:', response);
        source.removeFeature(featureToRemove);
        this.actifs = this.actifs.filter(a => a.id !== data.id);
        this.zones = this.zones.filter(z => z.id !== data.id);

        // Show success message
        alert(`${featureName} a été supprimé avec succès.`);

        // Refresh the map data to ensure consistency
        this.refreshData(true);
      },
      error: (err) => {
        console.error('Error deleting actif/zone:', err);
        this.selectedFeature = featureToRemove; // Restore selection on error

        // Show user-friendly error message
        let errorMessage = 'Erreur lors de la suppression. ';
        if (err.status === 401) {
          errorMessage += 'Vous n\'êtes pas autorisé à effectuer cette action.';
        } else if (err.status === 403) {
          errorMessage += 'Accès refusé.';
        } else if (err.status === 404) {
          errorMessage += 'L\'élément n\'existe plus.';
        } else if (err.status === 500) {
          errorMessage += 'Erreur serveur. Veuillez réessayer plus tard.';
        } else {
          errorMessage += 'Veuillez réessayer.';
        }

        alert(errorMessage);
      }
    });
  }

  private resetForm() {
    this.newGeometry = { name: '', color: '#ff0000', opacity: 0.5 };
  }

  refreshData(forceRefresh = false) {
    // Clear current features immediately for better perceived performance
    this.actifSource.clear();
    this.zoneSource.clear();
    this.anomalieSource.clear();

    // Optionally force server refresh by clearing caches in service
    if (forceRefresh) {
      try {
        (this.carteIntegrationService as any).clearActifsCache?.();
        (this.carteIntegrationService as any).clearAnomaliesCache?.();
      } catch (e) {
        // ignore
      }
    }

    // Load both datasets in parallel and show spinner only while waiting
    this.error = null;

    // Use forkJoin to load both datasets together
    import('rxjs').then(rx => {
      const { forkJoin } = rx;
      forkJoin({
        actifs: this.carteIntegrationService.getActifsForMap(forceRefresh),
        anomalies: this.carteIntegrationService.getAnomaliesForMap(forceRefresh)
      }).subscribe({
        next: ({ actifs, anomalies }) => {
          try {
            this.actifs = actifs;
            this.anomalies = anomalies;
            this.addActifsToMap(actifs);
            this.addAnomaliesToMap(anomalies);
            this.zones = actifs.filter(a => {
              try {
                if (a.geometry) {
                  const g = typeof a.geometry === 'string' ? JSON.parse(a.geometry) : a.geometry;
                  return g && g.type && (/polygon/i).test(g.type);
                }
                return false;
              } catch (e) {
                return false;
              }
            });
          } catch (err) {
            console.error('Error processing loaded data:', err);
            this.error = 'Erreur de traitement des données de la carte.';
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement des données de la carte:', err);
          this.error = 'Erreur lors du chargement des données de la carte.';
        }
      });
    });
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

  getAssetTypeIcon(): string {
    if (!this.selectedFeature) return '📍';

    const data = this.selectedFeature.get('data');
    const type = data?.type?.toLowerCase() || '';
    const geometry = this.selectedFeature.getGeometry();

    if (geometry instanceof Point) {
      // Point assets
      if (type.includes('portuaire') || type.includes('port')) return '⚓';
      if (type.includes('radar')) return '📡';
      if (type.includes('camera') || type.includes('caméra')) return '📹';
      if (type.includes('sensor') || type.includes('capteur')) return '📊';
      if (type.includes('light') || type.includes('lumière')) return '💡';
      return '📍'; // Default point icon
    } else {
      // Polygon/Zone assets
      if (type.includes('zone') || type.includes('area')) return '🏗️';
      if (type.includes('portuaire') || type.includes('port')) return '⚓';
      if (type.includes('stockage') || type.includes('storage')) return '📦';
      return '⬟'; // Default polygon icon
    }
  }

  getStatusClass(status: string): string {
    if (!status) return 'unknown';

    const statusLower = status.toLowerCase();
    if (statusLower.includes('operationnel') || statusLower.includes('operational')) return 'operational';
    if (statusLower.includes('maintenance')) return 'maintenance';
    if (statusLower.includes('panne') || statusLower.includes('broken') || statusLower.includes('hors_service')) return 'broken';
    if (statusLower.includes('inactif') || statusLower.includes('inactive')) return 'inactive';

    return 'unknown';
  }

  getStatusLabel(status: string): string {
    if (!status) return 'Inconnu';

    const statusLower = status.toLowerCase();
    if (statusLower.includes('operationnel') || statusLower.includes('operational')) return 'Opérationnel';
    if (statusLower.includes('maintenance')) return 'En Maintenance';
    if (statusLower.includes('panne') || statusLower.includes('broken')) return 'En Panne';
    if (statusLower.includes('hors_service')) return 'Hors Service';
    if (statusLower.includes('inactif') || statusLower.includes('inactive')) return 'Inactif';

    return status; // Return original if no match
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

  getFeatureTypeDisplay(): string {
    if (!this.selectedFeature) return 'Inconnu';

    const type = this.selectedFeature.get('type');
    const data = this.selectedFeature.get('data');

    if (type === 'actif') {
      return data?.famille_type || data?.type || 'Actif';
    } else if (type === 'zone') {
      return 'Zone';
    } else if (type === 'anomalie') {
      return 'Anomalie';
    }

    return type || 'Inconnu';
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
        // Populate zones array from actifs that have polygon geometries
        this.zones = actifs.filter(a => {
          try {
            if (a.geometry) {
              const g = typeof a.geometry === 'string' ? JSON.parse(a.geometry) : a.geometry;
              return g && g.type && (/polygon/i).test(g.type);
            }
            return false;
          } catch (e) {
            return false;
          }
        });
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

// In your addActifsToMap method, replace the projection detection logic:

// Add this method to your MapComponent class to fix polygon rendering issues

private addActifsToMap(actifs: ActifPourCarte[]) {
  this.actifSource.clear();
  this.zoneSource.clear();

  actifs.forEach(actif => {
    try {
      let feature: Feature<Geometry>;
      
      if (actif.geometry) {
        const geoJsonFormat = new GeoJSON();
        let geojson: any = typeof actif.geometry === 'string' ? JSON.parse(actif.geometry) : actif.geometry;
        
        geojson = this.stripCrsDeep(geojson);

        if (!geojson || typeof geojson !== 'object' || !geojson.type) {
          console.warn('Invalid geometry format for actif:', actif.id, geojson);
          return;
        }

        try {
          // Since backend now stores in EPSG:4326, we can safely assume that's the format
          const features = geoJsonFormat.readFeatures(
            { 
              type: 'Feature' as const, 
              geometry: geojson, 
              properties: {} 
            }, 
            { 
              dataProjection: 'EPSG:4326',    // Backend now stores in EPSG:4326
              featureProjection: 'EPSG:3857'  // OpenLayers uses EPSG:3857
            }
          );

          feature = features[0];
          if (!feature) {
            console.warn('No feature parsed from geometry:', geojson);
            return;
          }

          // Validate geometry extent after parsing
          const geometry = feature.getGeometry();
          const extent = geometry?.getExtent();

          // Check for invalid extent
          if (!extent || extent.some(val => !isFinite(val) || isNaN(val))) {
            console.error('Invalid extent after parsing:', extent);
            
            // Fallback to lat/lng if available
            if (actif.latitude != null && actif.longitude != null) {
              console.log(`Using lat/lng fallback for actif ${actif.id}`);
              feature = new Feature({ geometry: new Point(fromLonLat([actif.longitude, actif.latitude])) });
            } else {
              console.error(`Cannot render actif ${actif.id} - invalid geometry and no lat/lng`);
              return;
            }
          } else {
            // Valid extent - log for debugging
            const center3857: [number, number] = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
            const center4326 = transform(center3857, 'EPSG:3857', 'EPSG:4326') as [number, number];
            
            console.log(`Actif ${actif.id} (${actif.nom}) - Valid geometry:`, {
              dbLat: actif.latitude,
              dbLng: actif.longitude,
              calculatedCenter: center4326,
              geometryType: geojson.type,
              extent: extent
            });
          }
          
        } catch (parseError) {
          console.error(`Failed to parse geometry for actif ${actif.id}:`, parseError);
          
          // Fallback to lat/lng
          if (actif.latitude != null && actif.longitude != null) {
            console.log(`Using lat/lng fallback for actif ${actif.id}`);
            feature = new Feature({
              geometry: new Point(fromLonLat([actif.longitude, actif.latitude]))
            });
          } else {
            console.error(`Cannot render actif ${actif.id} - geometry parse failed and no lat/lng`);
            return;
          }
        }
        
      } else if (actif.latitude != null && actif.longitude != null) {
        // For point features without geometry field, use lat/lng
        feature = new Feature({
          geometry: new Point(fromLonLat([actif.longitude, actif.latitude]))
        });
      } else {
        console.warn('Actif has no geometry or coordinates:', actif);
        return;
      }

      feature.setId(actif.id);
      const sanitizedData = { ...actif } as any;
      
      // Clean up geometry data to avoid circular references
      try { 
        sanitizedData.geometry = this.stripCrsDeep(sanitizedData.geometry ?? sanitizedData.geojson ?? null); 
      } catch (e) {
        console.warn('Failed to sanitize geometry for actif:', actif.id, e);
      }
      
      feature.setProperties({ 
        id: actif.id, 
        type: 'actif', 
        data: sanitizedData 
      });

      const geom = feature.getGeometry();
      if (!geom) {
        console.warn('Feature has no geometry after processing:', actif.id);
        return;
      }
      
      const geomType = geom.getType();

      // Add to appropriate source based on geometry type
      if (geomType === 'Point') {
        this.actifSource.addFeature(feature);
      } else {
        // Polygons, LineStrings, etc. go to zone source
        this.zoneSource.addFeature(feature);
        
        if (geomType === 'Polygon') {
          const extent = geom.getExtent();
          console.log(`Added polygon actif ${actif.id} to zone source:`, {
            extent: extent,
            isValidExtent: extent && extent.every(val => isFinite(val) && !isNaN(val))
          });
        }
      }

    } catch (e) {
      console.error('Error adding actif to map:', e, actif);
    }
  });

  // Ensure both layers are visible
  if (this.clusterLayer) this.clusterLayer.setVisible(true);
  if (this.zoneLayer) this.zoneLayer.setVisible(true);

  // Force refresh to trigger re-rendering
  this.actifSource.changed();
  this.zoneSource.changed();
  
  console.log(`Loaded ${this.actifSource.getFeatures().length} point actifs and ${this.zoneSource.getFeatures().length} polygon/line actifs`);
}

  // Initialize project legend control (ol_control_Legend)
  private initializeLegendControl() {
    try {
      this.legendControl = new ol_control_Legend({ collapsed: false, title: 'Légende' });
      this.map.addControl(this.legendControl);

      // Add default legend items (use plain labels and set swatches separately)
      this.legendControl.addItem('Actifs', 'Actifs');
      this.legendControl.setItemSwatch('Actifs', '#007bff', 'circle');

      this.legendControl.addItem("Groupes d'Actifs", "Groupes d'Actifs");
      this.legendControl.setItemSwatch("Groupes d'Actifs", '#17a2b8', 'rect');

      this.legendControl.addItem('Zones', 'Zones');
      // zone swatch uses semi-transparent fill; use a rect to indicate area
      this.legendControl.setItemSwatch('Zones', 'rgba(255,0,0,0.4)', 'rect');

      this.legendControl.addItem('Anomalies', 'Anomalies');
      this.legendControl.setItemSwatch('Anomalies', '#ffc107', 'circle');

      // Sync initial visibility
      this.legendControl.setItemVisibility('Actifs', this.showActifs);
      this.legendControl.setItemVisibility("Groupes d'Actifs", this.showActifs);
      this.legendControl.setItemVisibility('Anomalies', this.showAnomalies);
    } catch (e) {
      console.warn('Could not initialize legend control:', e);
      this.legendControl = undefined;
    }
  }

  private updateLegendItemVisibility(itemTitle: string, visible: boolean) {
    // Legend functionality disabled until ol_legend_Legend is available
  }

  private addLegendItems() {
    // Legend functionality is disabled until ol_legend_Legend is available
    this.addStatusBasedLegendItems();
  }

  private addStatusBasedLegendItems() {
    const statusColors = {
      'operational': '#28a745',
      'maintenance': '#ffc107',
      'broken': '#dc3545',
      'inactive': '#6c757d'
    };
    // Legend functionality is disabled
  }

  updateLegend() {
    // Legend functionality is disabled
  }

  toggleLegend() {
    // Legend functionality is disabled
  }

  isLegendVisible(): boolean {
    // Legend functionality is disabled
    return false;
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
    else {
      // No drawn feature: construct a feature from the returned actif payload and add it
      try {
        const geoJsonFormat = new GeoJSON();
        let feature: Feature<Geometry> | null = null;

        if (actifData.geometry) {
          const geojson = typeof actifData.geometry === 'string' ? JSON.parse(actifData.geometry) : actifData.geometry;
          const features = geoJsonFormat.readFeatures({ type: 'Feature', geometry: geojson, properties: {} }, { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
          if (features && features.length > 0) {
            feature = features[0] as Feature<Geometry>;
          }
        } else if (actifData.latitude != null && actifData.longitude != null) {
          feature = new Feature({ geometry: new Point(fromLonLat([actifData.longitude, actifData.latitude])) });
        }

        if (feature) {
          feature.setId(actifData.id);
          feature.setProperties({ id: actifData.id, type: 'actif', data: actifData });
          const geom = feature.getGeometry();
          if (geom && geom.getType && geom.getType().toLowerCase().includes('polygon')) {
            this.zoneSource.addFeature(feature);
          } else {
            this.actifSource.addFeature(feature);
          }
          // notify sources changed so layers refresh
          this.actifSource.changed();
          this.zoneSource.changed();
        } else {
          // If we couldn't build a feature, fallback to reloading list
          this.loadActifsData();
        }
      } catch (e) {
        console.error('Failed to create feature from created actif payload, falling back to reload', e);
        this.loadActifsData();
      }
    }
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

  // Toggle visibility for actifs (cluster) layer
  toggleActifsLayer() {
    this.showActifs = !this.showActifs;
    try {
      if (this.clusterLayer && typeof this.clusterLayer.setVisible === 'function') {
        this.clusterLayer.setVisible(this.showActifs);
      }
      // Keep zone layer visibility in sync only when hiding all actifs
      if (this.zoneLayer && typeof this.zoneLayer.setVisible === 'function') {
        this.zoneLayer.setVisible(this.showActifs || this.zoneLayer.getVisible());
      }
    } catch (e) {
      console.warn('Failed to toggle actifs layer visibility', e);
    }
  }

  // Toggle visibility for anomalies layer
  toggleAnomaliesLayer() {
    this.showAnomalies = !this.showAnomalies;
    try {
      if (this.anomalieLayer && typeof this.anomalieLayer.setVisible === 'function') {
        this.anomalieLayer.setVisible(this.showAnomalies);
      }
    } catch (e) {
      console.warn('Failed to toggle anomalies layer visibility', e);
    }
  }

  // Add anomalies to anomaly source (assumes backend returns geometry in EPSG:4326)
  private addAnomaliesToMap(anomalies: AnomaliePourCarte[]) {
    try {
      this.anomalieSource.clear();
      const geoJson = new GeoJSON();
      anomalies.forEach(a => {
        try {
          const an = a as any;
          if (an.geometry) {
            let geojson: any = typeof an.geometry === 'string' ? JSON.parse(an.geometry) : an.geometry;
            geojson = this.stripCrsDeep(geojson);
            // Backend contract: geometry is EPSG:4326
            const features = geoJson.readFeatures(
              { type: 'Feature' as const, geometry: geojson, properties: {} },
              { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }
            );
            const f = features && features[0];
            if (f) {
              f.setId(an.id);
              f.setProperties({ id: an.id, type: 'anomalie', data: an });
              this.anomalieSource.addFeature(f);
            }
          } else if (an.latitude != null && an.longitude != null) {
            const f = new Feature({ geometry: new Point(fromLonLat([an.longitude, an.latitude])) });
            f.setId(an.id);
            f.setProperties({ id: an.id, type: 'anomalie', data: an });
            this.anomalieSource.addFeature(f);
          }
        } catch (e) {
          console.warn('Error adding anomaly to map', e, a);
        }
      });
      if (this.anomalieLayer && typeof this.anomalieLayer.setVisible === 'function') {
        this.anomalieLayer.setVisible(this.showAnomalies);
      }
      this.anomalieSource.changed();
    } catch (e) {
      console.error('Failed to add anomalies to map', e);
    }
  }}