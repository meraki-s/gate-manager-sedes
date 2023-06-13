import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { MaterialModule } from 'src/app/shared/material/material.module';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({

  declarations: [ ],
  imports: [
    CommonModule,
    MaterialModule,
    DashboardRoutingModule,
    ReactiveFormsModule,
  ],
})
export class DashboardModule { }

