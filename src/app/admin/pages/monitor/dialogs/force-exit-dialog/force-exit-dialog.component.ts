import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ForceExitDialogData {
  name: string;
  lastname: string;
  dni: string;
  companyName: string;
}

@Component({
  selector: 'app-force-exit-dialog',
  templateUrl: './force-exit-dialog.component.html',
  styleUrls: ['./force-exit-dialog.component.scss']
})
export class ForceExitDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ForceExitDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ForceExitDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
