import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DisseminationDocument } from '../../../../models/dissemination-document.model';
import { DisseminationService } from '../../../../services/dissemination.service';

@Component({
  selector: 'app-edit-document',
  templateUrl: './edit-document.component.html',
  styleUrls: ['./edit-document.component.scss']
})
export class EditDocumentComponent implements OnInit {
  form: FormGroup;
  updating = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditDocumentComponent>,
    @Inject(MAT_DIALOG_DATA) public document: DisseminationDocument,
    private disseminationService: DisseminationService,
    private snackbar: MatSnackBar
  ) {
    this.form = this.fb.group({
      name: [document.name, [Validators.required, Validators.maxLength(100)]],
      description: [document.description || '', Validators.maxLength(500)],
      required: [document.required]
    });
  }

  ngOnInit(): void {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.snackbar.open('Complete todos los campos requeridos', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    this.updating = true;

    try {
      const formValue = this.form.value;

      await this.disseminationService.updateDisseminationDocument(
        this.document.id,
        formValue.name,
        formValue.description || '',
        formValue.required
      );

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error updating document:', error);
      this.snackbar.open('Error al actualizar documento', 'Cerrar', {
        duration: 3000,
      });
      this.updating = false;
    }
  }
}
