import { Routes } from '@angular/router';
import { RoleGuard } from './services/role.guard';

// Simple guard to allow unauthenticated access to set-password
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable({ providedIn: 'root' })
export class PublicGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    // Always allow access to set-password route
    return true;
  }
}

export const routes: Routes = [
  {
     path: '',
     redirectTo: '/map',
     pathMatch: 'full'
   },
  {
     path: 'dashboard',
     loadComponent: () => import('./components/dashboard-integre/dashboard-integre.component').then(m => m.DashboardIntegreComponent)
   },

  // Lazy load login component
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },

  // Lazy load set-password component for invited users - explicitly allow unauthenticated access
  {
    path: 'set-password',
    loadComponent: () => import('./components/set-password/set-password.component').then(m => m.SetPasswordComponent),
    canActivate: [PublicGuard] // This guard always returns true
  },

  // Lazy load reset-password component for existing users - explicitly allow unauthenticated access
  {
    path: 'reset-password',
    loadComponent: () => import('./components/set-password/set-password.component').then(m => m.SetPasswordComponent),
    canActivate: [PublicGuard] // This guard always returns true
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
    redirectTo: '/map'
  }
];