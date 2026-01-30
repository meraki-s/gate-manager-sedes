import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PersonalRoutingModule } from './personal-routing.module';
import { PersonalComponent } from './personal.component';
import { ComponentsModule } from '../shared/components/components.module';
import { AccessControlComponent } from './access-control/access-control.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../shared/material/material.module';
// import { FlexLayoutModule } from '@angular/flex-layout';
import { EntryDialogComponent } from './access-control/entryDialog/entry-dialog/entry-dialog.component';
import { ExtDialogComponent } from './access-control/exitDialog/ext-dialog/ext-dialog.component';


@NgModule({
  declarations: [
    PersonalComponent,
    AccessControlComponent,
    EntryDialogComponent,
    ExtDialogComponent
  ],
  imports: [
    CommonModule,
    PersonalRoutingModule,
    ComponentsModule,
    ReactiveFormsModule,
    MaterialModule,
    // FlexLayoutModule
  ]
})
export class PersonalModule { }
