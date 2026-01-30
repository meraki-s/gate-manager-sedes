import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PersonalComponent } from './personal.component';
import { Guard } from '../shared/guard/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: PersonalComponent,
    canActivate: [Guard],
    children: [
      {
        path: 'access-control',
        loadChildren: () =>
          import('./access-control/access-control-routing.module').then(
            (m) => m.accessControlRoutingModule
          ),
      },
      {
        path: 'monitor',
        loadChildren: () =>
          import('./monitor/monitor.module').then((m) => m.MonitorModule),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PersonalRoutingModule {}
