import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { UsersComponent } from './users.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/shared/material/material.module';
import { CreateUserComponent } from './dialogs/create-user/create-user.component';
import { DeleteUserComponent } from './dialogs/delete-user/delete-user.component';


@NgModule({
  declarations: [
    UsersComponent,
    CreateUserComponent,
    DeleteUserComponent
  ],
  imports: [
    CommonModule,
    UsersRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule
  ]
})
export class UsersModule { }
