import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DownloadsComponent } from './downloads.component';
import { DownloadsRoutingModule } from './downloads-routing.module';
import { MaterialModule } from '../../../shared/material/material.module';

@NgModule({
  declarations: [DownloadsComponent],
  imports: [CommonModule, DownloadsRoutingModule, MaterialModule],
})
export class DownloadsModule {}
