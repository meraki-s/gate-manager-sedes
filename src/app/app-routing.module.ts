import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
  },
  {
    path: 'providers',
    loadChildren: () => import('./providers/providers.module').then(m => m.ProvidersModule),
  },
  {
    path: 'personal',
    loadChildren: () => import('./personal/personal.module').then(m => m.PersonalModule),
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  // { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
