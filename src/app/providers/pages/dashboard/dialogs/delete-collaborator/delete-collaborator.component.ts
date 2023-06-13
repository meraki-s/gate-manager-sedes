import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { Collaborator } from '../../../../models/register-collaborator';
import { DashboardService } from '../../../../services/dashboard.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-delete-collaborator',
  templateUrl: './delete-collaborator.component.html',
  styleUrls: ['./delete-collaborator.component.scss'],
})
export class DeleteCollaboratorComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Collaborator,
    private dashboardService: DashboardService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {}

  save(): void {
    try {
      if (this.data) {
        this.dashboardService
          .deleteCollaborator(this.data.id)
          .pipe(take(1))
          .subscribe((res) => {
            res
              .commit()
              .then(() => {
                this.snackbar.open(
                  '✅ Colaborador borrado correctamente',
                  'Aceptar',
                  {
                    duration: 6000,
                  }
                );
                this.loading.next(false);
                this.dialog.closeAll();
              })
              .catch((err) => {
                this.snackbar.open('🚨 Hubo un error.', 'Aceptar', {
                  duration: 6000,
                });
              });
          });
      }
    } catch (error: any) {
      console.error(error);
    }
  }
}
