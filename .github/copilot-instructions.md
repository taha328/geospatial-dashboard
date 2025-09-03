# Geospatial Dashboard — AI Coding Agent Instructions

## Project Architecture Overview

### Core Technologies
- **Backend**: NestJS (TypeScript), TypeORM, PostgreSQL/PostGIS
- **Frontend**: Angular 18, OpenLayers 10, Standalone Components
- **Geospatial Focus**: Maritime and Port Asset Management

### Key Architectural Patterns

#### Coordinate Systems
- **Database**: EPSG:4326 (WGS84)
- **Map Display**: EPSG:3857 (Web Mercator)
- **Critical**: Always perform coordinate transformations

#### Authentication
- JWT-based with `@Public()` decorator for unprotected routes
- Token management in `sessionStorage`

#### Asset Hierarchy
```
Portefeuille
└── FamilleActif
    └── GroupeActif
        └── Actif (with GPS coordinates)
```

## Essential Developer Workflows

### Backend Commands (Critical for Data Management)
```bash
cd back-end
npm run start:dev          # Hot reload server (port 3000) 
npm run migration:generate # Generate TypeORM migrations
npm run migration:run      # Apply pending migrations
npm run seed              # Populate database with test data

# Asset-specific scripts
npm run create-actifs      # Create GPS-enabled assets
npm run add-actifs         # Add assets to map display
npm run fix-orphans        # Fix orphaned maintenance records
```

### Frontend Commands
```bash
cd front-end/geo-dashboard
ng serve                  # Development server (port 4200)
npm run build:prod        # Production build
npm run deploy            # Build and deploy to Firebase
npm run deploy:preview    # Deploy to preview channel
```

### Cloud Deployment Architecture
- **Backend**: Google Cloud App Engine with Cloud SQL (PostgreSQL)
- **Frontend**: Firebase hosting with SPA rewrites
- **Database**: Cloud SQL with PostGIS extensions
- **Secrets**: Google Secret Manager for sensitive data

## Project-Specific Patterns & Conventions

### Data Flow Architecture (Critical Understanding)
```typescript
// CarteIntegrationService aggregates from multiple services
ActifService + AnomalieService + PortefeuilleService → CarteIntegrationService → Map Display

// DataRefreshService coordinates real-time updates
this.dataRefreshService.dataChanged$.subscribe(() => {
  this.refreshData(true); // Force cache refresh
});
```

### Asset Management Entity Hierarchy
```typescript
// Standard pattern for geospatial entities
@Entity('actifs')
export class Actif {
  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude: number;
  
  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Geometry', 
    srid: 4326, // Always verify SRID for each entity!
    nullable: true
  })
  geometry: any; // For complex shapes (polygons, lines)
}
```

### Angular Standalone Component Pattern
```typescript
// Standard component structure used throughout frontend
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,    // Angular Material (not PrimeNG)
    // Import dependencies directly, no NgModules
  ],
  templateUrl: './example.component.html'
})
```

### Map Integration with OpenLayers (Critical for Spatial Features)
```typescript
// ALWAYS transform coordinates when reading GeoJSON
const features = geoJsonFormat.readFeatures(geojson, {
  dataProjection: 'EPSG:4326',    // Backend projection
  featureProjection: 'EPSG:3857'  // Map display projection
});

// Strip CRS to avoid parser conflicts
geojson = this.stripCrsDeep(geojson);

// Coordinate fallback hierarchy for robustness
const coords = actif.geometry ? 
  extractGeometryCoords(actif.geometry) : 
  [actif.longitude, actif.latitude];
```

### Service Caching Pattern
```typescript
// CarteIntegrationService uses shareReplay for large datasets
private actifsCache$: Observable<ActifPourCarte[]> | null = null;

getActifsForMap(forceRefresh = false): Observable<ActifPourCarte[]> {
  if (forceRefresh || !this.actifsCache$) {
    this.actifsCache$ = this.http.get<ActifPourCarte[]>(`${this.baseUrl}/actifs`).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
  return this.actifsCache$;
}
```

## Integration Points & External Dependencies

### PostGIS Spatial Database
- **Extensions Required**: `CREATE EXTENSION IF NOT EXISTS postgis;`
- **SRID Consistency**: New entities use 4326, legacy zones may use 26191
- **Geometry Types**: Point (lat/lng), Polygon, LineString supported

### Authentication System
```typescript
// JWT globally applied except for @Public() endpoints
// Supports invite tokens, reset tokens, and password-less accounts
// Token validation hierarchy: invite → reset → password-less
```

### Real-time Notifications
```typescript
// DataRefreshService triggers notifications across components
this.dataRefreshService.notifyAnomalieAdded();    // Triggers map refresh
this.dataRefreshService.notifyActifCreated(actif); // Updates asset lists
```

### Production Environment
- **Backend**: `app.yaml` with Cloud SQL unix socket connection
- **Frontend**: Firebase with optimized caching headers
- **Database**: Migrations run automatically when `RUN_MIGRATIONS=true`

## Common Development Scenarios

### Adding New Geospatial Entities
1. Create TypeORM entity with proper SRID (usually 4326)
2. Add service methods for CRUD operations
3. Create CarteIntegration methods for map display
4. Update DataRefreshService notifications
5. Add frontend service with caching

### Debugging Coordinate Issues
```typescript
// Check coordinate transformations
console.log('Backend (EPSG:4326):', geojson);
console.log('Map display (EPSG:3857):', features);

// Validate geometry extents
const extent = geometry.getExtent();
if (extent.some(val => !isFinite(val))) {
  console.error('Invalid geometry extent');
}
```

### Working with Asset Hierarchy
```typescript
// Standard pattern for navigating asset hierarchy
hierarchie.forEach(portefeuille => {
  portefeuille.children?.forEach(famille => {
    famille.children?.forEach(groupe => {
      groupe.children?.forEach(actif => {
        // Process individual assets
      });
    });
  });
});
```

## Key Files & Architecture Points

- **CarteIntegrationService** (`back-end/src/services/`) - Centralizes map data aggregation
- **DataRefreshService** (`front-end/src/app/services/`) - Coordinates real-time updates
- **ActifPourCarte interface** - Specialized map display data structure
- **app.module.ts** - Global JWT guard and database configuration
- **main.ts** - CORS origins and API prefix configuration

## Production Deployment Context

- **Cloud Architecture**: App Engine + Cloud SQL + Firebase + Secret Manager
- **Database Migrations**: Automatic on deployment when `RUN_MIGRATIONS=true`
- **Security**: JWT authentication, CORS restrictions, secret management
- **Monitoring**: Cloud SQL unix sockets, connection pooling, SSL configuration

This system manages complex maritime infrastructure with real-time geospatial visualization. Always consider coordinate system transformations, hierarchical asset relationships, and subject-based reactivity when implementing new features.
