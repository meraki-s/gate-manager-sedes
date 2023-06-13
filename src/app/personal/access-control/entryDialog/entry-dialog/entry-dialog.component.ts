import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { ProviderService } from 'src/app/auth/services/provider.service';
import { RegisterVisit } from 'src/app/providers/models/register-visit.model';
import { PersonalService } from '../../../services/personal.service';

@Component({
  selector: 'app-entry-dialog',
  templateUrl: './entry-dialog.component.html',
  styleUrls: ['./entry-dialog.component.scss']
})
export class EntryDialogComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RegisterVisit,
    private dialog: MatDialog,
    private snackbar:MatSnackBar,
    private personalService: PersonalService
  ) { }

  ngOnInit(): void {
  }

  save(id: string, providerId:string){
    this.personalService
    .accessInside(id,providerId).pipe(take(1))
    .subscribe((res) => {
        res
        .commit()
        .then(() => {
          this.snackbar.open('✅ Ingreso a planta', 'Aceptar', {
            duration: 6000,
          });
          this.loading.next(false);
          this.dialog.closeAll();
        })
        .catch((err) => {
           console.log(err)
        });
    });
  }

}
