import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RoleGuard } from './services/role.guard';

export const routes: Routes = [
  {
     path: '',
     redirectTo: '/assets',
     pathMatch: 'full'
   },
  {
     path: 'dashboard',
     redirectTo: '/assets',
     pathMatch: 'full'
   },
  
  // Add the missing login route
  { 
    path: 'login', 
    component: LoginComponent 
  },
  
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
    loadChildren: () => import('./features/user-management/user-management.module').then(m => m.UserManagementModule),
    canActivate: [RoleGuard],
    data: { roles: ['administrateur'] }
  },
  {
    path: 'vessels',
    loadChildren: () => import('./features/vessel-finder/vessel-finder.module').then(m => m.VesselFinderModule)
  },
  {
    path: 'zones',
    loadChildren: () => import('./features/zones/zones.module').then(m => m.ZonesModule)
  },
  {
    path: '**',
    redirectTo: '/assets'
  }
];