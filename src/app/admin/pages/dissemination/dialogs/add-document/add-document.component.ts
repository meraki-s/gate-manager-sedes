import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DisseminationService } from '../../../../services/dissemination.service';

@Component({
  selector: 'app-add-document',
  templateUrl: './add-document.component.html',
  styleUrls: ['./add-document.component.scss']
})
export class AddDocumentComponent implements OnInit {
  form: FormGroup;
  selectedFile: File | null = null;
  uploading = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddDocumentComponent>,
    private disseminationService: DisseminationService,
    private snackbar: MatSnackBar
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      required: [false]
    });
  }

  ngOnInit(): void {}

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
    if (this.form.invalid || !this.selectedFile) {
      this.snackbar.open('Complete todos los campos requeridos', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.uploading = true;

    try {
      const formValue = this.form.value;

      await this.disseminationService.addDisseminationDocument(
        this.selectedFile,
        formValue.name,
        formValue.description || '',
        formValue.required
      );

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error adding document:', error);
      this.snackbar.open('Error al agregar documento', 'Cerrar', {
        duration: 3000,
      });
      this.uploading = false;
    }
  }

  get fileName(): string {
    return this.selectedFile ? this.selectedFile.name : 'Ningún archivo seleccionado';
  }
}
