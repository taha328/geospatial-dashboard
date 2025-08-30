import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SetPasswordComponent } from './components/set-password/set-password.component';
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

  // Add set-password route for invited users - explicitly allow unauthenticated access
  {
    path: 'set-password',
    component: SetPasswordComponent,
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
    redirectTo: '/assets'
  }
];