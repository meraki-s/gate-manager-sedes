import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { UsersService } from 'src/app/admin/services/users.service';

import { User } from '../../../../../auth/models/user.model';

@Component({
  selector: 'app-delete-user',
  templateUrl: './delete-user.component.html',
  styleUrls: ['./delete-user.component.scss'],
})
export class DeleteUserComponent implements OnInit {
  //#region observables
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  //#endregion

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: User,
    private usersService: UsersService,
    private snackbar: MatSnackBar,
    private dialogRef: MatDialogRef<DeleteUserComponent>
  ) {}

  ngOnInit(): void {}

  delete(): void {
    this.loading.next(true);
    this.usersService.deleteUser(this.data.uid).subscribe((res) => {
      if (res.ok) {
        this.loading.next(false);
        this.snackbar.open('✅ Usuario eliminado correctamente', 'Cerrar', {
          duration: 3000,
        });
        this.dialogRef.close();
      } else {
        this.loading.next(false);
        this.snackbar.open(
          '❌ Ocurrió un error al eliminar el usuario, intente nuevamente',
          'Cerrar',
          {
            duration: 3000,
          }
        );
      }
    });
  }
}
