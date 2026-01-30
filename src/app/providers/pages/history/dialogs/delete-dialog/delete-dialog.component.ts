import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { RegisterVisit } from '../../../../models/register-visit.model';
import { ProviderService } from '../../../../services/providers.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss']
})
export class DeleteDialogComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RegisterVisit,
    private dialog: MatDialog,
    private providerService: ProviderService,
    private snackbar:MatSnackBar,
  ) { }

  ngOnInit(): void {
  }

  save(){
    try{
      if (this.data) {
        this.providerService
          .deleteVisit(this.data.id).pipe(take(1))
          .subscribe((res) => {
              res
              .commit()
              .then(() => {
                this.snackbar.open('✅ SCTR borrado correctamente', 'Aceptar', {
                  duration: 6000,
                });
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

    }catch (error: any) {
      console.error(error);
    }

  }


}
