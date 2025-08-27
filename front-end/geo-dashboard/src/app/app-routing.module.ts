import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Import existing components that stay in app module
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DashboardIntegreComponent } from './components/dashboard-integre/dashboard-integre.component';
import { LoginComponent } from './components/login/login.component';
import { RoleGuard } from './services/role.guard';
import { AuthGuard } from './services/auth.guard';

const routes: Routes = [
  // Default route to integrated dashboard
  { path: '', redirectTo: '/dashboard-integre', pathMatch: 'full' },
  
  // Dashboard routes - keep as direct components (not lazy loaded)
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'dashboard-integre', component: DashboardIntegreComponent, canActivate: [AuthGuard] },
  
  // CORRECTED: Lazy load feature modules, not components
  {
    path: 'map',
    loadChildren: () => import('./features/map/map.module').then(m => m.MapModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'assets',
    loadChildren: () => import('./features/asset-management/asset-management.module').then(m => m.AssetManagementModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadChildren: () => import('./features/user-management/user-management.module').then(m => m.UserManagementModule),
    canActivate: [RoleGuard],
    data: { roles: ['administrateur'] }
  },

  // Login and auth
  { path: 'login', component: LoginComponent },
  {
    path: 'vessels',
    loadChildren: () => import('./features/vessel-finder/vessel-finder.module').then(m => m.VesselFinderModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'zones',
    loadChildren: () => import('./features/zones/zones.module').then(m => m.ZonesModule),
    canActivate: [AuthGuard]
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