import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RegisterVisitRoutingModule } from './register-visit-routing.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { MaterialModule } from 'src/app/shared/material/material.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RegisterVisitRoutingModule,
    ComponentsModule,
    MaterialModule
  ]
})
export class RegisterVisitModule { }
