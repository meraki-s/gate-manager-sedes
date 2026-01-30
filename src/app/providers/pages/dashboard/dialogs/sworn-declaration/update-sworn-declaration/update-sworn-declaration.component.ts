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
import { SwornDeclaration } from 'src/app/providers/models/dashboard.model';
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
import { SwornDeclarationService } from 'src/app/providers/services/sworn-declaration.service';
import { DashboardService } from 'src/app/providers/services/dashboard.services';

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
  selector: 'app-update-sworn-declaration',
  templateUrl: './update-sworn-declaration.component.html',
  styleUrls: ['./update-sworn-declaration.component.scss'],
})
export class UpdateSwornDeclarationComponent implements OnInit, OnDestroy {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  dataForm!: FormGroup;

  imagesUploadSwornDeclaration: UploadFile[] = [];
  imagesSwornDeclaration!: UploadFile | null;
  filesSwornDeclaration: BehaviorSubject<File | undefined | null>[] = [];
  pathStorageSwornDeclaration!: string;
  isHoveringSwornDeclaration!: boolean;

  @ViewChild('uploadFileSwornDeclaration', { read: ElementRef })
  inputFileSwornDeclaration!: ElementRef;

  entryCollaboratorControl: FormControl = new FormControl(
    null,
    Validators.required
  );
  listCollaboratorArray: Array<Collaborator> = [];
  collaboratorExistList: Array<boolean> = [];
  matcher = new MyErrorStateMatcher();

  subscriptions = new Subscription();
  collaborators$!: Observable<Collaborator[]>;
  isMobile!: boolean;
  missed: number = 0;

  image!: any;

  constructor(
    public dialogRef: MatDialogRef<UpdateSwornDeclarationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SwornDeclaration,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private swornDeclarationServices: SwornDeclarationService,
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
    this.image = this.data.swornDeclarationFile;
    this.imagesSwornDeclaration = this.data.swornDeclarationFile;
    this.pathStorageSwornDeclaration = `gateManager/dashboard/swornDeclarationFile/`;

    this.collaborators$ = combineLatest(
      this.entryCollaboratorControl.valueChanges.pipe(
        startWith(''),
        debounceTime(150),
        distinctUntilChanged(),
        map((collaborator) =>
          collaborator.name ? collaborator.name : collaborator
        )
      ),
      this.swornDeclarationServices.getAllCollaborators()
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
      code: [this.data.code, [Validators.required]],
      validityDate: [
        this.getDate(this.data.validityDate),
        [Validators.required],
      ],
      swornDeclarationFile: [null],
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
    if (
      this.imagesUploadSwornDeclaration.length === 0 &&
      !this.data.swornDeclarationFile?.fileURL
    ) {
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

    this.imagesUploadSwornDeclaration.forEach((el: any) => {
      if (el != '') {
        this.imagesSwornDeclaration = el;
      }
    });
    try {
      this.swornDeclarationServices
        .swornDeclarationUpdate(
          this.data.id,
          this.dataForm.value,
          this.listCollaboratorArray,
          this.imagesSwornDeclaration
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
              this.filesSwornDeclaration = [];
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

  deleteFileSwornDeclaration(fileURL: string) {
    try {
      //this.loading.next(true);
      if (this.data) {
        this.swornDeclarationServices
          .deleteFileSwornDeclaration(this.data.id)
          .pipe(take(1))
          .subscribe((res) => {
            res
              .commit()
              .then(() => {
                this.swornDeclarationServices.deleteFileStorage(fileURL);
                this.snackbar.open('✅ Se elimino correctamente', 'Aceptar', {
                  duration: 5000,
                });
                //this.loading.next(false);
                this.image = '';
                this.data.swornDeclarationFile = {} as UploadFile;
              })
              .catch((err) => {
                //this.loading.next(false);
                this.snackbar.open('🚨 Hubo un error al agregar!', 'Aceptar', {
                  duration: 5000,
                });
              });
          });
      }
    } catch (error) {
      console.log(error);
    }
  }

  addNewImageSwornDeclaration(image: any): void {
    if (image.type === 'application/pdf') {
      this.inputFileSwornDeclaration.nativeElement.value = '';
      if (image) {
        this.imagesUploadSwornDeclaration.push(image);
      }
    } else {
      this.snackbar.open('✅ Solo se permite subir archivos PDF!', 'Aceptar', {
        duration: 3000,
      });
    }
  }

  onDropSwornDeclaration(droppedFile: FileList | any): void {
    let droppedFiles = droppedFile.files;
    this.filesSwornDeclaration = [];

    setTimeout(() => {
      for (let i = 0; i < droppedFiles.length; i++) {
        let newLocal: File | any;
        const newFile: File | any = new BehaviorSubject<File>(newLocal);
        this.filesSwornDeclaration.push(newFile);
      }

      this.filesSwornDeclaration.forEach((file, index) => {
        this.filesSwornDeclaration[index].next(droppedFiles.item(index));
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
