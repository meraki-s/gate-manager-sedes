import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { DisseminationService } from '../../services/dissemination.service';
import { DisseminationDocument } from '../../models/dissemination-document.model';
import { AddDocumentComponent } from './dialogs/add-document/add-document.component';
import { EditDocumentComponent } from './dialogs/edit-document/edit-document.component';
import { DeleteDocumentComponent } from './dialogs/delete-document/delete-document.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-dissemination',
  templateUrl: './dissemination.component.html',
  styleUrls: ['./dissemination.component.scss'],
})
export class DisseminationComponent implements OnInit, OnDestroy {
  documents: DisseminationDocument[] = [];
  loading = false;
  private subscription = new Subscription();

  constructor(
    private disseminationService: DisseminationService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Load all dissemination documents
   */
  loadDocuments(): void {
    this.loading = true;
    this.subscription.add(
      this.disseminationService.getAllDisseminationDocuments().subscribe(
        (documents) => {
          this.documents = documents;
          this.loading = false;
        },
        (error) => {
          console.error('Error loading documents:', error);
          this.snackbar.open('Error al cargar documentos', 'Cerrar', {
            duration: 3000,
          });
          this.loading = false;
        }
      )
    );
  }

  /**
   * Open dialog to add new document
   */
  onAddDocument(): void {
    const dialogRef = this.dialog.open(AddDocumentComponent, {
      width: '600px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackbar.open('✅ Documento agregado exitosamente', 'Cerrar', {
          duration: 3000,
        });
      }
    });
  }

  /**
   * Open dialog to edit document
   */
  onEditDocument(document: DisseminationDocument): void {
    const dialogRef = this.dialog.open(EditDocumentComponent, {
      width: '600px',
      data: document,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackbar.open(
          '✅ Documento actualizado exitosamente',
          'Cerrar',
          {
            duration: 3000,
          }
        );
      }
    });
  }

  /**
   * Open dialog to confirm delete
   */
  onDeleteDocument(document: DisseminationDocument): void {
    const dialogRef = this.dialog.open(DeleteDocumentComponent, {
      width: '500px',
      data: document,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackbar.open('✅ Documento eliminado exitosamente', 'Cerrar', {
          duration: 3000,
        });
      }
    });
  }

  /**
   * Handle drag and drop to reorder documents
   */
  onDrop(event: CdkDragDrop<DisseminationDocument[]>): void {
    moveItemInArray(this.documents, event.previousIndex, event.currentIndex);

    // Update order in database
    this.disseminationService
      .reorderDocuments(this.documents)
      .then(() => {
        this.snackbar.open('✅ Orden actualizado', 'Cerrar', {
          duration: 2000,
        });
      })
      .catch((error) => {
        console.error('Error reordering:', error);
        this.snackbar.open('Error al actualizar orden', 'Cerrar', {
          duration: 3000,
        });
        // Reload to restore correct order
        this.loadDocuments();
      });
  }

  /**
   * View document PDF
   */
  viewDocument(document: DisseminationDocument): void {
    window.open(document.fileURL, '_blank');
  }
}
