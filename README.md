# Geospatial Dashboard

A comprehensive geospatial data management and visualization platform built with NestJS backend and Angular frontend. This application manages and visualizes geospatial data including points, zones, vessels, and maritime assets on an interactive map with user management capabilities.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development Commands](#development-commands)
- [Testing](#testing)
- [Contributing](#contributing)

## 🚀 Project Overview

This monorepo contains two main applications:

- **Backend**: NestJS application with TypeORM, PostgreSQL with PostGIS support
- **Frontend**: Angular 18 application with OpenLayers 7 for interactive mapping

**Key Features:**
- Interactive geospatial map with OpenLayers
- User management with role-based access (admin, user, moderator)
- Asset management (maritime/port assets)
- Vessel tracking and finder
- Point and zone management
- GeoJSON data serialization
- Real-time updates

## 🏗️ Architecture

```
├── back-end/           # NestJS Backend API
│   ├── src/
│   │   ├── point/      # Points management
│   │   ├── zones/      # Zones management
│   │   ├── user/       # User management
│   │   ├── gestion_des_actifs/  # Asset management
│   │   └── migrations/ # Database migrations
├── front-end/          # Angular Frontend
│   └── geo-dashboard/
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/  # UI components
│       │   │   └── services/    # API services
│       │   └── types/  # TypeScript definitions
└── plan/              # Documentation & planning
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v12 or higher)
- **PgAdmin** (for database management)
- **Angular CLI** (v18 or higher)
- **NestJS CLI** (optional, for development)

### Install Required Tools

```powershell
# Install Node.js from https://nodejs.org/
# Install PostgreSQL from https://www.postgresql.org/download/

# Install Angular CLI globally
npm install -g @angular/cli

# Install NestJS CLI globally (optional)
npm install -g @nestjs/cli
```

## 🗄️ Database Setup

### 1. PostgreSQL Installation & Configuration

1. **Download and install PostgreSQL** from [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
2. **Download and install PgAdmin** from [https://www.pgadmin.org/download/](https://www.pgadmin.org/download/)

### 2. Database Creation in PgAdmin

1. **Open PgAdmin** and connect to your PostgreSQL server
2. **Create a new database**:
   - Right-click on "Databases" → "Create" → "Database..."
   - **Database name**: `db`
   - **Owner**: `postgres`
   - Click "Save"

3. **Enable PostGIS Extension**:
   ```sql
   -- Connect to your 'db' database and run this query:
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS postgis_topology;
   ```

### 3. Database Configuration

The application uses the following database configuration:

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `db`
- **Username**: `postgres`
- **Password**: `qawsed?`

> **Note**: You can modify these settings in `back-end/src/app.module.ts` if needed.

## 🔧 Installation & Setup

### 1. Clone the Repository

```powershell
git clone <your-repository-url>
cd project
```

### 2. Install Backend Dependencies

```powershell
cd back-end
npm install
```

### 3. Install Frontend Dependencies

```powershell
cd ../front-end/geo-dashboard
npm install
```

### 4. Install Root Dependencies (if any)

```powershell
cd ../../
npm install
```

## 🚀 Running the Application

### Method 1: Using VS Code Tasks (Recommended)

If you're using VS Code, you can use the predefined tasks:

1. **Press `Ctrl+Shift+P`** and type "Tasks: Run Task"
2. Select from available tasks:
   - `Backend: Start Dev Server`
   - `Frontend: Start Dev Server`
   - `Backend: Install Dependencies`
   - `Frontend: Install Dependencies`

### Method 2: Manual Commands

#### Start the Backend Server

```powershell
cd back-end
npm run start:dev
```

The backend will start on: **http://localhost:3000**

#### Start the Frontend Server

```powershell
# In a new terminal window
cd front-end/geo-dashboard
ng serve
```

The frontend will start on: **http://localhost:4200**

### 5. Database Seeding

The backend automatically seeds the database with initial data on startup. If you need to manually seed:

```powershell
cd back-end
npm run seed
```

## 📁 Project Structure

### Backend Structure (`back-end/`)

```
src/
├── app.module.ts           # Main application module
├── main.ts                 # Application entry point
├── point/                  # Points CRUD operations
├── zones/                  # Zones CRUD operations
├── user/                   # User management
├── gestion_des_actifs/     # Asset management
│   ├── controllers/        # API controllers
│   ├── entities/          # Database entities
│   └── services/          # Business logic
├── migrations/            # Database migrations
├── seed/                  # Database seeding
└── scripts/              # Utility scripts
```

### Frontend Structure (`front-end/geo-dashboard/`)

```
src/
├── app/
│   ├── components/        # Angular components
│   │   ├── map/          # Map-related components
│   │   ├── user-*/       # User management UI
│   │   └── vessel-finder/ # Vessel tracking
│   └── services/         # API integration services
├── types/                # TypeScript definitions
└── styles.scss          # Global styles
```

## 📡 API Documentation

### Main API Endpoints

- **Points**: `http://localhost:3000/points`
- **Zones**: `http://localhost:3000/zones`
- **Users**: `http://localhost:3000/users`
- **Assets**: `http://localhost:3000/actifs`
- **Networks**: `http://localhost:3000/networks`

### API Features

- RESTful API design
- GeoJSON data format support
- CORS enabled for frontend
- Automatic data seeding
- PostGIS integration for spatial queries

## 🛠️ Development Commands

### Backend Commands

```powershell
cd back-end

# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugging
npm run build              # Build for production
npm run start:prod         # Start production build

# Database
npm run seed               # Seed database
npm run db:init            # Initialize database

# Testing & Quality
npm run test               # Run unit tests
npm run test:e2e           # Run e2e tests
npm run lint               # Run linter
```

### Frontend Commands

```powershell
cd front-end/geo-dashboard

# Development
ng serve                   # Start dev server
ng build                   # Build for production
ng build --watch           # Build with file watching

# Testing & Quality
ng test                    # Run unit tests
ng lint                    # Run linter (if configured)

# Code Generation
ng generate component <name>    # Generate component
ng generate service <name>      # Generate service
```

## 🧪 Testing

### Backend Testing

```powershell
cd back-end
npm run test              # Unit tests
npm run test:watch        # Unit tests with watch mode
npm run test:cov          # Unit tests with coverage
npm run test:e2e          # End-to-end tests
```

### Frontend Testing

```powershell
cd front-end/geo-dashboard
ng test                   # Unit tests with Karma
```

## 🌟 Key Features

### Map Features
- **Interactive mapping** with OpenLayers 7
- **Clustering** for better performance
- **Custom popups** and tooltips
- **Drawing and editing** geometries
- **Thematic layers** support
- **ol-ext** integration for advanced controls

### User Management
- **Role-based access control** (admin, user, moderator)
- **User CRUD operations**
- **Authentication support** (JWT ready)

### Asset Management
- **Maritime/port assets** management
- **GPS tracking** capabilities
- **Asset categorization** by families and groups
- **KPI monitoring** and anomaly detection

### Data Management
- **PostGIS** spatial database support
- **GeoJSON** data serialization
- **Automatic migrations** and seeding
- **Real-time updates** capability

## 🔧 Configuration

### Environment Variables

You can create `.env` files for different environments:

**Backend** (`back-end/.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=qawsed?
DB_NAME=db
PORT=3000
```

**Frontend** environment files are in `src/environments/`.

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Ensure PostgreSQL is running
   - Check database credentials in `app.module.ts`
   - Verify database `db` exists

2. **Frontend Can't Connect to Backend**:
   - Ensure backend is running on port 3000
   - Check CORS settings in `main.ts`

3. **PostGIS Extension Missing**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

4. **Port Already in Use**:
   ```powershell
   # Find and kill process using port
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

## 📚 Additional Documentation

- [`MAP_SYSTEM_README.md`](MAP_SYSTEM_README.md) - Detailed map system documentation
- [`USER_MANAGEMENT_README.md`](front-end/geo-dashboard/USER_MANAGEMENT_README.md) - User management flows
- [`GESTION_ACTIFS_README.md`](GESTION_ACTIFS_README.md) - Asset management guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the UNLICENSED License.

---

## Quick Start Summary

```powershell
# 1. Setup database in PgAdmin (create database 'db')
# 2. Install dependencies
cd back-end && npm install
cd ../front-end/geo-dashboard && npm install

# 3. Start both servers
# Terminal 1 (Backend):
cd back-end
npm run start:dev

# Terminal 2 (Frontend):
cd front-end/geo-dashboard
ng serve

# 4. Access the application
# Frontend: http://localhost:4200
# Backend API: http://localhost:3000
```

That's it! Your geospatial dashboard should now be running successfully! 🎉
