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
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorStateMatcher } from '@angular/material/core';
import { DashboardService } from 'src/app/providers/services/dashboard.services';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
  take,
  map,
} from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/services/auth.service';
import { User } from 'src/app/auth/models/user.model';
import {
  Collaborator,
  UploadFile,
} from 'src/app/providers/models/register-collaborator';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-add-sctr-dialog',
  templateUrl: './add-sctr-dialog.component.html',
  styleUrls: ['./add-sctr-dialog.component.scss'],
})
export class AddSctrDialogComponent implements OnInit, OnDestroy {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  dataForm!: FormGroup;

  // upload image SCTR
  imagesUploadSCTR: UploadFile[] = [];
  pdfUploadSCTR!: UploadFile;
  filesSCTR: BehaviorSubject<File>[] = [];
  pathStorageSCTR!: string;
  isHoveringSCTR!: boolean;

  @ViewChild('uploadFileSCTR', { read: ElementRef }) inputFileSCTR!: ElementRef;

  entryCollaboratorControl: FormControl = new FormControl(
    null,
    Validators.required
  );

  listCollaboratorArray: Array<Collaborator> = [];
  matcher = new MyErrorStateMatcher();

  subscriptions = new Subscription();
  collaborator$!: Observable<Collaborator[]>;
  isMobile!: boolean;

  constructor(
    private fb: FormBuilder,
    private dashboardService: DashboardService,
    private snackbar: MatSnackBar,
    private breakpoint: BreakpointObserver,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<AddSctrDialogComponent>,
    private storage: AngularFireStorage
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
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  showEntryCollaborator(collaborator: Collaborator | null): any {
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
    } else {
      this.snackbar.open(` ${name} ${lastname}, ya esta agregado`, 'Aceptar', {
        duration: 6000,
      });
    }
    this.entryCollaboratorControl.setValue('');
  }

  initform(): void {
    this.dataForm = this.fb.group({
      code: new FormControl('', [Validators.required]),
      validityDate: new FormControl('', [Validators.required]),
      sctrFile: new FormControl('', [Validators.required]),
    });
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
    if (this.imagesUploadSCTR.length === 0) {
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
        this.pdfUploadSCTR = el;
      }
    });
    try {
      this.dashboardService
        .sctrRegister(
          this.dataForm.value,
          this.listCollaboratorArray,
          this.pdfUploadSCTR
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
  }

  async closeDialog() {
    for (let [index, pdf] of this.imagesUploadSCTR.entries()) {
      try {
        await this.storage.storage.refFromURL(pdf.fileURL).delete();
      } catch (error) {
        console.log(error);
      }
    }
    this.subscriptions.unsubscribe();
    this.dialogRef.close();
  }
}

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
