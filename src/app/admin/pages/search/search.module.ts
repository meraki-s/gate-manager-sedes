import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchRoutingModule } from './search-routing.module';
import { SearchComponent } from './search.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/shared/material/material.module';
import { RejectedDescriptionComponent } from './dialogs/rejected-description/rejected-description.component';
import { DeleteCollaboratorComponent } from './dialogs/delete-collaborator/delete-collaborator.component';

@NgModule({
  declarations: [SearchComponent, RejectedDescriptionComponent, DeleteCollaboratorComponent],
  imports: [
    CommonModule,
    SearchRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
  ],
})
export class SearchModule {}
