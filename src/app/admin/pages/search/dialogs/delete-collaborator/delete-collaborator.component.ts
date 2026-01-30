import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SearchService } from 'src/app/admin/services/search.service';

@Component({
  selector: 'app-delete-collaborator',
  templateUrl: './delete-collaborator.component.html',
  styleUrls: ['./delete-collaborator.component.scss'],
})
export class DeleteCollaboratorComponent {
  constructor(
    private searchService: SearchService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DeleteCollaboratorComponent>
  ) {}

  deleteCollaborator(): void {
    this.searchService.deleteCollaboratorFromAdmin(
      this.data.collaborator.id,
      this.data.providerId
    );

    this.dialogRef.close(true);
  }
}
