import {
  Component,
  ElementRef,
  Inject,
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
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { take } from 'rxjs/operators';
// import { MediaObserver, MediaChange } from '@angular/flex-layout';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import {
  Collaborator,
  UploadFile,
} from 'src/app/providers/models/register-collaborator';
import { DashboardService } from 'src/app/providers/services/dashboard.services';

@Component({
  selector: 'app-edit-collaborator',
  templateUrl: './edit-collaborator.component.html',
  styleUrls: ['./edit-collaborator.component.scss'],
})
export class EditCollaboratorComponent implements OnInit, OnDestroy {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  loadingVaccination = new BehaviorSubject<boolean>(false);
  loadingVaccination$ = this.loadingVaccination.asObservable();

  loadingExamination = new BehaviorSubject<boolean>(false);
  loadingExamination$ = this.loadingExamination.asObservable();

  mediaSub: Subscription = new Subscription();
  deviceXs: boolean = false;
  deviceSm: boolean = false;

  filesExamen: BehaviorSubject<File>[] = [];
  pathStorageExamen!: string;
  imagesUploadExamen: object[] = [];

  filesVaccination: BehaviorSubject<File>[] = [];
  pathStorageVaccination!: string;
  imagesUploadVaccination: object[] = [];

  docFileExam: UploadFile | null = {
    fileURL: '',
    type: '',
    name: '',
  };

  docFileVaccination: UploadFile | null = {
    fileURL: '',
    type: '',
    name: '',
  };

  collaboratorForm: FormGroup = this.fb.group({
    name: [this.data.name, Validators.required],
    lastname: [this.data.lastname, Validators.required],
    dni: [this.data.dni, Validators.required],
    jobTitle: [this.data.jobTitle, Validators.required],
    // medicalExaminationFile: [''],
    // medicalExaminationDate: [this.getDate(this.data.medicalExaminationDate)],
    // vaccinationCardFile: [''],
    // firstDoseDate: [this.getDate(this.data.firstDoseDate)],
    // secondDoseDate: [this.getDate(this.data.secondDoseDate)],
    // thirdDoseDate: [this.getDate(this.data.thirdDoseDate)],
  });

  // @ViewChild('uploadFileExamen', { read: ElementRef })
  // @ViewChild('uploadFileVaccination', { read: ElementRef })
  // inputFileExamen!: ElementRef;
  // inputFileVaccination!: ElementRef;

  // @ViewChild('uploadFileExamen', { static: false }) set methodExam(
  //   element: ElementRef
  // ) {
  //   this.inputFileExamen = element;
  // }

  // @ViewChild('uploadFileVaccination', { static: false }) set methodVAccination(
  //   element: ElementRef
  // ) {
  //   this.inputFileVaccination = element;
  // }

  constructor(
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private dashboardService: DashboardService,
    // public mediaObserver: MediaObserver,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: Collaborator
  ) {}

  ngOnInit(): void {
    // this.docFileExam = this.data.medicalExaminationFile
    //   ? this.data.medicalExaminationFile
    //   : null;
    // this.docFileVaccination = this.data.vaccinationCardFile ?? null;
    // this.mediaSub = this.mediaObserver.media$.subscribe(
    //   (result: MediaChange) => {
    //     console.log(result.mqAlias);
    //     this.deviceXs = result.mqAlias === 'xs' ? true : false;
    //     this.deviceSm = result.mqAlias === 'sm' ? true : false;
    //   }
    // );
  }

  ngOnDestroy(): void {
    this.mediaSub.unsubscribe();
  }

  getDate(date: any): any {
    if (!date) return null;
    return new Date(date.seconds * 1000);
  }

  // onDropExamen(droppedFile: FileList | any): void {
  //   this.loadingExamination.next(true);
  //   let droppedFiles = droppedFile.files;
  //   this.filesExamen = [];

  //   setTimeout(() => {
  //     for (let i = 0; i < droppedFiles.length; i++) {
  //       let newLocal: File | any;
  //       const newFile: File | any = new BehaviorSubject<File>(newLocal);
  //       this.filesExamen.push(newFile);
  //     }

  //     this.filesExamen.forEach((file, index) => {
  //       this.filesExamen[index].next(droppedFiles.item(index));
  //     });
  //   }, 300);
  // }

  // addNewImageExamen(image: object) {
  //   this.inputFileExamen.nativeElement.value = '';
  //   if (image) {
  //     this.imagesUploadExamen.push(image);
  //     this.loadingExamination.next(false);
  //   }
  // }

  // onDropVaccination(droppedFile: FileList | any): void {
  //   this.loadingVaccination.next(true);
  //   let droppedFiles = droppedFile.files;
  //   this.filesVaccination = [];

  //   setTimeout(() => {
  //     for (let i = 0; i < droppedFiles.length; i++) {
  //       let newLocal: File | any;
  //       const newFile: File | any = new BehaviorSubject<File>(newLocal);
  //       this.filesVaccination.push(newFile);
  //     }

  //     this.filesVaccination.forEach((file, index) => {
  //       this.filesVaccination[index].next(droppedFiles.item(index));
  //     });
  //   }, 300);
  // }

  // addNewImageVaccination(image: object) {
  //   this.inputFileVaccination.nativeElement.value = '';
  //   if (image) {
  //     this.imagesUploadVaccination.push(image);
  //     this.loadingVaccination.next(false);
  //   }
  // }

  // checkVaccinationDocument(): boolean {
  //   // Has previews file ?
  //   const hasFile = !!this.data.vaccinationCardFile?.fileURL;

  //   // Has all doses ?
  //   const hasAllDoses =
  //     !!this.collaboratorForm.get('firstDoseDate')?.value &&
  //     !!this.collaboratorForm.get('secondDoseDate')?.value &&
  //     !!this.collaboratorForm.get('thirdDoseDate')?.value;

  //   // has a new file ?
  //   const hasNewFile = !!this.docFileVaccination?.fileURL;

  //   // has all doses and a new file or old file ?
  //   return hasAllDoses && (hasFile || hasNewFile);
  // }

  // checkExaminationDocument(): boolean {
  //   // Has previews file ?
  //   const hasFile = !!this.data.medicalExaminationFile?.fileURL;

  //   // Has validity ?
  //   const hasValidityDate = !!this.collaboratorForm.get(
  //     'medicalExaminationDate'
  //   )?.value;

  //   // has a new file ?
  //   const hasNewFile = !!this.docFileExam?.fileURL;

  //   // has validity and a new file or old file ?
  //   return hasValidityDate && (hasFile || hasNewFile);
  // }

  save() {
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

    // check if vaccination file is omited
    // if (this.imagesUploadVaccination.length === 0 && !this.data.vaccinationCardFile) {
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

    // this.imagesUploadExamen.forEach((el: any) => {
    //   if (el != '') {
    //     this.docFileExam = el;
    //   }
    // });

    // this.imagesUploadVaccination.forEach((el: any) => {
    //   if (el != '') {
    //     this.docFileVaccination = el;
    //   }
    // });

    if (
      this.collaboratorForm.invalid
      // !this.checkExaminationDocument() ||
      // !this.checkVaccinationDocument()
    ) {
      this.loading.next(false);
      this.snackbar.open('🚨 Por favor, complete todos los campos', 'Aceptar', {
        duration: 6000,
      });
      return;
    }

    try {
      this.dashboardService
        .updateCollaborator(
          this.data.id,
          this.collaboratorForm.value
          // this.docFileExam,
          // this.docFileVaccination
        )
        .pipe(take(1))
        .subscribe((res) => {
          res
            .commit()
            .then(() => {
              this.snackbar.open('✅ Se actualizo correctamente', 'Aceptar', {
                duration: 5000,
              });
              this.loading.next(false);
              this.dialog.closeAll();
            })
            .catch((error) => {
              console.log(error);
              this.loading.next(false);
              this.snackbar.open('🚨 Hubo un error al agregar!', 'Aceptar', {
                duration: 5000,
              });
            });
        });
    } catch (error) {
      console.log('error', error);
      this.snackbar.open('🚨 Hubo un error!', 'Aceptar', {
        duration: 6000,
      });
    }
  }

  // deleteFileExamen(fileURL: string) {
  //   try {
  //     //this.loading.next(true);
  //     if (this.data) {
  //       this.dashboardService
  //         .deleteMedicalExamination(this.data.id)
  //         .pipe(take(1))
  //         .subscribe((res) => {
  //           res
  //             .commit()
  //             .then(() => {
  //               this.dashboardService.deleteFileStorage(fileURL);
  //               this.snackbar.open('✅ Se elimino correctamente', 'Aceptar', {
  //                 duration: 5000,
  //               });
  //               //this.loading.next(false);
  //               this.docFileExam = {} as UploadFile;
  //               // this.docFileVaccination = {} as UploadFile;
  //               this.data.medicalExaminationFile = {} as UploadFile;
  //             })
  //             .catch((err) => {
  //               //this.loading.next(false);
  //               this.snackbar.open('🚨 Hubo un error al agregar!', 'Aceptar', {
  //                 duration: 5000,
  //               });
  //             });
  //         });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  // deleteFileVaccination(fileURL: string) {
  //   try {
  //     //this.loading.next(true);
  //     if (this.data) {
  //       this.dashboardService
  //         .deleteVaccinationCard(this.data.id)
  //         .pipe(take(1))
  //         .subscribe((res) => {
  //           res
  //             .commit()
  //             .then(() => {
  //               this.dashboardService.deleteFileStorage(fileURL);
  //               this.snackbar.open('✅ Se elimino correctamente', 'Aceptar', {
  //                 duration: 5000,
  //               });
  //               //this.loading.next(false);
  //               // this.docFileExam = {} as UploadFile;
  //               this.docFileVaccination = {} as UploadFile;
  //               this.data.vaccinationCardFile = {} as UploadFile;
  //             })
  //             .catch((err) => {
  //               //this.loading.next(false);
  //               this.snackbar.open('🚨 Hubo un error al agregar!', 'Aceptar', {
  //                 duration: 5000,
  //               });
  //             });
  //         });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }
}
