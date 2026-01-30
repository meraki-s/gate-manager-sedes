import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegisterVisitComponent } from './register-visit.component';

const routes: Routes = [
  {
    path: '',
    component: RegisterVisitComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegisterVisitRoutingModule { }
