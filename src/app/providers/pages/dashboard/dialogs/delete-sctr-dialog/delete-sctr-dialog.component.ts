import { Component, Inject, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { SCTR } from 'src/app/providers/models/dashboard.model';
import { DashboardService } from 'src/app/providers/services/dashboard.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-delete-sctr-dialog',
  templateUrl: './delete-sctr-dialog.component.html',
  styleUrls: ['./delete-sctr-dialog.component.scss'],
})
export class DeleteSctrDialogComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  constructor(
    public dialogRef: MatDialogRef<DeleteSctrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SCTR,
    private dialog: MatDialog,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  save(): void {
    try {
      if (this.data) {
        this.authService.user$.pipe(take(1)).subscribe((user) => {
          if (!user) return;

          this.dashboardService
            .sctrDelete(user.providerId, this.data.id)
            .pipe(take(1))
            .subscribe((res) => {
              res
                .commit()
                .then(() => {
                  this.snackbar.open(
                    '✅ SCTR borrado correctamente',
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
        });
      }
    } catch (error: any) {
      console.error(error);
    }
  }
}
