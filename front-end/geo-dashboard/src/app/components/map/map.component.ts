import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource, Cluster, XYZ } from 'ol/source';
// FIX: Import Feature from 'ol' and FeatureLike (as a type) from 'ol/Feature'
import { Feature } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import { Point, Polygon, LineString, Geometry } from 'ol/geom';
import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style';
import { fromLonLat, transform } from 'ol/proj';
import { GeoJSON } from 'ol/format';
import { Draw, Modify, Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import { PointService } from '../../services/point.service';
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
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map!: Map;
  private pointSource!: VectorSource;
  private zoneSource!: VectorSource;
  private actifSource!: VectorSource;
  private anomalieSource!: VectorSource;
  private clusterLayer!: ol_layer_AnimatedCluster;
  private zoneLayer!: VectorLayer<VectorSource>;
  private actifLayer!: VectorLayer<VectorSource>;
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

  points: any[] = [];
  zones: any[] = [];
  actifs: ActifPourCarte[] = [];
  anomalies: AnomaliePourCarte[] = [];
  loading = false;
  error: string | null = null;

  // UI state properties
  sidebarCollapsed = false;
  isFullscreen = false;
  mouseCoordinates = '';
  
  // Nouvelles propriétés pour la gestion des actifs
  showActifs = true;
  showAnomalies = true;
  showSignalementForm = false;
  showActifForm = false;
  clickCoordinates: [number, number] | null = null;
  currentDrawnGeometry: any = null; // Store the drawn geometry for actif creation
  currentDrawnFeature: Feature<Geometry> | null = null;
  selectedAssetForAnomalie: Feature<Geometry> | null = null;

  constructor(
    private pointService: PointService,
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
        // When coming from external link, just show a notification or set a flag
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
    this.pointSource = new VectorSource();
    const clusterSource = new Cluster({
      distance: 40,
      source: this.pointSource,
    });
    this.zoneSource = new VectorSource();

    this.clusterLayer = new ol_layer_AnimatedCluster({
      source: clusterSource,
      style: (feature: FeatureLike) => this.getFeatureStyle(feature)
    });

    this.zoneLayer = new VectorLayer({
      source: this.zoneSource,
      style: (feature: FeatureLike) => this.getFeatureStyle(feature)
    });

    this.map = new Map({
      target: this.mapContainer.nativeElement,
      layers: [
        // new TileLayer({ source: new OSM() }),
        new TileLayer({ source: new XYZ({url: 'http://mt3.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}'}) }),
        this.zoneLayer,
        this.clusterLayer,
      ],
      view: new View({
        center: fromLonLat([-5.5026, 35.8845]),
        zoom: 12
      })
    });

    this.selectInteraction = new Select({
      condition: click,
      layers: [this.clusterLayer, this.zoneLayer],
      style: (feature: FeatureLike) => this.getSelectedStyle(feature)
    });
    
    this.modifyInteraction = new Modify({
      features: this.selectInteraction.getFeatures()
    });

    this.map.addInteraction(this.selectInteraction);
    this.map.addInteraction(this.modifyInteraction);

    // Add mouse coordinate tracking
    this.map.on('pointermove', (evt) => {
      const coordinate = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
      this.mouseCoordinates = `${coordinate[1].toFixed(4)}°N, ${coordinate[0].toFixed(4)}°E`;
    });

    this.selectInteraction.on('select', (e: SelectEvent) => {
      this.selectedFeature = null;
      this.resetForm();

      if (e.selected.length > 0) {
        const feature = e.selected[0];
        const clusteredFeatures = feature.get('features');

        if (clusteredFeatures && clusteredFeatures.length > 1) {
          this.selectInteraction.getFeatures().clear();
        } else {
          this.selectedFeature = clusteredFeatures ? clusteredFeatures[0] : feature as Feature<Geometry>;
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

    this.pointService.getPoints().subscribe({
      next: (points) => {
        this.points = points;
        this.addPointsToMap(points);
      },
      error: (err) => { this.error = 'Failed to load points'; console.error(err); }
    });

    this.zoneService.getZones().subscribe({
      next: (zones) => {
        this.zones = zones;
        this.addZonesToMap(zones);
        this.loading = false;
      },
      error: (err) => { this.error = 'Failed to load zones'; console.error(err); this.loading = false; }
    });
  }

  private addPointsToMap(points: any[]) {
    points.forEach(point => {
      if (point.latitude && point.longitude) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([point.longitude, point.latitude])),
          id: point.id,
          type: 'point',
          data: point
        });
        this.pointSource.addFeature(feature);
      }
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

  private getFeatureStyle(feature: FeatureLike): Style | Style[] {
    const clusteredFeatures = feature.get('features');
    if (clusteredFeatures) {
      const size = clusteredFeatures.length;
      if (size > 1) {
        return new Style({
          image: new CircleStyle({
            radius: 12 + Math.min(size, 20) / 2,
            fill: new Fill({ color: 'rgba(0, 153, 255, 0.8)' }),
            stroke: new Stroke({ color: '#fff', width: 2 })
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({ color: '#fff' }),
            font: 'bold 12px sans-serif'
          }),
        });
      }
    }
    
    const actualFeature = clusteredFeatures ? clusteredFeatures[0] : feature;
    const data = actualFeature.get('data');
    const type = actualFeature.get('type');
    
    const color = data?.color || '#ff0000';
    const opacity = data?.opacity || 0.5;

    if (type === 'point') {
      return new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: color }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        })
      });
    } else {
      const rgb = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
      return new Style({
        fill: new Fill({ color: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})` }),
        stroke: new Stroke({ color: color, width: 2 })
      });
    }
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
    
    const source = this.drawType === 'Point' ? this.pointSource : this.zoneSource;
    
    this.drawInteraction = new Draw({
      source: source,
      type: this.drawType
    });

    this.drawInteraction.on('drawend', (e) => {
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
    
    // For all drawing types, show the actif creation form
    // since all geometries are considered assets
    this.showActifFormForGeometry(feature);
  }

  private showActifFormForGeometry(feature: Feature<Geometry>) {
    const geometry = feature.getGeometry();
    if (!geometry) return;

    // Get coordinates based on geometry type
    let coordinates: [number, number];
    
    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      const lonLat = transform(coords, 'EPSG:3857', 'EPSG:4326');
      coordinates = [lonLat[0], lonLat[1]];
    } else {
      // For polygons and lines, use the centroid
      const extent = geometry.getExtent();
      const centerCoords = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
      const lonLat = transform(centerCoords, 'EPSG:3857', 'EPSG:4326');
      coordinates = [lonLat[0], lonLat[1]];
    }

    // Store coordinates and geometry info for the form
    this.clickCoordinates = coordinates;
    this.currentDrawnFeature = feature;
    this.showActifForm = true;
    this.stopDrawing();
  }

  private saveNewGeometry(feature: Feature<Geometry>) {
    const geometry = feature.getGeometry();
    if (!geometry) return;

    if (this.drawType === 'Point') {
      const coords = (geometry as Point).getCoordinates();
      const lonLat = transform(coords, 'EPSG:3857', 'EPSG:4326');
      
      // Store coordinates for point actif creation
      this.clickCoordinates = [lonLat[0], lonLat[1]];
      this.currentDrawnGeometry = null; // No complex geometry for points
      this.showActifForm = true;
    } else {
      // For polygon/linestring, store the geometry
      const geoJsonFormat = new GeoJSON();
      
      // Transform to EPSG:4326 (WGS84) before creating GeoJSON
      const geoJsonGeometry = geoJsonFormat.writeGeometry(geometry, { 
        featureProjection: 'EPSG:3857',
        dataProjection: 'EPSG:4326' // Transform to WGS84 for storage
      });
      
      this.currentDrawnGeometry = JSON.parse(geoJsonGeometry);
      this.clickCoordinates = null; // No point coordinates for complex shapes
      
      console.log('Captured geometry for polygon/linestring:', this.currentDrawnGeometry);
      this.showActifForm = true;
    }
    
    this.stopDrawing();
  }

  private updateGeometry(feature: Feature<Geometry>) {
    const data = feature.get('data');
    const type = feature.get('type');
    const geometry = feature.getGeometry();
    if (!geometry || !data) return;

    if (type === 'point') {
      const coords = (geometry as Point).getCoordinates();
      const lonLat = transform(coords, 'EPSG:3857', 'EPSG:4326');
      const updatedPoint = { ...data, longitude: lonLat[0], latitude: lonLat[1] };
      this.pointService.updatePoint(data.id, updatedPoint).subscribe({
        next: (point) => feature.set('data', point),
        error: (err) => console.error('Error updating point:', err)
      });
    } else {
      const geoJsonFormat = new GeoJSON();
      const geoJsonGeometry = geoJsonFormat.writeGeometry(geometry, { featureProjection: 'EPSG:3857' });
      const updatedZone = { ...data, geometry: geoJsonGeometry };
      this.zoneService.updateZone(data.id, updatedZone).subscribe({
        next: (zone) => feature.set('data', zone),
        error: (err) => console.error('Error updating zone:', err)
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
    const source = type === 'point' ? this.pointSource : this.zoneSource;

    const featureToRemove = this.selectedFeature;
    this.selectedFeature = null;

    if (type === 'point') {
      this.pointService.deletePoint(data.id).subscribe({
        next: () => {
          source.removeFeature(featureToRemove);
          this.points = this.points.filter(p => p.id !== data.id);
        },
        error: (err) => console.error('Error deleting point:', err)
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
    this.pointSource.clear();
    this.zoneSource.clear();
    this.loadMapData();
  }

  // Helper methods for dynamic button text and icons
  getDrawingStatusText(): string {
    if (this.drawType === 'Point') {
      return 'Cliquez sur la carte pour placer un actif point';
    } else if (this.drawType === 'Polygon') {
      return 'Dessinez une zone pour créer un actif zone';
    } else {
      return 'Dessinez une route pour créer un actif route';
    }
  }

  // Helper methods for selected feature display
  getFeatureTypeDisplay(): string {
    if (!this.selectedFeature) return '';
    
    const type = this.selectedFeature.get('type');
    switch (type) {
      case 'actif': return 'Actif';
      case 'anomalie': return 'Anomalie';
      case 'point': return 'Point';
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
    return type === 'actif' || type === 'point' || type === 'zone';
  }

  signalAnomalieForSelectedFeature(): void {
    if (!this.selectedFeature) return;

    // Get coordinates from the selected feature
    const geometry = this.selectedFeature.getGeometry();
    if (!geometry) return;

    let coordinates: [number, number];
    
    if (geometry instanceof Point) {
      const coords = geometry.getCoordinates();
      const lonLat = transform(coords, 'EPSG:3857', 'EPSG:4326');
      coordinates = [lonLat[0], lonLat[1]];
    } else {
      // For polygons and lines, use the centroid
      const extent = geometry.getExtent();
      const centerCoords = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
      const lonLat = transform(centerCoords, 'EPSG:3857', 'EPSG:4326');
      coordinates = [lonLat[0], lonLat[1]];
    }

  // Store coordinates and show anomaly form
    this.clickCoordinates = coordinates;
    this.selectedAssetForAnomalie = this.selectedFeature;
    this.showSignalementForm = true;
  }

  /**
   * Get selected asset data for anomaly form
   * Extracts asset properties from OpenLayers feature
   */
  getSelectedAssetData(): any {
    if (!this.selectedAssetForAnomalie) {
      return null;
    }

    // Extract properties from the OpenLayers feature
    const properties = this.selectedAssetForAnomalie.getProperties();
    const data: any = properties['data'] || {};
    const rawId = properties['id'] ?? data.id;
    const nom = (
      data.nom ||
      data.name ||
      (data as any).libelle ||
      (data as any).label ||
      (data as any).designation ||
      properties['nom'] ||
      properties['name'] ||
      properties['libelle'] ||
      properties['label'] ||
      properties['designation'] ||
      ''
    );
    const code = data.code || properties['code'] || (rawId != null ? String(rawId) : '');
    const type = data.type || data.famille_type || properties['type'] || properties['famille_type'];
    
    // Return asset data in the format expected by anomaly component
    const selected = {
      id: rawId,
      nom,
      code,
      type,
      data, // keep full original data
      // Include any other relevant properties
      ...properties
    };
    if (!nom) {
      // Helpful debug once; guard against flooding console
      try { console.debug('Selected asset has no name properties', selected); } catch {}
    }
    return selected;
  }

  // UI control methods
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  resetView() {
    if (this.map) {
      this.map.getView().setCenter(fromLonLat([2.3522, 48.8566])); // Paris center
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
    // Implementation for layer switching (satellite, terrain, etc.)
    console.log('Toggle layer:', layerType);
    // TODO: Implement layer switching logic
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
    // Export current map data
    const features = [
      ...this.pointSource.getFeatures(),
      ...this.zoneSource.getFeatures()
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
    // Create file input for importing data
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
                this.pointSource.addFeature(feature);
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

  // Nouvelles méthodes pour la gestion des actifs
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

  private addActifsToMap(actifs: ActifPourCarte[]) {
    if (!this.actifSource) {
      this.actifSource = new VectorSource();
      this.actifLayer = new VectorLayer({
        source: this.actifSource,
        style: (feature: FeatureLike) => this.getActifStyle(feature)
      });
      this.map.addLayer(this.actifLayer);
    }

    // Vider la source avant d'ajouter les nouveaux actifs pour éviter les doublons
    this.actifSource.clear();

    actifs.forEach(actif => {
      if (actif.latitude && actif.longitude) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([actif.longitude, actif.latitude])),
          id: actif.id,
          type: 'actif',
          data: actif
        });
        this.actifSource.addFeature(feature);
      }
    });
  }

  private addAnomaliesToMap(anomalies: AnomaliePourCarte[]) {
    if (!this.anomalieSource) {
      this.anomalieSource = new VectorSource();
      this.anomalieLayer = new VectorLayer({
        source: this.anomalieSource,
        style: (feature: FeatureLike) => this.getAnomalieStyle(feature)
      });
      this.map.addLayer(this.anomalieLayer);
    }

    anomalies.forEach(anomalie => {
      if (anomalie.latitude && anomalie.longitude) {
        const feature = new Feature({
          geometry: new Point(fromLonLat([anomalie.longitude, anomalie.latitude])),
          id: anomalie.id,
          type: 'anomalie',
          data: anomalie
        });
        this.anomalieSource.addFeature(feature);
      }
    });
  }

  private getActifStyle(feature: FeatureLike): Style {
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

  toggleActifsLayer() {
    if (this.actifLayer) {
      this.actifLayer.setVisible(this.showActifs);
    }
  }

  toggleAnomaliesLayer() {
    if (this.anomalieLayer) {
      this.anomalieLayer.setVisible(this.showAnomalies);
    }
  }

  onAnomalieSignaled() {
    console.log('Anomalie signalée depuis la carte!');
    
    // Notifier le service de rafraîchissement des données
    this.dataRefreshService.notifyAnomalieAdded();
    
    // Recharger les anomalies après signalement
    this.loadAnomaliesData();
    this.showSignalementForm = false;
    this.clickCoordinates = null;
    this.selectedAssetForAnomalie = null;
    
    // Informer l'utilisateur
    alert('Anomalie signalée avec succès! Les KPI seront mis à jour automatiquement.');
  }
  
  /**
   * Gère l'annulation du signalement d'anomalie
   */
  onSignalementCancelled() {
    this.showSignalementForm = false;
    this.clickCoordinates = null;
    this.selectedAssetForAnomalie = null;
    this.map.getViewport().style.cursor = 'default';
  }

  /**
   * Gère l'annulation de la création d'actif
   */
  onActifFormCancel() {
    this.showActifForm = false;
    this.clickCoordinates = null;
    this.currentDrawnGeometry = null;
    
    // If we have a drawn feature that wasn't saved, remove it
    if (this.currentDrawnFeature) {
      const geometry = this.currentDrawnFeature.getGeometry();
      const source = geometry instanceof Point ? this.pointSource : this.zoneSource;
      source.removeFeature(this.currentDrawnFeature);
      this.currentDrawnFeature = null;
    }

    this.map.getViewport().style.cursor = 'default';
  }/**
   * Gère la création réussie d'un actif depuis le formulaire
   */
  onActifCreated(actifData: any) {
    console.log('Actif créé avec succès:', actifData);
    
    // If we have a drawn feature, update it with the actif data
    if (this.currentDrawnFeature) {
      this.currentDrawnFeature.setProperties({
        id: actifData.id,
        type: 'actif',
        data: actifData
      });
      this.currentDrawnFeature = null;
    }
    
    // Recharger les actifs sur la carte
    this.loadActifsData();
    
    // Fermer le formulaire et réinitialiser l'état
    this.showActifForm = false;
    this.clickCoordinates = null;
    this.currentDrawnGeometry = null;
    this.map.getViewport().style.cursor = 'default';
  }

  /**
   * Ajoute un actif localement à la carte (fallback si l'API échoue)
   */
  addLocalActifFeature(actifData: any) {
    // Créer une feature pour l'actif
    const feature = new Feature({
      geometry: new Point(fromLonLat([actifData.longitude, actifData.latitude])),
      nom: actifData.nom,
      code: actifData.code,
      type: actifData.type,
      statutOperationnel: actifData.statutOperationnel,
      etatGeneral: actifData.etatGeneral
    });
    
    // Style pour l'actif
    feature.setStyle(new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({
          color: '#007bff'
        }),
        stroke: new Stroke({
          color: '#ffffff',
          width: 2
        })
      })
    }));
    
    // Ajouter à la couche d'actifs
    this.actifSource.addFeature(feature);
    
    // Fermer le formulaire et réinitialiser l'état
    this.showActifForm = false;
    this.clickCoordinates = null;
    this.map.getViewport().style.cursor = 'default';
    
    // Informer l'utilisateur
    alert('Actif créé localement (mode démo) !');
  }
}