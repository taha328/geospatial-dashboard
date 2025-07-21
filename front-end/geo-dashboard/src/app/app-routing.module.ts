import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Import existing components following geospatial dashboard structure
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DashboardIntegreComponent } from './components/dashboard-integre/dashboard-integre.component';

const routes: Routes = [
  // Default route to integrated dashboard
  { path: '', redirectTo: '/dashboard-integre', pathMatch: 'full' },
  
  // Dashboard routes following project conventions
  { path: 'dashboard', component: DashboardComponent },
  { path: 'dashboard-integre', component: DashboardIntegreComponent },
  
  // Map routes - using OpenLayers 7 + ol-ext as specified
  {
    path: 'map',
    loadChildren: () => import('./components/map/map.component').then(m => ({ default: m.MapComponent }))
  },

  // Vessel tracking routes
  {
    path: 'vessels',
    loadChildren: () => import('./components/vessel-finder/vessel-finder.component').then(m => ({ default: m.VesselFinderComponent }))
  },
  
  // Point and zone management through map interface
  {
    path: 'points',
    loadChildren: () => import('./components/map/map.component').then(m => ({ default: m.MapComponent })),
    data: { mode: 'points' }
  },
  
  {
    path: 'zones', 
    loadChildren: () => import('./components/map/map.component').then(m => ({ default: m.MapComponent })),
    data: { mode: 'zones' }
  },
  
  // Fallback route
  { path: '**', redirectTo: '/dashboard-integre' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // Following Angular 18 best practices
    enableTracing: false,
    scrollPositionRestoration: 'top',
    paramsInheritanceStrategy: 'emptyOnly'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }