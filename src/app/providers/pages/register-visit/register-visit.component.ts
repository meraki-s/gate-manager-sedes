import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { ResponsibleList } from 'src/app/admin/models/setting.model';
import { SettingService } from 'src/app/admin/services/settings.services';
import { UploadFile } from '../../models/register-collaborator';
import { ProviderService } from '../../services/providers.services';

@Component({
  selector: 'app-register-visit',
  templateUrl: './register-visit.component.html',
  styleUrls: ['./register-visit.component.scss'],
})
export class RegisterVisitComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  dataForm!: FormGroup;

  // upload image SCTR
  imagesUploadSCTR: UploadFile[] = [];
  imagesSCTR!: UploadFile;
  filesSCTR: BehaviorSubject<File | undefined | null>[] = [];
  pathStorageSCTR!: string;
  isHoveringSCTR!: boolean;

  // upload image COVID
  imagesUploadCOVID: UploadFile[] = [];
  imagesCOVID!: UploadFile;
  filesCOVID: BehaviorSubject<File>[] = [];
  pathStorageCOVID!: string;
  isHoveringCOVID!: boolean;

  // upload image vaccination card
  imagesUploadVaccinationCard: UploadFile[] = [];
  imagesVaccinationCard!: UploadFile;
  filesVaccinationCard: BehaviorSubject<File>[] = [];
  pathStorageVaccinationCard!: string;
  isHoveringVaccinationCard!: boolean;

  @ViewChild('uploadFileSCTR', { read: ElementRef }) inputFileSCTR!: ElementRef;
  @ViewChild('uploadFileCOVID', { read: ElementRef })
  inputFileCOVID!: ElementRef;
  @ViewChild('uploadFileVaccinationCard', { read: ElementRef })
  inputFileVaccinationCard!: ElementRef;

  subscription = new Subscription();
  isMobile!: boolean;

  inviteds$!: Observable<ResponsibleList[]>;

  constructor(
    private fb: FormBuilder,
    private providerService: ProviderService,
    private settingService: SettingService,
    private snackbar: MatSnackBar,
    private breakpoint: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.subscription.add(
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

    this.initform();

    this.inviteds$ = this.settingService.getAllListResponsible().pipe(
      tap((res) => {
        return res;
      })
    );

    this.pathStorageCOVID = `gateManager/covidFile/`;
    this.pathStorageSCTR = `gateManager/scrtFile/`;
    this.pathStorageVaccinationCard = `gateManager/vaccinationCardFile/`;
  }

  initform(): void {
    this.dataForm = this.fb.group({
      name: new FormControl(null, [Validators.required]),
      lastname: new FormControl(null, [Validators.required]),
      dni: new FormControl(null, [Validators.required]),
      jobTitle: new FormControl(null, [Validators.required]),
      telephone: new FormControl(null, [Validators.required]),
      visitDate: new FormControl(null, [Validators.required]),
      invitedBy: new FormControl(null, [Validators.required]),
      reasonVisit: new FormControl(null, [Validators.required]),
      // covidDate: new FormControl(null, [Validators.required]),
      // covidFile: new FormControl(null, [Validators.required]),
      sctrDate: new FormControl(null, [Validators.required]),
      sctrFile: new FormControl(null, [Validators.required]),
      vaccinationCardFile: new FormControl(null, [Validators.required]),
      firstDoseDate: new FormControl(null, [Validators.required]),
      secondDoseDate: new FormControl(null, [Validators.required]),
      thirdDoseDate: new FormControl(null, [Validators.required]),
    });
  }

  save(): void {
    this.imagesUploadSCTR.forEach((el: any) => {
      if (el != '') {
        this.imagesSCTR = el;
      }
    });

    this.imagesUploadCOVID.forEach((el: any) => {
      if (el != '') {
        this.imagesCOVID = el;
      }
    });

    this.imagesUploadVaccinationCard.forEach((el: any) => {
      if (el != '') {
        this.imagesVaccinationCard = el;
      }
    });

    try {
      if (this.dataForm.invalid) {
        this.dataForm.markAllAsTouched();
        this.loading.next(false);
        return;
      } else {
        this.providerService
          .registerVisit(
            this.dataForm.value,
            this.imagesSCTR ?? null,
            // this.imagesCOVID ?? null,
            this.imagesVaccinationCard ?? null
          )
          // .pipe(take(1))
          .subscribe((res) => {
            res
              .commit()
              .then(() => {
                this.snackbar.open(
                  '✅ Visita generada correctamente!',
                  'Aceptar',
                  {
                    duration: 10000,
                  }
                );
                this.loading.next(false);
                this.filesSCTR = [];
                this.filesCOVID = [];
                this.filesVaccinationCard = [];
                this.dataForm.reset();
                console.log('pristine');
              })
              .catch((err) => {
                this.snackbar.open('🚨 Hubo un error.', 'Aceptar', {
                  duration: 6000,
                });
              });
          });
      }
    } catch (error) {
      console.log(error);

      this.snackbar.open(
        '🚨 Hubo un error, debe de ingresar todos los datos requeridos',
        'Aceptar',
        {
          duration: 6000,
        }
      );
      this.loading.next(false);
    }
  }

  clear(): void {
    this.dataForm.reset();
    this.dataForm.markAsPristine();
    this.dataForm.updateValueAndValidity();
  }

  addNewImageSCTR(file: UploadFile): void {
    if (file.type === 'application/pdf') {
      this.inputFileSCTR.nativeElement.value = '';
      if (file) {
        this.imagesUploadSCTR.push(file);
      }
    } else {
      this.snackbar.open('🚨 Solo puede subir archivos PDF!', 'Aceptar', {
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

  addNewImageCOVID(file: UploadFile): void {
    if (file.type === 'application/pdf') {
      this.inputFileCOVID.nativeElement.value = '';
      if (file) {
        this.imagesUploadCOVID.push(file);
      }
    } else {
      this.snackbar.open('🚨 Solo puede subir archivos PDF!', 'Aceptar', {
        duration: 3000,
      });
    }
  }

  onDropCOVID(droppedFile: FileList | any): void {
    let droppedFiles = droppedFile.files;
    this.filesCOVID = [];

    setTimeout(() => {
      for (let i = 0; i < droppedFiles.length; i++) {
        let newLocal: File | any;
        const newFile: File | any = new BehaviorSubject<File>(newLocal);
        this.filesCOVID.push(newFile);
      }

      this.filesCOVID.forEach((file, index) => {
        this.filesCOVID[index].next(droppedFiles.item(index));
      });
    }, 300);
  }

  addNewImageVaccinationCard(file: UploadFile): void {
    if (file.type === 'application/pdf') {
      this.inputFileVaccinationCard.nativeElement.value = '';
      if (file) {
        this.imagesUploadVaccinationCard.push(file);
      }
    } else {
      this.snackbar.open('🚨 Solo puede subir archivos PDF!', 'Aceptar', {
        duration: 3000,
      });
    }
  }

  onDropVaccinationCard(droppedFile: FileList | any): void {
    let droppedFiles = droppedFile.files;
    this.filesVaccinationCard = [];

    setTimeout(() => {
      for (let i = 0; i < droppedFiles.length; i++) {
        let newLocal: File | any;
        const newFile: File | any = new BehaviorSubject<File>(newLocal);
        this.filesVaccinationCard.push(newFile);
      }

      this.filesVaccinationCard.forEach((file, index) => {
        this.filesVaccinationCard[index].next(droppedFiles.item(index));
      });
    }, 300);
  }
}
