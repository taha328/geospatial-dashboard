import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Import non-standalone dashboard component following project structure
import { DashboardIntegreComponent } from './components/dashboard-integre/dashboard-integre.component';

// Services following monorepo patterns from Copilot instructions
import { KpiService } from './services/kpi.service';

// Import services from existing geospatial project structure
import { UserService } from './services/user.service';
import { VesselService } from './services/vessel.service';
import { MaterialModule } from './shared/material.module';

@NgModule({
  declarations: [

    DashboardIntegreComponent // This one is NOT standalone
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    MaterialModule
    // Remove AppComponent from imports - standalone components should not be imported in NgModule
  ],
  providers: [
    KpiService,
    UserService,
    VesselService
    // Add other services following geospatial dashboard patterns
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }