import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Map, View } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { Point, Polygon, Circle } from 'ol/geom';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { fromLonLat, transform } from 'ol/proj';
import { GeoJSON } from 'ol/format';
import { Draw, Modify, Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import { PointService } from '../../services/point.service';
import { ZoneService } from '../../services/zone.service';
import { UserService } from '../../services/user.service';

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
  private vectorSource!: VectorSource;
  private vectorLayer!: VectorLayer<VectorSource>;
  private drawInteraction!: Draw;
  private modifyInteraction!: Modify;
  private selectInteraction!: Select;

  // UI State
  isDrawing = false;
  drawType: 'Point' | 'Polygon' | 'Circle' = 'Point';
  selectedFeature: Feature | null = null;
  
  // Form data
  newGeometry = {
    name: '',
    description: '',
    color: '#ff0000',
    opacity: 0.5
  };

  // Data arrays
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
    // Create vector source and layer
    this.vectorSource = new VectorSource();
    this.vectorLayer = new VectorLayer({
      source: this.vectorSource,
      style: this.getFeatureStyle.bind(this)
    });

    // Create map
    this.map = new Map({
      target: this.mapContainer.nativeElement,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        this.vectorLayer
      ],
      view: new View({
        center: fromLonLat([-5.5026, 35.8845]), // Tanger Med, Morocco
        zoom: 12
      })
    });

    // Add interactions
    this.selectInteraction = new Select({
      condition: click,
      style: this.getSelectedStyle.bind(this)
    });
    
    this.modifyInteraction = new Modify({
      features: this.selectInteraction.getFeatures()
    });

    this.map.addInteraction(this.selectInteraction);
    this.map.addInteraction(this.modifyInteraction);

    // Handle feature selection
    this.selectInteraction.on('select', (e) => {
      if (e.selected.length > 0) {
        this.selectedFeature = e.selected[0];
        this.onFeatureSelected(this.selectedFeature);
      } else {
        this.selectedFeature = null;
      }
    });

    // Handle feature modification
    this.modifyInteraction.on('modifyend', (e) => {
      if (this.selectedFeature) {
        this.updateGeometry(this.selectedFeature);
      }
    });
  }

  private loadMapData() {
    this.loading = true;
    this.error = null;

    // Load points
    this.pointService.getPoints().subscribe({
      next: (points) => {
        this.points = points;
        this.addPointsToMap(points);
      },
      error: (error) => {
        console.error('Error loading points:', error);
        this.error = 'Failed to load points';
      }
    });

    // Load zones
    this.zoneService.getZones().subscribe({
      next: (zones) => {
        this.zones = zones;
        this.addZonesToMap(zones);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading zones:', error);
        this.error = 'Failed to load zones';
        this.loading = false;
      }
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
        this.vectorSource.addFeature(feature);
      }
    });
  }

  private addZonesToMap(zones: any[]) {
    const geoJsonFormat = new GeoJSON();
    
    zones.forEach(zone => {
      try {
        if (zone.geometry) {
          const geoJsonObject = JSON.parse(zone.geometry);
          const features = geoJsonFormat.readFeatures(geoJsonObject, {
            featureProjection: 'EPSG:3857'
          });
          
          features.forEach(feature => {
            feature.setProperties({
              id: zone.id,
              type: 'zone',
              data: zone
            });
            
            this.vectorSource.addFeature(feature);
          });
        }
      } catch (error) {
        console.error('Error parsing zone geometry:', error);
      }
    });
  }

  private getFeatureStyle(feature: any) {
    const data = feature.get('data');
    const type = feature.get('type');
    
    let fillColor = '#ff0000';
    let strokeColor = '#ff0000';
    let opacity = 0.5;
    
    if (data?.color) {
      fillColor = data.color;
      strokeColor = data.color;
    }
    
    if (data?.opacity) {
      opacity = data.opacity;
    }

    if (type === 'point') {
      return new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({
            color: fillColor
          }),
          stroke: new Stroke({
            color: strokeColor,
            width: 2
          })
        })
      });
    } else {
      return new Style({
        fill: new Fill({
          color: fillColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`)
        }),
        stroke: new Stroke({
          color: strokeColor,
          width: 2
        })
      });
    }
  }

  private getSelectedStyle(feature: any) {
    return new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 0, 0.3)'
      }),
      stroke: new Stroke({
        color: '#ffff00',
        width: 3
      }),
      image: new CircleStyle({
        radius: 10,
        fill: new Fill({
          color: 'rgba(255, 255, 0, 0.3)'
        }),
        stroke: new Stroke({
          color: '#ffff00',
          width: 3
        })
      })
    });
  }

  startDrawing() {
    this.isDrawing = true;
    this.removeDrawInteraction();
    
    this.drawInteraction = new Draw({
      source: this.vectorSource,
      type: this.drawType
    });

    this.drawInteraction.on('drawend', (e) => {
      this.onDrawEnd(e.feature);
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

  private onDrawEnd(feature: Feature) {
    this.selectedFeature = feature;
    this.saveNewGeometry(feature);
  }

  private saveNewGeometry(feature: Feature) {
    const geometry = feature.getGeometry();
    if (!geometry) return;

    const geoJsonFormat = new GeoJSON();
    const geoJsonGeometry = geoJsonFormat.writeGeometry(geometry, {
      featureProjection: 'EPSG:3857'
    });

    if (this.drawType === 'Point') {
      // Save as point
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
          feature.setProperties({
            id: point.id,
            type: 'point',
            data: point
          });
          this.points.push(point);
          this.resetForm();
        },
        error: (error) => {
          console.error('Error saving point:', error);
          this.vectorSource.removeFeature(feature);
        }
      });
    } else {
      // Save as zone
      const zoneData = {
        name: this.newGeometry.name,
        type: this.drawType.toLowerCase(),
        geometry: JSON.stringify(geoJsonGeometry),
        description: this.newGeometry.description,
        color: this.newGeometry.color,
        opacity: this.newGeometry.opacity
      };

      this.zoneService.createZone(zoneData).subscribe({
        next: (zone) => {
          feature.setProperties({
            id: zone.id,
            type: 'zone',
            data: zone
          });
          this.zones.push(zone);
          this.resetForm();
        },
        error: (error) => {
          console.error('Error saving zone:', error);
          this.vectorSource.removeFeature(feature);
        }
      });
    }

    this.stopDrawing();
  }

  private updateGeometry(feature: Feature) {
    const data = feature.get('data');
    const type = feature.get('type');
    const geometry = feature.getGeometry();
    
    if (!geometry || !data) return;

    if (type === 'point') {
      const coords = (geometry as Point).getCoordinates();
      const lonLat = transform(coords, 'EPSG:3857', 'EPSG:4326');
      
      const updatedPoint = {
        ...data,
        longitude: lonLat[0],
        latitude: lonLat[1]
      };

      this.pointService.updatePoint(data.id, updatedPoint).subscribe({
        next: (point) => {
          feature.set('data', point);
        },
        error: (error) => {
          console.error('Error updating point:', error);
        }
      });
    } else {
      const geoJsonFormat = new GeoJSON();
      const geoJsonGeometry = geoJsonFormat.writeGeometry(geometry, {
        featureProjection: 'EPSG:3857'
      });

      const updatedZone = {
        ...data,
        geometry: JSON.stringify(geoJsonGeometry)
      };

      this.zoneService.updateZone(data.id, updatedZone).subscribe({
        next: (zone) => {
          feature.set('data', zone);
        },
        error: (error) => {
          console.error('Error updating zone:', error);
        }
      });
    }
  }

  private onFeatureSelected(feature: Feature) {
    const data = feature.get('data');
    const type = feature.get('type');
    
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

    if (type === 'point') {
      this.pointService.deletePoint(data.id).subscribe({
        next: () => {
          this.vectorSource.removeFeature(this.selectedFeature!);
          this.points = this.points.filter(p => p.id !== data.id);
          this.selectedFeature = null;
        },
        error: (error) => {
          console.error('Error deleting point:', error);
        }
      });
    } else {
      this.zoneService.deleteZone(data.id).subscribe({
        next: () => {
          this.vectorSource.removeFeature(this.selectedFeature!);
          this.zones = this.zones.filter(z => z.id !== data.id);
          this.selectedFeature = null;
        },
        error: (error) => {
          console.error('Error deleting zone:', error);
        }
      });
    }
  }

  private resetForm() {
    this.newGeometry = {
      name: '',
      description: '',
      color: '#ff0000',
      opacity: 0.5
    };
  }

  refreshData() {
    this.vectorSource.clear();
    this.loadMapData();
  }
}
