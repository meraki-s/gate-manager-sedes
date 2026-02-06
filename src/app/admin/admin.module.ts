import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { ComponentsModule } from '../shared/components/components.module';
import { MaterialModule } from '../shared/material/material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { SettingsModule } from './pages/settings/settings.module';
import { SearchModule } from './pages/search/search.module';
import { EventHistoryComponent } from './pages/event-history/event-history.component';
import { DisseminationComponent } from './pages/dissemination/dissemination.component';
import { AddDocumentComponent } from './pages/dissemination/dialogs/add-document/add-document.component';
import { EditDocumentComponent } from './pages/dissemination/dialogs/edit-document/edit-document.component';
import { DeleteDocumentComponent } from './pages/dissemination/dialogs/delete-document/delete-document.component';

@NgModule({
  declarations: [AdminComponent, EventHistoryComponent, DisseminationComponent, AddDocumentComponent, EditDocumentComponent, DeleteDocumentComponent],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ComponentsModule,
    MaterialModule,
    ReactiveFormsModule,
    DragDropModule,
    SettingsModule,
    SearchModule,
  ],
})
export class AdminModule {}
