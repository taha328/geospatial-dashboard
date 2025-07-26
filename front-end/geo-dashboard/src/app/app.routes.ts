import { Routes } from '@angular/router';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { MapComponent } from './components/map/map.component';
import { VesselFinderComponent } from './components/vessel-finder/vessel-finder.component';
import { AssetManagementComponent } from './components/asset-management/asset-management.component';


export const routes: Routes = [
  { path: '', redirectTo: '/assets', pathMatch: 'full' },
  { path: 'dashboard', redirectTo: '/assets', pathMatch: 'full' },
  { path: 'map', component: MapComponent },
  { path: 'assets', component: AssetManagementComponent },
  { path: 'users', component: UserListComponent },
  { path: 'users/create', component: UserFormComponent },
  { path: 'users/:id', component: UserDetailComponent },
  { path: 'users/:id/edit', component: UserFormComponent },
  { path: 'vessels', component: VesselFinderComponent }
];
