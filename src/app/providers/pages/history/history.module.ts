import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { MaterialModule } from 'src/app/shared/material/material.module';
import { HistoryRoutingModule } from './history-routing.module';
import { EditVisitDialogComponent } from './dialogs/edit-visit-dialog/edit-visit-dialog.component';
import { CancelDialogComponent } from './dialogs/cancel-dialog/cancel-dialog.component';
import { DeleteDialogComponent } from './dialogs/delete-dialog/delete-dialog.component';


@NgModule({
  declarations: [
  

  
   
  ],
  imports: [
    CommonModule,
    HistoryRoutingModule,
    ComponentsModule,
    MaterialModule
  ]
})
export class HistoryModule { }