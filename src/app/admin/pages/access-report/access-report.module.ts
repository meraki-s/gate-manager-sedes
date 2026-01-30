import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccessReportRoutingModule } from './access-report-routing.module';
import { AccessReportComponent } from './access-report.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/shared/material/material.module';


@NgModule({
  declarations: [
    AccessReportComponent
  ],
  imports: [
    CommonModule,
    AccessReportRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule
  ]
})
export class AccessReportModule { }
