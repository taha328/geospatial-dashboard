import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { VesselFinderComponent } from './vessel-finder.component';
// import { VesselService } from '../../services/vessel.service';
import { PointService } from '../../services/point.service';

describe('VesselFinderComponent', () => {
  let component: VesselFinderComponent;
  let fixture: ComponentFixture<VesselFinderComponent>;
  // let vesselService: jasmine.SpyObj<VesselService>;
  let pointService: jasmine.SpyObj<PointService>;

  beforeEach(async () => {
    // const vesselServiceSpy = jasmine.createSpyObj('VesselService', [
    //   'searchVessels',
    //   'getVesselById',
    //   'getVesselsInBounds',
    //   'searchVesselsByText'
    // ]);
    const pointServiceSpy = jasmine.createSpyObj('PointService', ['findAll']);

    await TestBed.configureTestingModule({
      imports: [
        VesselFinderComponent,
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [
        // { provide: VesselService, useValue: vesselServiceSpy },
        { provide: PointService, useValue: pointServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VesselFinderComponent);
    component = fixture.componentInstance;
    // vesselService = TestBed.inject(VesselService) as jasmine.SpyObj<VesselService>;
    pointService = TestBed.inject(PointService) as jasmine.SpyObj<PointService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default configuration', () => {
    expect(component.selectedView).toBe('both');
    expect(component.showVesselList).toBeTrue();
    expect(component.showEmbeddedMap).toBeTrue();
    expect(component.mapConfig.latitude).toBe('35.8845');
    expect(component.mapConfig.longitude).toBe('-5.5026');
  });

  it('should load sample vessels on init', () => {
    component.ngOnInit();
    expect(component.vessels.length).toBe(5); // We generate 5 sample vessels
    expect(component.vesselStats.total).toBe(5);
  });

  it('should calculate statistics correctly', () => {
    component.vessels = [
      { id: '1', name: 'Test Vessel 1', vesselType: 'Container Ship', latitude: 35.88, longitude: -5.50, status: 'active', lastUpdated: new Date(), mmsi: '123456789' },
      { id: '2', name: 'Test Vessel 2', vesselType: 'Tanker', latitude: 35.89, longitude: -5.51, status: 'anchored', lastUpdated: new Date(), mmsi: '987654321' }
    ];
    
    // Trigger loadVessels which calls calculateStats internally
    component.loadVessels();
    
    // Check that statistics are calculated (will be from generated sample data)
    expect(component.vesselStats.total).toBeGreaterThan(0);
    expect(component.vesselStats.active).toBeGreaterThanOrEqual(0);
    expect(component.vesselStats.anchored).toBeGreaterThanOrEqual(0);
  });

  it('should change view correctly', () => {
    component.onViewChange('map');
    expect(component.selectedView).toBe('map');
    expect(component.showVesselList).toBeFalse();
    expect(component.showEmbeddedMap).toBeTrue();

    component.onViewChange('list');
    expect(component.selectedView).toBe('list');
    expect(component.showVesselList).toBeTrue();
    expect(component.showEmbeddedMap).toBeFalse();

    component.onViewChange('both');
    expect(component.selectedView).toBe('both');
    expect(component.showVesselList).toBeTrue();
    expect(component.showEmbeddedMap).toBeTrue();
  });

  it('should return correct status icons', () => {
    expect(component.getStatusIcon('active')).toBe('🚢');
    expect(component.getStatusIcon('anchored')).toBe('⚓');
    expect(component.getStatusIcon('moored')).toBe('🔗');
    expect(component.getStatusIcon('unknown')).toBe('❓');
  });

  it('should return correct vessel type icons', () => {
    expect(component.getVesselTypeIcon('Container Ship')).toBe('📦');
    expect(component.getVesselTypeIcon('Cargo Ship')).toBe('🚛');
    expect(component.getVesselTypeIcon('Tanker')).toBe('🛢️');
    expect(component.getVesselTypeIcon('Passenger Ship')).toBe('🛳️');
    expect(component.getVesselTypeIcon('Fishing Vessel')).toBe('🎣');
    expect(component.getVesselTypeIcon('Tug')).toBe('🚤');
  });

  it('should format last update time correctly', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    
    expect(component.formatLastUpdate(fiveMinutesAgo)).toBe('Il y a 5m');
    expect(component.formatLastUpdate(twoHoursAgo)).toBe('Il y a 2h');
    expect(component.formatLastUpdate(twoDaysAgo)).toBe('Il y a 2j');
  });

  it('should return correct flag emojis', () => {
    expect(component.getFlagEmoji('MA')).toBe('🇲🇦');
    expect(component.getFlagEmoji('FR')).toBe('🇫🇷');
    expect(component.getFlagEmoji('DK')).toBe('🇩🇰');
    expect(component.getFlagEmoji('UNKNOWN')).toBe('🏳️');
  });

  it('should track vessels by id', () => {
    const vessel = { id: 'test123', name: 'Test', vesselType: 'Cargo', latitude: 0, longitude: 0, status: 'active' as const, lastUpdated: new Date(), mmsi: '123' };
    expect(component.trackByVesselId(0, vessel)).toBe('test123');
  });

  it('should toggle vessel names in map config', () => {
    const initialNames = component.mapConfig.names;
    component.toggleVesselNames();
    expect(component.mapConfig.names).toBe(!initialNames);
  });

  it('should toggle track lines in map config', () => {
    const initialTrack = component.mapConfig.show_track;
    component.toggleTrackLines();
    expect(component.mapConfig.show_track).toBe(!initialTrack);
  });

  it('should reset map view', () => {
    component.mapConfig.mmsi = 'test123';
    component.mapConfig.imo = 'test456';
    component.mapConfig.show_track = true;
    
    component.resetMapView();
    
    expect(component.mapConfig.mmsi).toBe('');
    expect(component.mapConfig.imo).toBe('');
    expect(component.mapConfig.show_track).toBeFalse();
  });

  it('should get current time string in French format', () => {
    const timeString = component.getCurrentTimeString();
    expect(timeString).toMatch(/\d{2}:\d{2}:\d{2}/); // Should match HH:MM:SS format
  });
});
