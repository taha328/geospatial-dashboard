import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource, Cluster } from 'ol/source';
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
import { SelectEvent } from 'ol/interaction/Select';
import { ol_layer_AnimatedCluster } from './ol-animated-cluster-ext.layer';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private map!: Map;
  private pointSource!: VectorSource;
  private zoneSource!: VectorSource;
  private clusterLayer!: ol_layer_AnimatedCluster;
  private zoneLayer!: VectorLayer<VectorSource>;
  private drawInteraction!: Draw;
  private modifyInteraction!: Modify;
  private selectInteraction!: Select;

  isDrawing = false;
  drawType: 'Point' | 'Polygon' | 'LineString' = 'Point';
  selectedFeature: Feature<Geometry> | null = null;
  
  newGeometry = {
    name: '',
    description: '',
    color: '#ff0000',
    opacity: 0.5,
  };

  points: any[] = [];
  zones: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private pointService: PointService,
    private zoneService: ZoneService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.initializeMap();
    this.loadMapData();
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
        new TileLayer({ source: new OSM() }),
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
  }

  private removeDrawInteraction() {
    if (this.drawInteraction) {
      this.map.removeInteraction(this.drawInteraction);
    }
  }

  private onDrawEnd(feature: Feature<Geometry>) {
    this.selectedFeature = feature;
    this.saveNewGeometry(feature);
  }

  private saveNewGeometry(feature: Feature<Geometry>) {
    const geometry = feature.getGeometry();
    if (!geometry) return;

    if (this.drawType === 'Point') {
      const coords = (geometry as Point).getCoordinates();
      const lonLat = transform(coords, 'EPSG:3857', 'EPSG:4326');
      const pointData = {
        longitude: lonLat[0],
        latitude: lonLat[1],
        description: this.newGeometry.description,
        color: this.newGeometry.color,
        type: 'point'
      };

      this.pointService.createPoint(pointData).subscribe({
        next: (point) => {
          feature.setProperties({ id: point.id, type: 'point', data: point });
          this.points.push(point);
          this.resetForm();
        },
        error: (err) => { console.error('Error saving point:', err); this.pointSource.removeFeature(feature); }
      });
    } else {
      const geoJsonFormat = new GeoJSON();
      const geoJsonGeometry = geoJsonFormat.writeGeometry(geometry, { featureProjection: 'EPSG:3857' });
      const zoneData = {
        name: this.newGeometry.name,
        type: this.drawType.toLowerCase(),
        geometry: geoJsonGeometry,
        description: this.newGeometry.description,
        color: this.newGeometry.color,
        opacity: this.newGeometry.opacity
      };

      this.zoneService.createZone(zoneData).subscribe({
        next: (zone) => {
          feature.setProperties({ id: zone.id, type: 'zone', data: zone });
          this.zones.push(zone);
          this.resetForm();
        },
        error: (err) => { console.error('Error saving zone:', err); this.zoneSource.removeFeature(feature); }
      });
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
        description: data.description || '',
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
    this.newGeometry = { name: '', description: '', color: '#ff0000', opacity: 0.5 };
  }

  refreshData() {
    this.pointSource.clear();
    this.zoneSource.clear();
    this.loadMapData();
  }
}