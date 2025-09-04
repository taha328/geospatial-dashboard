# Geospatial Dashboard — AI Coding Agent Instructions

## Project Architecture Overview

### Core Technologies
- **Backend**: NestJS (TypeScript), TypeORM, PostgreSQL/PostGIS
- **Frontend**: Angular 18, OpenLayers 10, Standalone Components
- **Geospatial Focus**: Maritime and Port Asset Management

### Key Architectural Patterns

#### Coordinate Systems (CRITICAL)
- **Database**: EPSG:4326 (WGS84)
- **Map Display**: EPSG:3857 (Web Mercator)
- **Always perform coordinate transformations** when reading GeoJSON
- **Strip CRS** from GeoJSON to avoid parser conflicts

#### Authentication
- JWT-based with `@Public()` decorator for unprotected routes
- Token management in `sessionStorage`
- Global JWT guard applied by default

#### Asset Hierarchy (CRITICAL)
```
Portefeuille
└── FamilleActif
    └── GroupeActif
        └── Actif (with GPS coordinates)
```

#### Database Schema Patterns
- **Mixed-case column names**: `dateMiseAJour`, `actifId`, `typeInspectionId`
- **Always use explicit column mapping** in TypeORM entities:
```typescript
@Column({ name: 'actifId' })
actifId: number;
```
- **Foreign key relationships** require explicit JoinColumn mapping

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

### Database Setup (CRITICAL)
```bash
# PostgreSQL with PostGIS required
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

## Project-Specific Patterns & Conventions

### Data Flow Architecture (CRITICAL)
```typescript
// CarteIntegrationService aggregates from multiple services
ActifService + AnomalieService + PortefeuilleService → CarteIntegrationService → Map Display

// DataRefreshService coordinates real-time updates
this.dataRefreshService.dataChanged$.subscribe(() => {
  this.refreshData(true); // Force cache refresh
});
```

### Entity Column Mapping Pattern (CRITICAL)
```typescript
@Entity('inspections')
export class Inspection {
  @Column({ name: 'actifId' })
  actifId: number;

  @Column({ name: 'typeInspectionId' })
  typeInspectionId: number;

  @CreateDateColumn({ name: 'dateCreation' })
  dateCreation: Date;

  @UpdateDateColumn({ name: 'dateMiseAJour' })
  dateMiseAJour: Date;

  // Foreign key relationships require explicit JoinColumn
  @ManyToOne(() => Actif, actif => actif.inspections)
  @JoinColumn({ name: 'actifId' })
  actif: Actif;
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

### Map Integration with OpenLayers (CRITICAL)
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

### File Upload Pattern (CRITICAL)
```typescript
// Google Cloud Storage with JSON URL storage
@Column('json', { nullable: true })
photosRapport: any;  // Stores array of GCS URLs

// File upload handling in controller
@Post('avec-fichiers')
async uploadWithFiles(
  @Body() createInspectionDto: CreateInspectionDto,
  @UploadedFiles() files: Express.Multer.File[]
) {
  // Process files to GCS, store URLs in JSON column
}
```

## Integration Points & External Dependencies

### PostGIS Spatial Database
- **Extensions Required**: `CREATE EXTENSION IF NOT EXISTS postgis;`
- **SRID Consistency**: New entities use 4326, legacy zones may use 26191
- **Geometry Types**: Point (lat/lng), Polygon, LineString, MultiPolygon supported

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

### Custom OpenLayers Controls
```typescript
// LayerSwitcher customization (160px width, disabled trash, layer type colors)
const layerSwitcher = new ol_control_LayerSwitcher({
  // Custom styling and behavior
});

// Checkbox styling (20px scale, blue accent)
.ol-visibility {
  transform: scale(1.3);
  accent-color: #3498db;
}
```

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

### File Upload Implementation
```typescript
// Controller pattern for file uploads
@Post('avec-fichiers')
@UseInterceptors(FilesInterceptor('files'))
async uploadWithFiles(
  @Body() dto: CreateInspectionDto,
  @UploadedFiles() files: Express.Multer.File[]
) {
  const uploadedUrls = await this.uploadService.uploadToGCS(files);
  dto.photosRapport = uploadedUrls;
  return this.inspectionService.create(dto);
}
```

## Key Files & Architecture Points

- **CarteIntegrationService** (`back-end/src/services/`) - Centralizes map data aggregation
- **DataRefreshService** (`front-end/src/app/services/`) - Coordinates real-time updates
- **Inspection Entity** (`back-end/src/gestion_des_actifs/entities/inspection.entity.ts`) - Column mapping example
- **LayerSwitcher Control** (`front-end/src/app/components/map/ol_control_LayerSwitcher.ts`) - Custom OpenLayers control
- **Main Application Module** (`back-end/src/app.module.ts`) - Global JWT guard and database config
- **Main Server** (`back-end/src/main.ts`) - CORS origins and API prefix configuration

## Production Deployment Context

- **Cloud Architecture**: App Engine + Cloud SQL + Firebase + Secret Manager
- **Database Migrations**: Automatic on deployment when `RUN_MIGRATIONS=true`
- **Security**: JWT authentication, CORS restrictions, secret management
- **Monitoring**: Cloud SQL unix sockets, connection pooling, SSL configuration

## Critical Reminders

- **Always verify SRID** for new geospatial entities (4326 standard)
- **Explicit column mapping** required for mixed-case PostgreSQL columns
- **Coordinate transformations** mandatory for GeoJSON/map display
- **Strip CRS** from GeoJSON to prevent parsing errors
- **Global JWT guard** active by default - use `@Public()` for unprotected routes
- **File uploads** store GCS URLs in JSON columns
- **LayerSwitcher** customized to 160px width with disabled trash buttons

This system manages complex maritime infrastructure with real-time geospatial visualization. Always consider coordinate system transformations, hierarchical asset relationships, and subject-based reactivity when implementing new features.
