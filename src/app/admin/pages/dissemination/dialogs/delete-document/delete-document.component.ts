import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DisseminationDocument } from '../../../../models/dissemination-document.model';
import { DisseminationService } from '../../../../services/dissemination.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-delete-document',
  templateUrl: './delete-document.component.html',
  styleUrls: ['./delete-document.component.scss']
})
export class DeleteDocumentComponent {
  deleting = false;

  constructor(
    public dialogRef: MatDialogRef<DeleteDocumentComponent>,
    @Inject(MAT_DIALOG_DATA) public document: DisseminationDocument,
    private disseminationService: DisseminationService,
    private snackbar: MatSnackBar
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.deleting = true;
    this.disseminationService
      .deleteDisseminationDocument(this.document)
      .then(() => {
        this.dialogRef.close(true);
      })
      .catch((error) => {
        console.error('Error deleting document:', error);
        this.snackbar.open('Error al eliminar documento', 'Cerrar', {
          duration: 3000,
        });
        this.deleting = false;
      });
  }
}
