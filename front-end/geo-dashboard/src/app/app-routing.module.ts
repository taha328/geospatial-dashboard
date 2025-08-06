import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Import existing components that stay in app module
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DashboardIntegreComponent } from './components/dashboard-integre/dashboard-integre.component';

const routes: Routes = [
  // Default route to integrated dashboard
  { path: '', redirectTo: '/dashboard-integre', pathMatch: 'full' },
  
  // Dashboard routes - keep as direct components (not lazy loaded)
  { path: 'dashboard', component: DashboardComponent },
  { path: 'dashboard-integre', component: DashboardIntegreComponent },
  
  // CORRECTED: Lazy load feature modules, not components
  {
    path: 'map',
    loadChildren: () => import('./features/map/map.module').then(m => m.MapModule)
  },
  {
    path: 'assets',
    loadChildren: () => import('./features/asset-management/asset-management.module').then(m => m.AssetManagementModule)
  },
  {
    path: 'users',
    loadChildren: () => import('./features/user-management/user-management.module').then(m => m.UserManagementModule)
  },
  {
    path: 'vessels',
    loadChildren: () => import('./features/vessel-finder/vessel-finder.module').then(m => m.VesselFinderModule)
  },
  {
    path: 'zones',
    loadChildren: () => import('./features/zones/zones.module').then(m => m.ZonesModule)
  },
  
  // Fallback route
  { path: '**', redirectTo: '/dashboard-integre' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    scrollPositionRestoration: 'top',
    paramsInheritanceStrategy: 'emptyOnly'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }