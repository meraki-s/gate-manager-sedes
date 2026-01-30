import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocationsRoutingModule } from './locations-routing.module';
import { LocationsComponent } from './locations.component';
import { MaterialModule } from 'src/app/shared/material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CreateLocationComponent } from './dialogs/create-location/create-location.component';

@NgModule({
  declarations: [LocationsComponent, CreateLocationComponent],
  imports: [
    CommonModule,
    LocationsRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
})
export class LocationsModule {}
