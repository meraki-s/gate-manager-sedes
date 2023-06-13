import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../material/material.module';
import { NavigationComponent } from './navigation/navigation.component';
import { UploadFilesComponent } from './upload-files/upload-files.component';
import { DropzoneFileDirective } from './upload-files/dropzoneFile.directive';
import { VisorPdfComponent } from './visor-pdf/visor-pdf.component';
import { UpdateReadyComponent } from './update-ready/update-ready.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@NgModule({
  declarations: [
    NavigationComponent,
    UploadFilesComponent,
    DropzoneFileDirective,
    VisorPdfComponent,
    UpdateReadyComponent,
  ],
  imports: [CommonModule, RouterModule, MaterialModule, PdfViewerModule],
  exports: [
    NavigationComponent,
    DropzoneFileDirective,
    UploadFilesComponent,
    VisorPdfComponent,
  ],
})
export class ComponentsModule {}
