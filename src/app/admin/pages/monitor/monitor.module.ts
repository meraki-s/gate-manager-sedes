import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonitorRoutingModule } from './monitor-routing.module';
import { MonitorComponent } from './monitor.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material/material.module';
import { ForceExitDialogComponent } from './dialogs/force-exit-dialog/force-exit-dialog.component';

@NgModule({
  declarations: [MonitorComponent, ForceExitDialogComponent],
  imports: [
    CommonModule,
    MonitorRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
})
export class MonitorModule {}
