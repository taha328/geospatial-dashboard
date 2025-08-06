import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AssetManagementRoutingModule } from './asset-management-routing.module';
import { AssetManagementComponent } from '../../components/asset-management/asset-management.component';
import { ActifFormComponent } from '../../components/actif-form/actif-form.component';
import { CreateMaintenanceModalComponent } from '../../components/create-maintenance-modal/create-maintenance-modal.component';
import { CompleteMaintenanceModalComponent } from '../../components/complete-maintenance-modal/complete-maintenance-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AssetManagementRoutingModule,
    // Import standalone components
    AssetManagementComponent,
    ActifFormComponent,
    CreateMaintenanceModalComponent,
    CompleteMaintenanceModalComponent
  ],
  providers: [DatePipe]
})
export class AssetManagementModule { }
