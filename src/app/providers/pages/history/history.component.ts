import { Component, OnInit } from '@angular/core';
import { RegisterVisit } from '../../models/register-visit.model';
import { ProviderService } from '../../services/providers.services';
import { startWith, map, take, switchMap } from 'rxjs/operators';
import { combineLatest, Observable } from 'rxjs';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { AuthService } from 'src/app/auth/services/auth.service';
import { VisorPdfComponent } from 'src/app/shared/components/visor-pdf/visor-pdf.component';
import { MatDialog } from '@angular/material/dialog';
import { EditVisitDialogComponent } from './dialogs/edit-visit-dialog/edit-visit-dialog.component';
import { CancelDialogComponent } from './dialogs/cancel-dialog/cancel-dialog.component';
import { DeleteDialogComponent } from './dialogs/delete-dialog/delete-dialog.component';
import { Menu } from '../../../shared/models/menu.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Provider } from 'src/app/auth/models/provider.model';
import { UploadFile } from '../../models/register-collaborator';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
})
export class HistoryComponent implements OnInit {
  registerVisit$!: Observable<RegisterVisit[]>;
  form!: FormGroup;
  provider$!: Observable<Provider | undefined>;

  menu: Menu[] = [];
  selectItem: string | undefined;
  selectItemDefault: string | undefined;

  constructor(
    private providerService: ProviderService,
    private fb: FormBuilder,
    public authService: AuthService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {

    this.provider$ = this.authService.user$.pipe(take(1), switchMap((user) => { 
      return this.providerService.getProvider(user!.providerId);
    }))

    this.menu.forEach((val, index, array) => {
      this.selectItemDefault = array[0]['nameNavigate'];
      this.selectItem = this.selectItemDefault;
    });

    const view = this.providerService.getCurrentMonthOfViewDate();
    const beginDate = view.from;
    const endDate = new Date();
    endDate.setHours(23, 59, 59);

    this.form = new FormGroup({
      start: new FormControl(beginDate),
      end: new FormControl(endDate),
    });

    this.registerVisit$ = combineLatest(
      this.providerService.getVisit(),
      this.form.get('start')!.valueChanges.pipe(
        startWith(beginDate),
        map((begin) => begin.setHours(0, 0, 0, 0))
      ),
      this.form.get('end')!.valueChanges.pipe(
        startWith(endDate),
        map((end) => (end ? end.setHours(23, 59, 59) : null))
      )
    ).pipe(
      map(([visit, startdate, enddate]) => {
        const date = { begin: startdate, end: enddate };

        let preFilterSearch: RegisterVisit[] = [...visit];
        preFilterSearch = visit.filter((visit) => {
          return this.getFilterTime(visit.createdAt, date);
        });

        return preFilterSearch;
      })
    );
  }

  getFilterTime(el: any, time: any) {
    const date = el.toMillis();
    const begin = time.begin;
    const end = time.end;

    return date >= begin && date <= end;
  }

  openVizorPdf(file: UploadFile) {
    if (!file) {
      this.snackbar.open('No se encontró el documento');
      return;
    }

    this.dialog.open(VisorPdfComponent, {
      width: '100%',
      data: file,
      panelClass: 'border-dialog',
    });
  }

  editDialog(data: RegisterVisit) {
    this.dialog.open(EditVisitDialogComponent, {
      width: '70%',
      data: data,
      panelClass: 'border-dialog',
    });
  }

  cancelDialog(data: RegisterVisit) {
    this.dialog.open(CancelDialogComponent, {
      width: '30%',
      data: data,
      panelClass: 'border-dialog',
    });
  }

  deleteDialog(data: RegisterVisit) {
    this.dialog.open(DeleteDialogComponent, {
      width: '30%',
      data: data,
      panelClass: 'border-dialog',
    });
  }

  registerVisit() {}
}
