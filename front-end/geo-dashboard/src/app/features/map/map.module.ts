import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MapRoutingModule } from './map-routing.module';
import { MapComponent } from '../../components/map/map.component';
import { SignalementAnomalieComponent } from '../../components/signalement-anomalie/signalement-anomalie.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MapRoutingModule,
    // Import standalone components
    MapComponent,
    SignalementAnomalieComponent
  ]
})
export class MapModule { }
