import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventHistoryComponent } from './event-history.component';

const routes: Routes = [
  {
    path: '',
    component: EventHistoryComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventHistoryRoutingModule {}
