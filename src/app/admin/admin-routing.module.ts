import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Guard } from '../shared/guard/auth.guard';
import { AdminComponent } from './admin.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [Guard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./pages/search/search.module').then((m) => m.SearchModule),
      },
      {
        path: 'search/:ruc',
        loadChildren: () =>
          import('./pages/search/search.module').then((m) => m.SearchModule),
      },
      {
        path: 'search',
        loadChildren: () =>
          import('./pages/search/search.module').then((m) => m.SearchModule),
      },
      {
        path: 'monitor',
        loadChildren: () =>
          import('./pages/monitor/monitor.module').then((m) => m.MonitorModule),
      },
      {
        path: 'access-report',
        loadChildren: () =>
          import('./pages/access-report/access-report.module').then(
            (m) => m.AccessReportModule
          ),
      },
      {
        path: 'events-history',
        loadChildren: () =>
          import('./pages/event-history/event-history.module').then(
            (m) => m.EventHistoryModule
          ),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./pages/users/users.module').then((m) => m.UsersModule),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./pages/settings/settings-routing.module').then(
            (m) => m.SettingsRoutingModule
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
