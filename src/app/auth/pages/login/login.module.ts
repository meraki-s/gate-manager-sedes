import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';
import { MaterialModule } from 'src/app/shared/material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RegisterComponent } from '../register/register.component';
// import { FlexLayoutModule } from '@angular/flex-layout';


@NgModule({
  declarations: [
    LoginComponent,
    // RegisterComponent
  ],
  imports: [
    CommonModule,
    LoginRoutingModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule
  ]
})
export class LoginModule { }
