import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  Subscription,
} from 'rxjs';
import { RegisterVisit } from '../../providers/models/register-visit.model';

import { User } from '../../auth/models/user.model';
import { PersonalService } from '../services/personal.service';
import { FormControl, Validators } from '@angular/forms';
import {
  debounceTime,
  filter,
  map,
  startWith,
  take,
  switchMap,
  distinctUntilChanged,
  catchError,
  tap,
  takeWhile,
  last,
} from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import {
  Collaborator,
  UploadFile,
} from '../../providers/models/register-collaborator';
import { VisorPdfComponent } from '../../shared/components/visor-pdf/visor-pdf.component';
import { EntryDialogComponent } from './entryDialog/entry-dialog/entry-dialog.component';
import { ExtDialogComponent } from './exitDialog/ext-dialog/ext-dialog.component';
import { Provider } from 'src/app/auth/models/provider.model';
import { ProvidersComponent } from 'src/app/providers/providers.component';
import { scanCollaborator } from '../../providers/models/scanCollaborator.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ResponsibleList } from '../../admin/models/setting.model';
import { SettingService } from '../../admin/services/settings.services';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-access-control',
  templateUrl: './access-control.component.html',
  styleUrls: ['./access-control.component.scss'],
})
export class AccessControlComponent implements OnInit, OnDestroy {
  visit$!: Observable<RegisterVisit[]>;
  collaboratorScan$!: Observable<scanCollaborator | null>;
  collaborator$!: Observable<any>;
  provider$!: Observable<Provider[]>;
  user$!: Observable<User>;
  searchVisit = new FormControl('');
  searchCollaborator = new FormControl('');
  authorizedBy = new FormControl('', Validators.required);
  user: User | null | undefined = null;
  today = new Date();
  sctrDate: boolean = false;
  covidDate: Boolean = false;
  idVisit!: string;

  authorization: boolean = false;
  inviteds$!: Observable<ResponsibleList[]>;

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  collaboratorId?: string;
  providerId?: string;
  panelOpenState = false;

  medicalExaminationStatus!: boolean;
  sctrStatus!: boolean;
  svlStatus!: boolean;
  swornDeclarationStatus!: boolean;
  searchDni!: boolean;
  dniCollaborator!: boolean;
  inductionStatus!: boolean;
  // symptomatologyStatus!: boolean;

  visualButton: boolean = false;

  firstTime: boolean = true;

  searching = new BehaviorSubject<boolean>(false);
  searching$ = this.searching.asObservable();

  loadingCollaborator = new BehaviorSubject<boolean>(false);
  loadingCollaborator$ = this.loadingCollaborator.asObservable();

  collaborator!: scanCollaborator | null;

  subscriptions = new Subscription();
  isMobile!: boolean;

  constructor(
    private personalService: PersonalService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private settingService: SettingService,
    private breakpoint: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.breakpoint
        .observe([Breakpoints.HandsetPortrait])
        .subscribe((res) => {
          if (res.matches) {
            this.isMobile = true;
          } else {
            this.isMobile = false;
          }
        })
    );

    this.subscriptions.add(
      this.authService.user$.pipe(take(1)).subscribe((user) => {
        if (!user) return;

        this.user = user;
      })
    );

    // collaborator observable for scanning
    this.subscriptions.add(
      this.searching$
        .pipe(
          filter((searching) => searching),
          switchMap((search) => {
            const dni = this.searchCollaborator.value;

            if (!search) return of(null);

            return this.personalService.scanCollaborator(dni!);
          })
        )
        .subscribe((collaborator) => {
          console.log(collaborator);

          if (collaborator) {
            this.playFoundAudio();
            this.collaborator = collaborator;
            this.collaborator.medicalExaminationStatus =
              this.dateIsValidCollaborator(collaborator.medicalExaminationDate)
                ? 'approved'
                : 'pending';
          } else {
            this.collaborator = null;
            this.playNotFoundAudio();
          }

          this.firstTime = false;
          this.searching.next(false);
          this.loadingCollaborator.next(false);
          this.searchCollaborator.reset();
        })
    );

    // list of admins to provide authorization to the visit
    this.inviteds$ = this.settingService.getAllListResponsible().pipe(
      tap((res) => {
        return res;
      })
    );

    // guess/visitor observable
    this.visit$ = combineLatest(
      this.personalService.getVisits(),
      this.personalService.getVisitsInside(),
      this.searchVisit.valueChanges.pipe(
        startWith<any>(''),
        debounceTime(300),
        filter((input) => input !== null)
      )
    ).pipe(
      map(([list, inside, search]) => {
        // const notCanceled = list.filter((visit) => {
        //   return visit.status !== 'canceled';
        // });

        let preFilterSearch: RegisterVisit[] = [...list, ...inside];

        preFilterSearch = preFilterSearch.filter((data) => {
          if (search === '') {
            return true;
          }

          return String(data.dni).includes(search);
        });

        return preFilterSearch;
      })
    );

    this.loading$.subscribe((loading) => {
      if (loading) {
        this.searchCollaborator.disable();
      } else {
        this.searchCollaborator.enable();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  playSuccessAudio() {
    let audio = new Audio();
    audio.src = '../../../assets/audio/success2.wav';
    audio.load();
    audio.play();
  }

  playErrorsAudio() {
    let audio = new Audio();
    audio.src = '../../../assets/audio/error.wav';
    audio.load();
    audio.play();
    this.loadingCollaborator.next(false);
    this.searchCollaborator.setValue('');
  }

  playNotFoundAudio() {
    let audio = new Audio();
    audio.src = '../../../assets/audio/not-found.wav';
    audio.load();
    audio.play();
    this.loadingCollaborator.next(false);
    this.searchCollaborator.setValue('');
  }

  playFoundAudio() {
    if (!this.collaborator) {
      let audio = new Audio();
      audio.src = '../../../assets/audio/found.wav';
      audio.load();
      audio.play();
      this.loadingCollaborator.next(false);
      this.searchCollaborator.setValue('');
    }
  }

  openVizorPdf(file: UploadFile | null | undefined) {
    if (!file) return;

    this.dialog.open(VisorPdfComponent, {
      width: '100%',
      data: file,
      panelClass: 'border-dialog',
    });
  }

  entryDialog(data: RegisterVisit) {
    this.dialog.open(EntryDialogComponent, {
      minWidth: '350px',
      data: data,
      panelClass: 'border-dialog',
    });
  }

  exitDialog(data: RegisterVisit) {
    this.dialog.open(ExtDialogComponent, {
      minWidth: '350px',
      data: data,
      panelClass: 'border-dialog',
    });
  }

  dateIsValid(date: firebase.default.firestore.Timestamp): boolean {
    if (this.today.getTime() < date.toMillis()) {
      return true;
    } else {
      return false;
    }
  }

  authorized() {
    try {
      this.personalService
        .authorized(this.authorizedBy.value!)
        .pipe(take(1))
        .subscribe((res) => {
          res
            .commit()
            .then(() => {
              this.playSuccessAudio();
              this.snackbar.open('✅ INGRESO registrado', 'Aceptar', {
                duration: 6000,
              });
              this.authorizedBy.reset();
              this.loading.next(false);
            })
            .catch((err) => {
              this.playErrorsAudio();
              this.snackbar.open('🚨 Hubo un error.', 'Aceptar', {
                duration: 6000,
              });
            });
        });
    } catch (error: any) {
      console.error(error);
    }
  }

  depatureCollaborator() {
    try {
      this.personalService
        .depatureCollaborator()
        .pipe(take(1))
        .subscribe((res) => {
          res
            .commit()
            .then(() => {
              this.playSuccessAudio();
              this.snackbar.open('✅ SALIDA registrada!', 'Aceptar', {
                duration: 6000,
              });
              this.loading.next(false);
            })
            .catch((err) => {
              this.playErrorsAudio();
              this.snackbar.open('🚨 Hubo un error.', 'Aceptar', {
                duration: 6000,
              });
            });
        });
    } catch (error: any) {
      console.error(error);
    }
  }

  dateIsValidCollaborator(
    date: (Date & firebase.default.firestore.Timestamp) | null
  ): boolean {
    if (date === null) return false;

    return this.today.getTime() < date.toMillis();
  }

  search(): void {
    this.loadingCollaborator.next(true);
    if (
      this.collaborator &&
      this.searchCollaborator.value === this.collaborator.dni
    ) {
      this.collaborator.entryDeparture === 'inside'
        ? this.depatureCollaborator()
        : this.checkValidity(this.collaborator)
        ? this.authorized()
        : this.playErrorsAudio();
    } else {
      this.searching.next(true);
    }
  }

  checkValidity(collaborator: scanCollaborator): boolean {
    const documentsValid =
      this.dateIsValidCollaborator(
        collaborator.inductionDate ? collaborator.inductionDate : null
      ) &&
      this.isVaccinated(collaborator) &&
      this.dateIsValidCollaborator(
        collaborator.swornDeclarationDate
          ? collaborator.swornDeclarationDate
          : null
      ) &&
      this.dateIsValidCollaborator(
        collaborator.sctrDate ? collaborator.sctrDate : null
      );

    if (this.authorization) {
      return this.authorizedBy.valid;
    } else {
      return documentsValid;
    }
  }

  isVaccinated(collaborator: scanCollaborator | RegisterVisit): boolean {
    return true;
    // now is optional
    if (
      collaborator.firstDoseDate &&
      collaborator.secondDoseDate &&
      collaborator.thirdDoseDate
    ) {
      return true;
    } else {
      return false;
    }
  }
}
