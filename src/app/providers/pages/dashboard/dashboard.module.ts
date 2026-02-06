import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { MaterialModule } from 'src/app/shared/material/material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { CertificatesComponent } from './dialogs-validate-documents/certificates/certificates.component';
import { ChecklistComponent } from './dialogs-validate-documents/checklist/checklist.component';
import { EquipmentsComponent } from './dialogs-validate-documents/equipments/equipments.component';
import { UploadEvidenceComponent } from './dialogs-dissemination/upload-evidence/upload-evidence.component';

@NgModule({
  declarations: [
  
    UploadEvidenceComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    DashboardRoutingModule,
    ReactiveFormsModule
  ],
})
export class DashboardModule {}

