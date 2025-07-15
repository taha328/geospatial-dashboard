# Copilot Instructions for Geospatial Dashboard

## Project Overview
- **Monorepo** with two main apps:
  - **Backend**: `back-end/` (NestJS, TypeORM, PostgreSQL, GeoJSON)
  - **Frontend**: `front-end/geo-dashboard/` (Angular 18, OpenLayers 7, ol-ext)
- Purpose: Manage and visualize geospatial data (points, zones, vessels) on an interactive map with user management.

## Architecture & Data Flow
- **Backend** exposes REST APIs for points, zones, and users. Entities: `point`, `zone`, `user`.
  - Example: `back-end/src/point/point.controller.ts`, `back-end/src/zones/zones.controller.ts`
  - Uses PostgreSQL with PostGIS (see `AddPostGISSupport.ts` migration).
  - CORS enabled for frontend at `http://localhost:4200`.
- **Frontend** consumes backend APIs via Angular services (see `src/app/services/`).
  - Map logic in `src/app/components/map/`.
  - User management in `src/app/components/user-*` and `services/user.service.ts`.
  - Vessel tracking in `src/app/components/vessel-finder/` and `services/vessel.service.ts`.
  - Uses `ol-ext` for advanced map controls (see `src/types/ol-ext.d.ts`).

## Developer Workflows
- **Backend**
  - Install: `cd back-end && npm install`
  - Start (dev): `npm run start:dev`
  - Test: `npm run test` (unit), `npm run test:e2e` (e2e)
  - Lint: `npx eslint .`
  - DB: PostgreSQL on `localhost:5432`, DB name `db`, user `postgres`, password `qawsed?`
  - Seed data: see `src/seed/seed.service.ts`
- **Frontend**
  - Install: `cd front-end/geo-dashboard && npm install`
  - Install map libs: `npm install ol ol-ext`
  - Start: `ng serve` (runs at `http://localhost:4200`)
  - Test: `ng test`
  - Build: `ng build`

## Project Conventions & Patterns
- **Backend**
  - Follows NestJS module/service/controller/entity structure.
  - Geo data serialized as GeoJSON.
  - Migration for PostGIS: `src/migrations/AddPostGISSupport.ts`.
  - Test data and seeding: `src/seed/`.
- **Frontend**
  - Angular feature modules for map, user management, and vessel tracking.
  - Map features: clustering, popups, thematic layers, drawing/editing geometries.
  - Vessel finder: search, filter, track vessels with real-time updates.
  - User roles: admin, user, moderator (see `USER_MANAGEMENT_README.md`).
  - Responsive, Bootstrap-inspired UI.
  - API endpoints and integration described in `USER_MANAGEMENT_README.md` and `MAP_SYSTEM_README.md`.

## Integration Points
- **API URLs**: Frontend expects backend at `http://localhost:3000`.
- **CORS**: Configured in backend `main.ts`.
- **Map**: Uses OpenLayers + ol-ext, with custom controls in `map/`.
- **User Management**: CRUD via REST, role-based UI.

## Key References
- `MAP_SYSTEM_README.md`: Big-picture, architecture, setup, and usage.
- `USER_MANAGEMENT_README.md`: User management flows, roles, endpoints.
- `back-end/README.md`, `front-end/geo-dashboard/README.md`: Build/test commands.
- `src/app/components/`, `src/app/services/`: Main Angular features.
- `back-end/src/point/`, `back-end/src/zones/`: Main backend features.

## Example: Adding a New Geometry Type
1. Backend: Add entity/service/controller in `back-end/src/`.
2. Frontend: Add service method, update map component, add UI controls.
3. Update API docs in `MAP_SYSTEM_README.md` if needed.

---
For more, see the project READMEs and code comments. When in doubt, follow the structure and patterns in the existing modules/services/components.
