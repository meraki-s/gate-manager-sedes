import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccessReportComponent } from './access-report.component';

const routes: Routes = [
  {
    path: '',
    component: AccessReportComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccessReportRoutingModule { }
