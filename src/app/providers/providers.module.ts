import { LOCALE_ID, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProvidersRoutingModule } from './providers-routing.module';
import { ProvidersComponent } from './providers.component';
import { ComponentsModule } from '../shared/components/components.module';
import { RegisterVisitComponent } from './pages/register-visit/register-visit.component';
import { MaterialModule } from '../shared/material/material.module';
import { ReactiveFormsModule } from '@angular/forms';
// import { FlexLayoutModule } from '@angular/flex-layout';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AddSctrDialogComponent } from './pages/dashboard/dialogs/add-sctr-dialog/add-sctr-dialog.component';
import { EditSctrDialogComponent } from './pages/dashboard/dialogs/edit-sctr-dialog/edit-sctr-dialog.component';
import { DeleteSctrDialogComponent } from './pages/dashboard/dialogs/delete-sctr-dialog/delete-sctr-dialog.component';
import { EditCollaboratorComponent } from './pages/dashboard/dialogs/edit-collaborator/edit-collaborator.component';
import { RegisterCollaboratorComponent } from './pages/dashboard/dialogs/register-collaborator/register-collaborator.component';
import { AddSegVidaLeyDialogComponent } from './pages/dashboard/dialogs/add-seg-vida-ley-dialog/add-seg-vida-ley-dialog.component';
import { DeleteSwornDeclarationComponent } from './pages/dashboard/dialogs/sworn-declaration/delete-sworn-declaration/delete-sworn-declaration.component';
import { UpdateSwornDeclarationComponent } from './pages/dashboard/dialogs/sworn-declaration/update-sworn-declaration/update-sworn-declaration.component';
import { AddSwornDeclarationComponent } from './pages/dashboard/dialogs/sworn-declaration/add-sworn-declaration/add-sworn-declaration.component';
import { EditSegVidaLeyDialogComponent } from './pages/dashboard/dialogs/edit-seg-vida-ley-dialog/edit-seg-vida-ley-dialog.component';
import { HistoryComponent } from './pages/history/history.component';
import { EditVisitDialogComponent } from './pages/history/dialogs/edit-visit-dialog/edit-visit-dialog.component';
import { CancelDialogComponent } from './pages/history/dialogs/cancel-dialog/cancel-dialog.component';
import { DeleteDialogComponent } from './pages/history/dialogs/delete-dialog/delete-dialog.component';
import { DeleteCollaboratorComponent } from './pages/dashboard/dialogs/delete-collaborator/delete-collaborator.component';
import { DeleteSegVidaLeyDialogComponent } from './pages/dashboard/dialogs/delete-seg-vida-ley-dialog/delete-seg-vida-ley-dialog.component';
import { AtsComponent } from './pages/dashboard/dialogs-validate-documents/ats/ats.component';
import { IpercComponent } from './pages/dashboard/dialogs-validate-documents/iperc/iperc.component';
import { EmergencyComponent } from './pages/dashboard/dialogs-validate-documents/emergency/emergency.component';
import { MsdsComponent } from './pages/dashboard/dialogs-validate-documents/msds/msds.component';
import { PetsComponent } from './pages/dashboard/dialogs-validate-documents/pets/pets.component';
import { CovidComponent } from './pages/dashboard/dialogs-validate-documents/covid/covid.component';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';
import { CertificatesComponent } from './pages/dashboard/dialogs-validate-documents/certificates/certificates.component';
import { ChecklistComponent } from './pages/dashboard/dialogs-validate-documents/checklist/checklist.component';
import { EquipmentsComponent } from './pages/dashboard/dialogs-validate-documents/equipments/equipments.component';
import { UploadEvidenceComponent } from './pages/dashboard/dialogs-dissemination/upload-evidence/upload-evidence.component';

registerLocaleData(localeEsPe, 'es-PE');
@NgModule({
  declarations: [
    ProvidersComponent,
    RegisterVisitComponent,
    RegisterCollaboratorComponent,
    EditCollaboratorComponent,
    DashboardComponent,
    AddSctrDialogComponent,
    EditSctrDialogComponent,
    DeleteSctrDialogComponent,
    AddSwornDeclarationComponent,
    DeleteSwornDeclarationComponent,
    UpdateSwornDeclarationComponent,
    AddSegVidaLeyDialogComponent,
    EditSegVidaLeyDialogComponent,
    HistoryComponent,
    EditVisitDialogComponent,
    CancelDialogComponent,
    DeleteDialogComponent,
    DeleteCollaboratorComponent,
    DeleteSegVidaLeyDialogComponent,
    IpercComponent,
    AtsComponent,
    EmergencyComponent,
    MsdsComponent,
    PetsComponent,
    CovidComponent,
    CertificatesComponent,
    ChecklistComponent,
    EquipmentsComponent,
    UploadEvidenceComponent,
  ],
  imports: [
    CommonModule,
    ProvidersRoutingModule,
    ComponentsModule,
    MaterialModule,
    ReactiveFormsModule,
    // FlexLayoutModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
    { provide: LOCALE_ID, useValue: 'es-PE' },
  ],
})
export class ProvidersModule {}
