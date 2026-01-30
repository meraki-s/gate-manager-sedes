import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';
import { SwornDeclaration } from 'src/app/providers/models/dashboard.model';
import { DashboardService } from 'src/app/providers/services/dashboard.services';
import { SwornDeclarationService } from 'src/app/providers/services/sworn-declaration.service';

@Component({
  selector: 'app-delete-sworn-declaration',
  templateUrl: './delete-sworn-declaration.component.html',
  styleUrls: ['./delete-sworn-declaration.component.scss'],
})
export class DeleteSwornDeclarationComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  constructor(
    public dialogRef: MatDialogRef<DeleteSwornDeclarationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SwornDeclaration,
    private dialog: MatDialog,
    private swornDeclarationService: SwornDeclarationService,
    private authService: AuthService,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  async delete() {
    try {
      try {
        await this.swornDeclarationService.deleteFileStorage(
          this.data.swornDeclarationFile ? this.data.swornDeclarationFile.fileURL : null
        );
      } catch (error) {
        console.log(error);
      }
      if (this.data) {
        this.authService.user$.pipe(take(1)).subscribe((user) => {
          this.swornDeclarationService
            .deleteSwornDeclaration(user!.providerId, this.data.id)
            .pipe(take(1))
            .subscribe((res) => {
              res
                .commit()
                .then(() => {
                  this.snackbar.open(
                    '✅ Declaración Jurada borrada correctamente',
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
