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
  Validators,
} from '@angular/forms';
import { BehaviorSubject, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs/operators';
// import { MediaObserver, MediaChange } from '@angular/flex-layout';
import { UploadFile } from '../../../../models/register-collaborator';
import { DashboardService } from 'src/app/providers/services/dashboard.services';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-register-collaborator',
  templateUrl: './register-collaborator.component.html',
  styleUrls: ['./register-collaborator.component.scss'],
})
export class RegisterCollaboratorComponent implements OnInit, OnDestroy {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  loadingVaccination = new BehaviorSubject<boolean>(false);
  loadingVaccination$ = this.loadingVaccination.asObservable();

  loadingExamination = new BehaviorSubject<boolean>(false);
  loadingExamination$ = this.loadingExamination.asObservable();

  imagesUploadExamen: object[] = [];
  filesExamen: BehaviorSubject<File>[] = [];
  pathStorageExamen!: string;
  docExamen!: UploadFile;
  imagesUploadVaccination: object[] = [];
  filesVaccination: BehaviorSubject<File>[] = [];
  pathStorageVaccination!: string;
  docVaccination!: UploadFile;

  mediaSub: Subscription = new Subscription();
  deviceXs: boolean = false;
  deviceSm: boolean = false;

  collaboratorForm: FormGroup = this.fb.group({
    name: new FormControl('', Validators.required),
    lastname: new FormControl('', Validators.required),
    dni: new FormControl('', Validators.required),
    jobTitle: new FormControl('', Validators.required),
    medicalExaminationDate: new FormControl(''),
    medicalExaminationFile: new FormControl(''),
    firstDoseDate: new FormControl(''),
    secondDoseDate: new FormControl(''),
    thirdDoseDate: new FormControl(''),
    vaccinationCardFile: new FormControl(null),
  });

  // @ViewChild('uploadFileExamen', { read: ElementRef });
  // @ViewChild('uploadFileVaccination', { read: ElementRef });

  inputFileExamen!: ElementRef;
  inputFileVaccination!: ElementRef;

  @ViewChild('uploadFileExamen', { static: false }) set methodExam(
    element: ElementRef
  ) {
    this.inputFileExamen = element;
  }

  @ViewChild('uploadFileVaccination', { static: false }) set methodVAccination(
    element: ElementRef
  ) {
    this.inputFileVaccination = element;
  }
  constructor(
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private dashboardService: DashboardService,
    // public mediaObserver: MediaObserver,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // this.mediaSub = this.mediaObserver.media$.subscribe(
    //   (result: MediaChange) => {
    //     this.deviceXs = result.mqAlias === 'xs' ? true : false;
    //     this.deviceSm = result.mqAlias === 'sm' ? true : false;
    //   }
    // );

    this.pathStorageExamen = `gateManager/examenFile/`;
  }

  ngOnDestroy(): void {
    this.mediaSub.unsubscribe();
  }

  register() {
    this.loading.next(true);

    // check if medical examination file is provided
    if (this.imagesUploadExamen.length > 0) {
      // check if examination have date
      if (!this.collaboratorForm.get('medicalExaminationDate')?.value) {
        this.snackbar.open(
          '🚨 Debe ingresar una fecha de examen médico',
          'Aceptar',
          {
            duration: 6000,
          }
        );
        this.loading.next(false);
        return;
      }
    }

    // check if vaccination file is provided
    // if (this.imagesUploadVaccination.length === 0) {
    //   this.snackbar.open(
    //     '🚨 Debe cargar una imágen/pdf de su carnet de vacunación',
    //     'Aceptar',
    //     {
    //       duration: 6000,
    //     }
    //   );
    //   this.loading.next(false);
    //   return;
    // }

    this.imagesUploadExamen.forEach((el: any) => {
      if (el != '') {
        this.docExamen = el;
      }
    });

    this.imagesUploadVaccination.forEach((el: any) => {
      if (el != '') {
        this.docVaccination = el;
      }
    });

    try {
      if (this.collaboratorForm.invalid) {
        this.collaboratorForm.markAllAsTouched();
        this.loading.next(false);
        this.snackbar.open('🚨 Debe llenar todos los campos', 'Aceptar', {
          duration: 6000,
        });
      } else {
        this.dashboardService
          .registerCollaborator(
            this.collaboratorForm.value,
            this.docExamen,
            this.docVaccination
          )
          .pipe(take(1))
          .subscribe((res) => {
            res.batch
              .commit()
              .then(() => {
                this.dashboardService
                  .queryDriveIndSymp(res.collaboratorId, res.collaboratorDni)
                  .pipe(take(1))
                  .subscribe((batch) => {
                    batch.commit().then(() => {
                      this.snackbar.open('🚀 Registro exitoso', 'Aceptar', {
                        duration: 6000,
                      });
                      this.dialog.closeAll();
                      this.loading.next(false);
                    });
                  });
              })
              .catch((error) => {
                console.log(error);
                this.snackbar.open('🚨 Hubo un error.', 'Aceptar', {
                  duration: 6000,
                });
              });
          });
      }
    } catch (error) {
      console.log(error);

      this.snackbar.open(
        '🚨 Hubo un error, debe de ingresar todo los datos requeridos',
        'Aceptar',
        {
          duration: 6000,
        }
      );
      this.loading.next(false);
    }
  }

  addNewImageExamen(image: object): void {
    this.inputFileExamen.nativeElement.value = '';
    if (image) {
      this.imagesUploadExamen.push(image);
      this.collaboratorForm
        .get('medicalExaminationDate')
        ?.setValidators(Validators.required);
      this.loadingExamination.next(false);
    }
  }

  onDropExamen(droppedFile: FileList | any): void {
    this.loadingExamination.next(true);
    let droppedFiles = droppedFile.files;
    this.filesExamen = [];

    setTimeout(() => {
      for (let i = 0; i < droppedFiles.length; i++) {
        let newLocal: File | any;
        const newFile: File | any = new BehaviorSubject<File>(newLocal);
        this.filesExamen.push(newFile);
      }

      this.filesExamen.forEach((file, index) => {
        this.filesExamen[index].next(droppedFiles.item(index));
      });
    }, 300);
  }

  addNewImageVaccination(image: object): void {
    this.inputFileVaccination.nativeElement.value = '';
    if (image) {
      this.imagesUploadVaccination.push(image);
      this.loadingVaccination.next(false);
    }
  }

  onDropVaccination(droppedFile: FileList | any): void {
    this.loadingVaccination.next(true);
    let droppedFiles = droppedFile.files;
    this.filesVaccination = [];

    setTimeout(() => {
      for (let i = 0; i < droppedFiles.length; i++) {
        let newLocal: File | any;
        const newFile: File | any = new BehaviorSubject<File>(newLocal);
        this.filesVaccination.push(newFile);
      }

      this.filesVaccination.forEach((file, index) => {
        this.filesVaccination[index].next(droppedFiles.item(index));
      });
    }, 300);
  }
}
