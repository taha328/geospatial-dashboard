import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// Services following monorepo patterns from Copilot instructions
import { KpiService } from './services/kpi.service';

// Import services from existing geospatial project structure
import { UserService } from './services/user.service';
import { VesselService } from './services/vessel.service';
import { MaterialModule } from './shared/material.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';

@NgModule({
  declarations: [
    // All components are now standalone - no declarations needed
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    MaterialModule
    // Routing is handled by standalone app.config.ts
  ],
  providers: [
    KpiService,
    UserService,
    VesselService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
    // Add other services following geospatial dashboard patterns
  ]
  // AppComponent is standalone and the app is bootstrapped via `bootstrapApplication` in main.ts
})
export class AppModule { }