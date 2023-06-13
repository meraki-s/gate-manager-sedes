import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { tap, take } from 'rxjs/operators';
import { SettingService } from 'src/app/admin/services/settings.services';
import { ProviderService } from 'src/app/providers/services/providers.services';
import { ResponsibleList } from '../../../../../admin/models/setting.model';
import { RegisterVisit } from '../../../../models/register-visit.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UploadFile } from '../../../../models/register-collaborator';
import { User } from '../../../../../auth/models/user.model';
import { AuthService } from '../../../../../auth/services/auth.service';

@Component({
  selector: 'app-edit-visit-dialog',
  templateUrl: './edit-visit-dialog.component.html',
  styleUrls: ['./edit-visit-dialog.component.scss'],
})
export class EditVisitDialogComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  // upload image SCTR
  imagesUploadSCTR: object[] = [];
  imagesSCTR!: any;
  filesSCTR: BehaviorSubject<File | undefined | null>[] = [];
  pathStorageSCTR!: string;
  isHoveringSCTR!: boolean;

  // upload image COVID
  imagesUploadCOVID: object[] = [];
  imagesCOVID!: any;
  filesCOVID: BehaviorSubject<File>[] = [];
  pathStorageCOVID!: string;
  isHoveringCOVID!: boolean;
  @ViewChild('uploadFileSCTR', { read: ElementRef }) inputFileSCTR!: ElementRef;
  @ViewChild('uploadFileCOVID', { read: ElementRef })
  inputFileCOVID!: ElementRef;

  inviteds$!: Observable<ResponsibleList[]>;
  image!: any;
  docFile!: UploadFile | null;
  user!: User | any;
  subscriptions = new Subscription();

  dataForm: FormGroup = this.fb.group({
    name: [this.data.name, Validators.required],
    lastname: [this.data.lastname, Validators.required],
    dni: [this.data.dni, Validators.required],
    jobTitle: [this.data.jobTitle, Validators.required],
    telephone: [this.data.telephone, Validators.required],
    visitDate: [this.data.visitDate.toDate(), Validators.required],
    invitedBy: [this.data.invitedBy, Validators.required],
    reasonVisit: [this.data.reasonVisit, Validators.required],
    // covidFile: [''],
    // covidDate: [this.data.covidDate.toDate(), Validators.required],
    sctrFile: [''],
    sctrDate: [this.data.sctrDate.toDate(), Validators.required],
  });
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RegisterVisit,
    private fb: FormBuilder,
    private settingService: SettingService,
    private providerService: ProviderService,
    private authService: AuthService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.imagesSCTR = this.data.sctrFile;
    // this.imagesCOVID = this.data.covidFile;

    this.inviteds$ = this.settingService.getAllListResponsible().pipe(
      tap((res) => {
        return res;
      })
    );

    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        this.user = user;
      })
    );
  }

  getDate(date: any): any {
    return new Date(date.seconds * 1000);
  }

  addNewImageCOVID(image: object): void {
    this.inputFileCOVID.nativeElement.value = '';
    if (image) {
      this.imagesUploadCOVID.push(image);
    }
  }

  onDropCovid(droppedFile: FileList | any): void {
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

  deleteFileCovid(fileURL: string) {
    try {
      //this.loading.next(true);
      if (this.data) {
        this.providerService
          .deleteFileCovid(this.data.id)
          .pipe(take(1))
          .subscribe((res) => {
            res
              .commit()
              .then(() => {
                this.providerService.deleteFileStorage(fileURL);
                this.snackbar.open('✅ Se elimino correctamente', 'Aceptar', {
                  duration: 5000,
                });
                //this.loading.next(false);
                this.imagesCOVID = '';
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

  deleteFileSCTR(fileURL: string) {
    try {
      //this.loading.next(true);
      if (this.data) {
        this.providerService
          .deleteFileSCTR(this.data.id)
          .pipe(take(1))
          .subscribe((res) => {
            res
              .commit()
              .then(() => {
                this.providerService.deleteFileStorage(fileURL);
                this.snackbar.open('✅ Se elimino correctamente', 'Aceptar', {
                  duration: 5000,
                });
                //this.loading.next(false);
                this.imagesSCTR = '';
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

  addNewImageSCTR(image: object): void {
    this.inputFileSCTR.nativeElement.value = '';
    if (image) {
      this.imagesUploadSCTR.push(image);
    }
  }

  save() {
    this.imagesUploadCOVID.forEach((el: any) => {
      if (el != '') {
        this.imagesCOVID = el;
      }
    });
    this.imagesUploadSCTR.forEach((el: any) => {
      if (el != '') {
        this.imagesSCTR = el;
      }
    });

    try {
      this.providerService
        .updateVisit(
          this.data.id,
          this.dataForm.value,
          // this.imagesCOVID,
          this.imagesSCTR
        )
        .pipe(take(1))
        .subscribe((batch) => {
          batch
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
}
