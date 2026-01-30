import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProvidersComponent } from './providers.component';
import { Guard } from '../shared/guard/auth.guard';
const routes: Routes = [
  {
    path: '',
    component: ProvidersComponent,
    canActivate:[Guard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./pages/dashboard/dashboard-routing.module').then(
            (m) => m.DashboardRoutingModule
          ),
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/dashboard/dashboard-routing.module').then(
            (m) => m.DashboardRoutingModule
          ),
      },
      {
        path: 'register-visit',
        loadChildren: () =>
          import('./pages/register-visit/register-visit-routing.module').then(
            (m) => m.RegisterVisitRoutingModule
          ),
      },
      {
        path: 'history',
        loadChildren: () =>
          import('./pages/history/history-routing.module').then(
            (m) => m.HistoryRoutingModule
          ),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./pages/profile/profile.module').then(
            (m) => m.ProfileModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProvidersRoutingModule {}
