import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DisseminationDocument } from 'src/app/admin/models/dissemination-document.model';
import { DisseminationEvidence } from 'src/app/providers/models/dissemination-evidence.model';
import { SearchService } from 'src/app/admin/services/search.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface DisseminationReviewData {
  document: DisseminationDocument;
  evidence: DisseminationEvidence;
  providerName: string;
  providerRUC: number;
}

@Component({
  selector: 'app-dissemination-review',
  templateUrl: './dissemination-review.component.html',
  styleUrls: ['./dissemination-review.component.scss'],
})
export class DisseminationReviewComponent implements OnInit {
  rejectionForm: FormGroup;
  showRejectionForm = false;
  processing = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DisseminationReviewData,
    private dialogRef: MatDialogRef<DisseminationReviewComponent>,
    private searchService: SearchService,
    private snackbar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.rejectionForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnInit(): void {}

  onApprove(): void {
    if (this.processing) return;

    this.processing = true;
    this.searchService
      .approveDisseminationEvidence(
        this.data.evidence.providerId,
        this.data.evidence.id,
        this.data.providerName,
        this.data.providerRUC
      )
      .then(() => {
        this.snackbar.open('✅ Evidencia aprobada', 'Cerrar', {
          duration: 3000,
        });
        this.dialogRef.close(true);
      })
      .catch((error) => {
        console.error('Error approving evidence:', error);
        this.snackbar.open('😞 Error al aprobar evidencia', 'Cerrar', {
          duration: 3000,
        });
        this.processing = false;
      });
  }

  onReject(): void {
    if (this.showRejectionForm) {
      // Submit rejection
      if (this.rejectionForm.invalid) {
        this.rejectionForm.markAllAsTouched();
        return;
      }

      if (this.processing) return;

      this.processing = true;
      const reason = this.rejectionForm.value.reason;

      this.searchService
        .rejectDisseminationEvidence(
          this.data.evidence.providerId,
          this.data.evidence.id,
          reason,
          this.data.providerName,
          this.data.providerRUC
        )
        .then(() => {
          this.snackbar.open('❌ Evidencia rechazada', 'Cerrar', {
            duration: 3000,
          });
          this.dialogRef.close(true);
        })
        .catch((error) => {
          console.error('Error rejecting evidence:', error);
          this.snackbar.open('😞 Error al rechazar evidencia', 'Cerrar', {
            duration: 3000,
          });
          this.processing = false;
        });
    } else {
      // Show rejection form
      this.showRejectionForm = true;
    }
  }

  onCancelRejection(): void {
    this.showRejectionForm = false;
    this.rejectionForm.reset();
  }

  onClose(): void {
    this.dialogRef.close();
  }

  openDocument(url: string): void {
    window.open(url, '_blank');
  }
}
