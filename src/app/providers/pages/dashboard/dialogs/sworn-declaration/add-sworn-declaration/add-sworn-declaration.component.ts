import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  take,
} from 'rxjs/operators';
import {
  Collaborator,
  UploadFile,
} from 'src/app/providers/models/register-collaborator';
import { SwornDeclarationService } from 'src/app/providers/services/sworn-declaration.service';
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
  selector: 'app-add-sworn-declaration',
  templateUrl: './add-sworn-declaration.component.html',
  styleUrls: ['./add-sworn-declaration.component.scss'],
})
export class AddSwornDeclarationComponent implements OnInit, OnDestroy {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  dataForm!: FormGroup;

  // upload image SCTR
  imagesUploadSwornDeclaration: UploadFile[] = [];
  imagesSwornDeclaration!: UploadFile;
  filesSwornDeclaration: BehaviorSubject<File>[] = [];
  pathStorageSwornDeclaration!: string;
  isHoveringSwornDeclaration!: boolean;

  @ViewChild('uploadFileSwornDeclaration', { read: ElementRef })
  inputFileSwornDeclaration!: ElementRef;

  entryCollaboratorControl: FormControl = new FormControl(
    null,
    Validators.required
  );
  listCollaboratorArray: Array<Collaborator> = [];
  matcher = new MyErrorStateMatcher();

  subscriptions = new Subscription();
  collaborators$!: Observable<Collaborator[]>;
  isMobile!: boolean;

  constructor(
    private fb: FormBuilder,
    private swornDeclarationService: SwornDeclarationService,
    private snackbar: MatSnackBar,
    private breakpoint: BreakpointObserver,
    private dialog: MatDialog
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
      this.swornDeclarationService.getAllCollaborators()
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
      swornDeclarationFile: new FormControl('', [Validators.required]),
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
    if (this.imagesUploadSwornDeclaration.length === 0) {
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
      this.swornDeclarationService
        .swornDeclarationRegister(
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
  }
}
