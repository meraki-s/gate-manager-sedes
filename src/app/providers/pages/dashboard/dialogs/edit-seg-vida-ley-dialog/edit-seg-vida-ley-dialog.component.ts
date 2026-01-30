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
import { DashboardService } from 'src/app/providers/services/dashboard.services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  take,
  tap,
} from 'rxjs/operators';
import { ErrorStateMatcher } from '@angular/material/core';
import { User } from 'src/app/auth/models/user.model';
import { AuthService } from 'src/app/auth/services/auth.service';
import {
  Collaborator,
  UploadFile,
} from 'src/app/providers/models/register-collaborator';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { SVL } from '../../../../models/dashboard.model';

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
  selector: 'app-edit-seg-vida-ley-dialog',
  templateUrl: './edit-seg-vida-ley-dialog.component.html',
  styleUrls: ['./edit-seg-vida-ley-dialog.component.scss'],
})
export class EditSegVidaLeyDialogComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  dataForm!: FormGroup;

  imagesUploadSVL: UploadFile[] = [];
  imagesSVL!: UploadFile;
  filesSVL: BehaviorSubject<File | undefined | null>[] = [];
  pathStorageSVL!: string;

  @ViewChild('uploadFileSeguroVL', { read: ElementRef })
  inputFileSeguroVL!: ElementRef;

  entryCollaboratorControl: FormControl = new FormControl(
    null,
    Validators.required
  );
  listCollaboratorArray: Array<any> = [];
  collaboratorExistList: Array<boolean> = [];
  matcher = new MyErrorStateMatcher();

  subscriptions = new Subscription();
  collaborator$!: Observable<Collaborator[]>;
  isMobile!: boolean;
  image!: UploadFile;
  missed: number = 0;

  user!: User;

  constructor(
    public dialogRef: MatDialogRef<EditSegVidaLeyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SVL,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private dashboardService: DashboardService,
    private authService: AuthService,
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

    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        if (!user) return;

        this.user = user;
      })
    );

    this.listCollaboratorArray = this.data.collaborators;
    this.image = this.data.svlFile;
    this.imagesSVL = this.data.svlFile;
    this.pathStorageSVL = `gateManager/dashboard/SVLFile/`;

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

  initform(): void {
    this.dataForm = this.fb.group({
      code: new FormControl(this.data.code, [Validators.required]),
      validityDate: new FormControl(this.getDate(this.data.validityDate), [
        Validators.required,
      ]),
      SVLFile: new FormControl(null),
    });
  }

  getDate(date: any): any {
    return new Date(date.seconds * 1000);
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
    if (this.imagesUploadSVL.length === 0 && !this.data.svlFile.fileURL) {
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

    this.imagesUploadSVL.forEach((el: any) => {
      if (el != '') {
        this.imagesSVL = el;
      }
    });
    try {
      this.dashboardService
        .svlUpdate(
          this.data.id,
          this.dataForm.value,
          this.listCollaboratorArray,
          this.imagesSVL,
          this.user
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
              this.filesSVL = [];
              this.dialog.closeAll();
            })
            .catch((err) => {
              console.log(err);

              this.snackbar.open('🚨 Hubo un error.', 'Aceptar', {
                duration: 6000,
              });
            });
        });
    } catch (error: any) {
      console.error(error);
    }
  }

  deleteFileSVL(fileURL: string) {
    try {
      //this.loading.next(true);
      if (this.data) {
        this.dashboardService
          .deleteFileSVL(this.data.id)
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
                this.image = {
                  fileURL: '',
                  name: '',
                  type: '',
                };
                this.data.svlFile = {} as UploadFile;
              })
              .catch((err) => {
                //this.loading.next(false);
                console.log(err);
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

  addNewImageSeguroVL(image: any): void {
    if (image.type === 'application/pdf') {
      this.inputFileSeguroVL.nativeElement.value = '';
      if (image) {
        this.imagesUploadSVL.push(image);
      }
    } else {
      this.snackbar.open('🚨 Solo se pueden subir archivos PDF!', 'Aceptar', {
        duration: 3000,
      });
    }
  }

  onDropSeguroVL(droppedFile: FileList | any): void {
    let droppedFiles = droppedFile.files;
    this.filesSVL = [];

    setTimeout(() => {
      for (let i = 0; i < droppedFiles.length; i++) {
        let newLocal: File | any;
        const newFile: File | any = new BehaviorSubject<File>(newLocal);
        this.filesSVL.push(newFile);
      }

      this.filesSVL.forEach((file, index) => {
        this.filesSVL[index].next(droppedFiles.item(index));
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
