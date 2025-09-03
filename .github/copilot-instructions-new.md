````instructions
# AI Coding Assistant Instructions for Geospatial Dashboard

## Project Overview

This is a comprehensive geospatial data management and visualization platform built as a monorepo with:
- **Backend**: NestJS API with TypeORM, PostgreSQL/PostGIS, global JWT authentication
- **Frontend**: Angular 18 with OpenLayers 10 for interactive mapping  
- **Database**: PostgreSQL with PostGIS spatial extensions
- **Key Features**: Maritime asset management, anomaly detection, zone management, role-based access control

## Critical Development Patterns

### Authentication System
```typescript
// Global JWT guard in app.module.ts - ALL endpoints protected by default
{
  provide: APP_GUARD,
  useClass: JwtAuthGuard,
}

// Use @Public() decorator to exempt endpoints from authentication
@Public()
@Get('health')
healthCheck() {
  return { status: 'OK' };
}
```

### PostGIS Geometry Handling 
**CRITICAL**: Mixed SRID usage - new entities use 4326, legacy zones use 26191
```typescript
// NEW standard: SRID 4326 for new entities
@Column({
  type: 'geometry',
  spatialFeatureType: 'Geometry', 
  srid: 4326, // WGS84 - standard for web mapping
  nullable: true 
})
geometry: any;

// LEGACY: Some zones still use SRID 26191 (Merchich)
// Check entity files before assuming SRID!
```

### Environment Configuration Patterns
```typescript
// Backend: Multi-environment config with Cloud SQL support
{
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  // Cloud SQL unix socket format: /cloudsql/PROJECT:REGION:INSTANCE
  extra: process.env.DB_HOST?.startsWith('/cloudsql/') ? {
    socketPath: process.env.DB_HOST
  } : undefined,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
}

// Frontend: Environment-based API routing
export const environment = {
  production: false,
  apiUrl: '/api', // Proxied in development, direct in production
  firebase: { /* Firebase config */ }
};
```

### OpenLayers Integration with ol-ext
```typescript
// PATTERN: Always transform coordinates between EPSG:4326 and EPSG:3857
const features = geoJsonFormat.readFeatures(geojson, {
  dataProjection: 'EPSG:4326',    // Backend storage format
  featureProjection: 'EPSG:3857'  // OpenLayers display format
});

// Use ol-ext animated clustering for performance
this.clusterLayer = new ol_layer_AnimatedCluster({
  source: this.clusterSource,
  style: (feature: FeatureLike) => this.getClusterStyle(feature)
});
```

## Essential Development Commands

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
- **CarteIntegrationService**: Centralizes map data aggregation
- **DataRefreshService**: Subject-based notifications for real-time updates
- **ActifPourCarte interface**: Specialized data structure for map display
- **Global API prefix**: All endpoints use `/api` prefix

### UI Component System
```typescript
// Hybrid Material + PrimeNG pattern
imports: [
  CommonModule,
  MatButtonModule,     // Material components
  PrimeNgModule,       // Unified PrimeNG module  
  UnifiedUIModule      // Project-specific unified theming
]
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

### Error Handling & Coordinate Issues
```typescript
// CRITICAL: Always validate coordinates and handle CRS stripping
geojson = this.stripCrsDeep(geojson); // Remove CRS to avoid parser issues

// Fallback hierarchy for invalid geometry:
// 1. Try parsing geometry with transforms
// 2. Fall back to currentDrawnGeometry 
// 3. Fall back to lat/lng point
// 4. Log error and continue
```

## Integration Points

### Authentication Flow
- JWT tokens stored in localStorage
- Global guard protects all endpoints except `@Public()`
- Role-based access in `roles.guard.ts`
- User module handles authentication state

### Map-Asset Integration  
- `CarteIntegrationController` provides map-specific API endpoints
- Real-time anomaly reporting with coordinates
- Asset status visualization with color coding
- Clustering for performance with large datasets

### Firebase Deployment
- Single-page app rewrites in `firebase.json`
- Optimized caching headers for assets
- Preview channel deployments for testing

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

This project uses a sophisticated hybrid architecture with careful attention to spatial data handling and real-time synchronization. Always verify SRID consistency when working with geometry data.

````
