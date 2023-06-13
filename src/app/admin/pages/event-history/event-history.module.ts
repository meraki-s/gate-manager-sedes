import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EventHistoryRoutingModule } from './event-history-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/shared/material/material.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EventHistoryRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule
  ]
})
export class EventHistoryModule { }
