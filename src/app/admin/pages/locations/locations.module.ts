import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocationsRoutingModule } from './locations-routing.module';
import { LocationsComponent } from './locations.component';
import { MaterialModule } from 'src/app/shared/material/material.module';

@NgModule({
  declarations: [LocationsComponent],
  imports: [CommonModule, LocationsRoutingModule, MaterialModule],
})
export class LocationsModule {}
