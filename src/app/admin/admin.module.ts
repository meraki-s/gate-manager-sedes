import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { ComponentsModule } from '../shared/components/components.module';
import { MaterialModule } from '../shared/material/material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { SettingsModule } from './pages/settings/settings.module';
import { SearchModule } from './pages/search/search.module';
import { EventHistoryComponent } from './pages/event-history/event-history.component';

@NgModule({
  declarations: [AdminComponent, EventHistoryComponent],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ComponentsModule,
    MaterialModule,
    ReactiveFormsModule,
    SettingsModule,
    SearchModule,
  ],
})
export class AdminModule {}
