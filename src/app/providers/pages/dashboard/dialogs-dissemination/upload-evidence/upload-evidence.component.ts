import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DisseminationDocument } from 'src/app/admin/models/dissemination-document.model';
import { DisseminationEvidence } from 'src/app/providers/models/dissemination-evidence.model';
import { DisseminationEvidenceService } from 'src/app/providers/services/dissemination-evidence.service';
import { AuthService } from 'src/app/auth/services/auth.service';
import { take } from 'rxjs/operators';

export interface UploadEvidenceDialogData {
  document: DisseminationDocument;
  existingEvidence?: DisseminationEvidence;
  providerId: string;
  providerName: string;
  providerRUC: number;
}

@Component({
  selector: 'app-upload-evidence',
  templateUrl: './upload-evidence.component.html',
  styleUrls: ['./upload-evidence.component.scss']
})
export class UploadEvidenceComponent implements OnInit {
  selectedFile: File | null = null;
  uploading = false;
  isUpdate = false;

  constructor(
    public dialogRef: MatDialogRef<UploadEvidenceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UploadEvidenceDialogData,
    private disseminationEvidenceService: DisseminationEvidenceService,
    private authService: AuthService,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isUpdate = !!this.data.existingEvidence;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (file.type !== 'application/pdf') {
        this.snackbar.open('Solo se permiten archivos PDF', 'Cerrar', {
          duration: 3000,
        });
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        this.snackbar.open('El archivo no debe superar los 10MB', 'Cerrar', {
          duration: 3000,
        });
        return;
      }

      this.selectedFile = file;
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSubmit(): Promise<void> {
    if (!this.selectedFile) {
      this.snackbar.open('Debe seleccionar un archivo PDF', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.uploading = true;

    try {
      const user = await this.authService.user$.pipe(take(1)).toPromise();

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const shortUser = {
        displayName: user.name + ' ' + user.lastname,
        uid: user.uid,
      };

      if (this.isUpdate && this.data.existingEvidence) {
        // Update existing evidence
        await this.disseminationEvidenceService.updateEvidence(
          this.data.providerId,
          this.data.existingEvidence.id,
          this.selectedFile,
          shortUser
        );
      } else {
        // Upload new evidence
        await this.disseminationEvidenceService.uploadEvidence(
          this.data.providerId,
          this.data.document,
          this.selectedFile,
          this.data.providerName,
          this.data.providerRUC,
          shortUser
        );
      }

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error uploading evidence:', error);
      this.snackbar.open('Error al subir evidencia', 'Cerrar', {
        duration: 3000,
      });
      this.uploading = false;
    }
  }

  get fileName(): string {
    if (this.selectedFile) {
      return this.selectedFile.name;
    }
    if (this.isUpdate && this.data.existingEvidence) {
      return this.data.existingEvidence.evidenceFileName;
    }
    return 'Ningún archivo seleccionado';
  }
}
