# Geospatial Dashboard — AI Coding Agent Instructions

## Project Architecture & Key Concepts

- **Monorepo**: Contains `back-end` (NestJS, TypeORM, PostgreSQL/PostGIS) and `front-end/geo-dashboard` (Angular 18, OpenLayers 10, ol-ext, standalone components).
- **Major Domains**: Points, Zones, Users, Maritime Assets (Actifs), Anomalies, Maintenance, Authentication, Map Integration.
- **Data Flow**: Backend exposes RESTful APIs (GeoJSON for spatial data); frontend consumes via Angular services. Real-time updates via `DataRefreshService` subject-based notifications.
- **SRID Handling**: New entities use SRID 4326 (WGS84); legacy zones may use SRID 26191 (Merchich). Always check entity definitions before geometry operations.
- **Authentication**: Global JWT guard (`JwtAuthGuard` in `app.module.ts`). Use `@Public()` decorator to exempt endpoints. Frontend supports role-based UI and API calls.

## Developer Workflows

### Backend Commands
```bash
cd back-end
npm run start:dev          # Hot reload development server (port 3000)
npm run migration:generate # Generate TypeORM migrations  
npm run migration:run      # Apply migrations
npm run seed               # Seed database with initial data

# Specific data management scripts
npm run create-actifs      # Create GPS-enabled assets
npm run add-actifs         # Add assets to map display
npm run fix-orphans        # Fix orphaned maintenance records
```

### Frontend Commands  
```bash
cd front-end/geo-dashboard
ng serve                   # Development server (port 4200)
npm run build:prod         # Production build
npm run deploy             # Build and deploy to Firebase
npm run deploy:preview     # Deploy to preview channel
```

### Cloud Deployment
```bash
# Backend (Google Cloud App Engine)
npm run gcp-build          # Cloud build script
gcloud app deploy app.yaml # Deploy to App Engine

# Database migrations on Cloud SQL
export RUN_MIGRATIONS=true # Set in app.yaml env_variables
```

## Project-Specific Conventions

### Data Flow Architecture
- **CarteIntegrationService**: Centralizes map data aggregation from multiple backend services
- **DataRefreshService**: Subject-based notifications for real-time updates across components
- **ActifPourCarte interface**: Specialized data structure for map display with geometry handling
- **Global API prefix**: All endpoints use `/api` prefix, carte endpoints use `/carte` prefix

### Authentication & Password Management
```typescript
// Backend supports both invite and reset token workflows
// AuthService.setPassword() handles both scenarios automatically
this.authService.setPassword(email, password, token).subscribe(...)
this.authService.resetPassword(email, password, token).subscribe(...) // Alias method

// Token validation hierarchy: invite token → reset token → password-less accounts
```

### UI Component System
```typescript
// Hybrid Material + Standalone Components pattern
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,     // Material components
    // No PrimeNG - project uses Material Design + Tailwind
  ],
  templateUrl: './example.component.html'
})
```

### Database Patterns
```typescript
// Standard entity pattern with PostGIS
@Entity('actifs')
export class Actif {
  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude: number;
  
  @Column('decimal', { precision: 10, scale: 6, nullable: true })  
  longitude: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Geometry',
    srid: 4326, // Verify SRID for your entity!
    nullable: true 
  })
  geometry: any;
}
```

### Map Integration Patterns
```typescript
// OpenLayers with coordinate transformation (CRITICAL)
const features = geoJsonFormat.readFeatures(geojson, {
  dataProjection: 'EPSG:4326',    // Backend/database projection
  featureProjection: 'EPSG:3857'  // Map display projection
});

// Always strip CRS to avoid parser issues
geojson = this.stripCrsDeep(geojson);

// Real-time map updates via DataRefreshService
this.dataRefreshService.dataChanged$.subscribe(() => {
  this.refreshData(true); // Force refresh
});
```

## Integration Points & External Dependencies

### PostGIS & Spatial Data
- Enable PostGIS extensions: `CREATE EXTENSION IF NOT EXISTS postgis;`
- TypeORM geometry columns with SRID validation
- Coordinate fallback hierarchy: geometry → lat/lng → currentDrawnGeometry

### Frontend/Backend Communication
- RESTful APIs with specialized carte endpoints (`/carte/actifs`, `/carte/anomalies`)
- GeoJSON serialization with CRS stripping
- In-memory caching via RxJS `shareReplay` for large datasets

### Firebase Deployment
- Single-page app rewrites in `firebase.json`
- Optimized caching headers for assets
- Preview channel deployments for testing

### Real-time Data Flow
```typescript
// CarteIntegrationService aggregates data from multiple sources
// ActifService + AnomalieService + PortefeuilleService → Map display
// DataRefreshService coordinates updates across components
```

## Common Debugging Scenarios

### PostGIS Issues
```sql
-- Check PostGIS extension is enabled
SELECT PostGIS_Version();

-- Verify SRID consistency
SELECT DISTINCT ST_SRID(geometry) FROM actifs;
```

### CORS Configuration
```typescript
// main.ts - Update origins for new domains
app.enableCors({
  origin: [
    'http://localhost:4200',
    'https://integrated-hawk-466115-q5.web.app',
    'https://geodashboard.site'
  ]
});
```

### Coordinate Transform Errors
```typescript
// Debug coordinate transformations
console.log('Backend geometry (EPSG:4326):', geojson);
console.log('Transformed for display (EPSG:3857):', features);

// Check for invalid extents
const extent = geometry.getExtent();
if (extent.some(val => !isFinite(val))) {
  console.error('Invalid extent detected:', extent);
}
```

### Authentication Flow Debugging
```typescript
// Backend logs token validation with detailed context
console.log('🔍 AuthService.setPassword - Received DTO:', {
  email: dto.email,
  hasToken: !!dto.token,
  tokenLength: dto.token?.length
});

// Frontend persists tokens in sessionStorage for recovery
sessionStorage.setItem('invite_token', token);
```

## Key Files & Documentation

- `README.md` — Architecture, setup, workflows
- `MAP_SYSTEM_README.md` — Map system, backend/frontend integration  
- `CARTE_INTEGRATION_README.md` — Map/asset/anomaly integration patterns
- `GESTION_ACTIFS_README.md` — Asset management hierarchy and API
- `back-end/src/carte-integration/` — Map-specific controllers and services
- `front-end/src/app/services/carte-integration.service.ts` — Frontend map data service
- `front-end/src/app/components/map/map.component.ts` — Main map component with OpenLayers

## Essential Development Context

This project implements a sophisticated geospatial asset management system with:

1. **Hierarchical Asset Management**: Portefeuille → FamilleActif → GroupeActif → Actif
2. **Real-time Map Integration**: Assets, anomalies, and KPIs visualized on OpenLayers map
3. **Dual Coordinate Systems**: Database in EPSG:4326, display in EPSG:3857
4. **Subject-based Reactivity**: DataRefreshService coordinates updates across components
5. **Hybrid Authentication**: Invite tokens + reset tokens + password-less account handling
6. **Production Cloud Deployment**: Google Cloud App Engine + Firebase hosting

Always verify SRID consistency when working with geometry data, and use the CarteIntegrationService as the single source of truth for map data aggregation.
