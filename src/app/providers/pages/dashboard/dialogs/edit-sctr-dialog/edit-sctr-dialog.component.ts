import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { SCTR } from 'src/app/providers/models/dashboard.model';
import { DashboardService } from 'src/app/providers/services/dashboard.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  take,
} from 'rxjs/operators';
import { ErrorStateMatcher } from '@angular/material/core';
import {
  Collaborator,
  UploadFile,
} from 'src/app/providers/models/register-collaborator';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: 'app-edit-sctr-dialog',
  templateUrl: './edit-sctr-dialog.component.html',
  styleUrls: ['./edit-sctr-dialog.component.scss'],
})
export class EditSctrDialogComponent implements OnInit, OnDestroy {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  dataForm!: FormGroup;

  // upload image SCTR
  imagesUploadSCTR: object[] = [];
  imagesSCTR!: UploadFile;
  filesSCTR: BehaviorSubject<File | undefined | null>[] = [];
  pathStorageSCTR!: string;
  isHoveringSCTR!: boolean;

  @ViewChild('uploadFileSCTR', { read: ElementRef }) inputFileSCTR!: ElementRef;

  entryCollaboratorControl: FormControl = new FormControl(
    null,
    Validators.required
  );
  listCollaboratorArray: Array<Collaborator> = [];
  collaboratorExistList: Array<boolean> = [];
  matcher = new MyErrorStateMatcher();

  subscriptions = new Subscription();
  collaborator$!: Observable<Collaborator[]>;
  isMobile!: boolean;
  image!: any;
  missed: number = 0;

  constructor(
    public dialogRef: MatDialogRef<EditSctrDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SCTR,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private dashboardService: DashboardService,
    private snackbar: MatSnackBar,
    private breakpoint: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.initform();
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

    this.listCollaboratorArray = this.data.collaborators;
    this.image = this.data.sctrFile;
    this.imagesSCTR = this.data.sctrFile;
    this.pathStorageSCTR = `gateManager/dashboard/scrtFile/`;

    this.collaborator$ = combineLatest(
      this.entryCollaboratorControl.valueChanges.pipe(
        startWith(''),
        debounceTime(150),
        distinctUntilChanged(),
        map((collaborator) =>
          collaborator.name ? collaborator.name : collaborator
        )
      ),
      this.dashboardService.getAllCollaborators()
    ).pipe(
      map(([formValue, collaborators]) => {
        const filter = collaborators.filter((el) =>
          el.name.toLowerCase().includes(formValue.toLowerCase())
        );

        return filter;
      })
    );

    // validate if all collaborators in list exist
    this.dashboardService
      .checkCollaboratorsListInDocument(this.listCollaboratorArray)
      .subscribe((res) => {
        this.collaboratorExistList = res;
        this.missed = this.countMissed();
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  showEntryCollaborator(collaborator: any): any {
    return collaborator ? collaborator.name : null;
  }

  selectedEntryCollaborator(event: MatAutocompleteSelectedEvent): void {
    const { id, name, lastname, jobTitle, dni } = event.option.value;
    // check if duplicated
    let duplicated = false;

    this.listCollaboratorArray.forEach((el) => {
      if (el.id === id) {
        duplicated = true;
      }
    });

    if (!duplicated) {
      this.listCollaboratorArray.push({
        id,
        name,
        lastname,
        jobTitle,
        dni,
      } as Collaborator);
      this.collaboratorExistList.push(true);
    } else {
      this.snackbar.open(` ${name} ${lastname}, ya esta agregado`, 'Aceptar', {
        duration: 6000,
      });
    }
    this.entryCollaboratorControl.setValue('');
  }

  initform(): void {
    this.dataForm = this.fb.group({
      code: new FormControl(this.data.code, [Validators.required]),
      validityDate: new FormControl(this.getDate(this.data.validityDate), [
        Validators.required,
      ]),
      sctrFile: new FormControl(null),
    });
  }

  getDate(date: any): any {
    return new Date(date.seconds * 1000);
  }

  save(): void {
    this.loading.next(true);

    // check if form is valid
    if (!this.dataForm.valid) {
      this.snackbar.open('🚨 Debes llenar todos los campos', 'Aceptar', {
        duration: 6000,
      });
      this.loading.next(false);
      return;
    }

    // check if there is a file
    if (this.imagesUploadSCTR.length === 0 && !this.data.sctrFile.fileURL) {
      this.snackbar.open('🚨 Debes subir un archivo', 'Aceptar', {
        duration: 6000,
      });
      this.loading.next(false);
      return;
    }

    // check if there is a collaborator
    if (this.listCollaboratorArray.length === 0) {
      this.snackbar.open('🚨 Debes agregar un colaborador', 'Aceptar', {
        duration: 6000,
      });
      this.loading.next(false);
      return;
    }

    this.imagesUploadSCTR.forEach((el: any) => {
      if (el != '') {
        this.imagesSCTR = el;
      }
    });
    try {
      this.dashboardService
        .sctrUpdate(
          this.data.id,
          this.dataForm.value,
          this.listCollaboratorArray,
          this.imagesSCTR
        )
        .pipe(take(1))
        .subscribe((res) => {
          res
            .commit()
            .then(() => {
              this.snackbar.open('✅ Se guardo correctamente!', 'Aceptar', {
                duration: 6000,
              });
              this.loading.next(false);
              this.dataForm.reset();
              this.filesSCTR = [];
              this.dialog.closeAll();
            })
            .catch((err) => {
              this.snackbar.open('🚨 Hubo un error.', 'Aceptar', {
                duration: 6000,
              });
            });
        });
    } catch (error: any) {
      console.error(error);
    }
  }

  deleteFileSCTR(fileURL: string) {
    try {
      //this.loading.next(true);
      if (this.data) {
        this.dashboardService
          .deleteFileSCTR(this.data.id)
          .pipe(take(1))
          .subscribe((res) => {
            res
              .commit()
              .then(() => {
                this.dashboardService.deleteFileStorage(fileURL);
                this.snackbar.open(
                  '✅ Documento eliminado correctamente',
                  'Aceptar',
                  {
                    duration: 5000,
                  }
                );
                //this.loading.next(false);
                this.image = '';
                this.data.sctrFile = {} as UploadFile;
              })
              .catch((err) => {
                //this.loading.next(false);
                this.snackbar.open(
                  '🚨 Hubo un error al borrar el documento!',
                  'Aceptar',
                  {
                    duration: 5000,
                  }
                );
              });
          });
      }
    } catch (error) {
      console.log(error);
    }
  }

  addNewImageSCTR(image: any): void {
    if (image.type === 'application/pdf') {
      this.inputFileSCTR.nativeElement.value = '';
      if (image) {
        this.imagesUploadSCTR.push(image);
      }
    } else {
      this.snackbar.open('✅ Solo se permite subir archivos PDF!', 'Aceptar', {
        duration: 3000,
      });
    }
  }

  onDropSCTR(droppedFile: FileList | any): void {
    let droppedFiles = droppedFile.files;
    this.filesSCTR = [];

    setTimeout(() => {
      for (let i = 0; i < droppedFiles.length; i++) {
        let newLocal: File | any;
        const newFile: File | any = new BehaviorSubject<File>(newLocal);
        this.filesSCTR.push(newFile);
      }

      this.filesSCTR.forEach((file, index) => {
        this.filesSCTR[index].next(droppedFiles.item(index));
      });
    }, 300);
  }

  deleteCollaborator(index: number): void {
    this.listCollaboratorArray.splice(index, 1);
    this.collaboratorExistList.splice(index, 1);
    this.missed = this.countMissed();
  }

  missCollaborator(): boolean {
    return this.collaboratorExistList.some((res) => res == false);
  }

  countMissed(): number {
    return this.collaboratorExistList.reduce(
      (acc, res) => (res === false ? acc + 1 : acc),
      0
    );
  }
}
