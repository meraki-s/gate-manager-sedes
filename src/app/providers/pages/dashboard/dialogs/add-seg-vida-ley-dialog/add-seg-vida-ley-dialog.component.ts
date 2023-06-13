import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { BehaviorSubject, Observable, Subscription, combineLatest } from 'rxjs';
import {
  Collaborator,
  UploadFile,
} from '../../../../models/register-collaborator';
import { MyErrorStateMatcher } from '../../../../../admin/pages/settings/settings.component';
import { DashboardService } from '../../../../services/dashboard.services';
import { AuthService } from '../../../../../auth/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import {
  map,
  startWith,
  take,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { User } from 'src/app/auth/models/user.model';

@Component({
  selector: 'app-add-seg-vida-ley-dialog',
  templateUrl: './add-seg-vida-ley-dialog.component.html',
  styleUrls: ['./add-seg-vida-ley-dialog.component.scss'],
})
export class AddSegVidaLeyDialogComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  dataForm!: FormGroup;

  imagesUploadSVL: UploadFile[] = [];
  imagesSVL!: UploadFile;
  filesSVL: BehaviorSubject<File | undefined | null>[] = [];
  pathStorageSVL!: string;
  isHoveringSVL!: boolean;

  @ViewChild('uploadFileSVL', { read: ElementRef }) inputFileSVL!: ElementRef;

  entryCollaboratorControl: FormControl = new FormControl(
    null,
    Validators.required
  );
  listCollaboratorArray: Array<Collaborator> = [];
  matcher = new MyErrorStateMatcher();

  subscriptions = new Subscription();
  collaborator$!: Observable<Collaborator[]>;
  isMobile!: boolean;
  user!: User;

  constructor(
    private fb: FormBuilder,
    private dashboardService: DashboardService,
    private authService: AuthService,
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

    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        if (!user) return;

        this.user = user;
      })
    );

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

  deleteCollaborator(i: number) {
    this.listCollaboratorArray.splice(i, 1);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  initform(): void {
    this.dataForm = this.fb.group({
      code: new FormControl('', [Validators.required]),
      validityDate: new FormControl('', [Validators.required]),
      SVLFile: new FormControl('', [Validators.required]),
    });
    this.entryCollaboratorControl = new FormControl();
  }

  addNewImageSVL(image: any): void {
    if (image.type === 'application/pdf') {
      this.inputFileSVL.nativeElement.value = '';
      if (image) {
        this.imagesUploadSVL.push(image);
      }
    } else {
      this.snackbar.open('✅ Solo se permite subir archivos PDF!', 'Aceptar', {
        duration: 3000,
      });
    }
  }

  onDropSVL(droppedFile: FileList | any): void {
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
    if (this.imagesUploadSVL.length === 0) {
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
        .svlRegister(
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
              this.snackbar.open('🚨 Hubo un error.', 'Aceptar', {
                duration: 6000,
              });
            });
        });
    } catch (error: any) {
      console.error(error);
    }
  }
}
