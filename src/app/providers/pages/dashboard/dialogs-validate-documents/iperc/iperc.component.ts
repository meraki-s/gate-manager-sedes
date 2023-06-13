import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/auth/services/auth.service';
import { User } from 'src/app/auth/models/user.model';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IpercValidateDocumentsService } from 'src/app/providers/services/validate-documents/iperc-validate-documents.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { VisorPdfComponent } from 'src/app/shared/components/visor-pdf/visor-pdf.component';
import { ValidateDocumentsModel } from 'src/app/providers/models/validate-documents.model';
import { CommonDocumentsValidateService } from 'src/app/providers/services/validate-documents/common-documents-validate.service';

@Component({
  selector: 'app-iperc',
  templateUrl: './iperc.component.html',
  styleUrls: ['./iperc.component.scss'],
})
export class IpercComponent implements OnInit, OnDestroy {
  @ViewChildren('uploadFile', { read: ElementRef })
  uploadFile!: QueryList<ElementRef>;

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  dataForm: FormGroup = new FormGroup({
    archive: this.fb.array([]),
  });

  pathStorage!: string;
  user: User | null | undefined = null;
  start_date: Date = new Date();
  subscription = new Subscription();
  validateDocuments$!: Observable<ValidateDocumentsModel[]>;

  validateDocuments: ValidateDocumentsModel[] = [];

  constructor(
    private storage: AngularFireStorage,
    private fb: FormBuilder,
    public authService: AuthService,
    private ipercValidateDocumentsService: IpercValidateDocumentsService,
    public dialogRef: MatDialogRef<IpercComponent>,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private commonDocumentsValidateService: CommonDocumentsValidateService
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.authService.user$.subscribe((user) => {
        this.pathStorage = `providers/${this.user?.uid}/iperc-pdf/`;
      })
    );

    this.validateDocuments$ = this.ipercValidateDocumentsService
      .getAllValidateDocumentsIpercDesc()
      .pipe();
  }

  addControl(): void {
    const group = this.fb.group({
      id: [null],
      file: [null, Validators.required],
      validityDate: [null, Validators.required],
      fileURL: [null],
      name: [null],
      type: [null],
      uploadPercent: [null],
      status: ['pending'],
    });
    this.archive.insert(0, group);
    this.dataForm.markAllAsTouched();
  }

  save() {
    this.loading.next(true);
    if (this.archive.controls.length === 0) {
      this.subscription.unsubscribe();
      this.snackbar.open('✅ Datos guardados correctamente!', 'Aceptar', {
        duration: 6000,
      });
      this.loading.next(false);
      this.dialogRef.close();
    }
    if (this.dataForm.invalid) {
      this.dataForm.markAllAsTouched();
      this.snackbar.open('Campos requeridos!', 'Aceptar', {
        duration: 3000,
      });
      this.loading.next(false);
      return;
    }
    try {
      this.subscription.add(
        this.ipercValidateDocumentsService
          .addValidateDocumentsIperc(this.archive.value)
          .subscribe((batchArray) => {
            if (batchArray.length > 0) {
              this.archive.clear();
              batchArray.forEach((batch) => {
                batch
                  .commit()
                  .then(() => {
                    this.loading.next(false);
                    this.snackbar.open(
                      '✅ Datos guardados correctamente!',
                      'Aceptar',
                      {
                        duration: 6000,
                      }
                    );
                    this.subscription.unsubscribe();
                    this.dialogRef.close();
                  })
                  .catch((err) => {
                    console.log(err);
                    this.loading.next(false);
                    this.snackbar.open(
                      '🚨 Hubo un error guardando los datos.',
                      'Aceptar',
                      {
                        duration: 6000,
                      }
                    );
                  });
              });
            }
          })
      );
    } catch (error) {
      this.loading.next(false);
      this.snackbar.open('🚨 Hubo un error guardando los datos.', 'Aceptar', {
        duration: 6000,
      });
      console.log(error);
    }
  }

  async delete(index: number, item?: ValidateDocumentsModel) {
    let id;
    this.loading.next(true);
    try {
      if (item) {
        id = item.id;
        await this.commonDocumentsValidateService.deletePdf(item.fileURL);
      } else {
        id = this.archive.controls[index].get('id')?.value;
        await this.commonDocumentsValidateService.deletePdf(
          this.archive.controls[index].get('fileURL')?.value
        );
      }
    } catch (error) {
      console.log(error);
    }
    try {
      this.subscription.add(
        this.ipercValidateDocumentsService
          .deleteValidateDocumentsIperc(id)
          .subscribe((batch) => {
            if (batch) {
              batch
                .commit()
                .then(() => {
                  this.loading.next(false);
                  if (!item) {
                    this.archive.removeAt(index);
                  }
                  this.snackbar.open(
                    '✅ Datos borrados correctamente!',
                    'Aceptar',
                    {
                      duration: 6000,
                    }
                  );
                })
                .catch((err) => {
                  this.loading.next(false);
                  console.log(err);
                  this.snackbar.open(
                    '🚨 Hubo un error borrando los datos.',
                    'Aceptar',
                    {
                      duration: 6000,
                    }
                  );
                });
            }
          })
      );
    } catch (error) {
      this.loading.next(false);
      console.log(error);
      this.snackbar.open('🚨 Hubo un error borrando los datos.', 'Aceptar', {
        duration: 6000,
      });
      this.archive.removeAt(index);
    }
  }

  startUpload(event: any, index: number): void {
    const file = event.target.files[0];
    this.archive.controls[index].get('name')?.setValue(file.name);
    this.archive.controls[index].get('type')?.setValue(file.type);
    const filePath = `${this.pathStorage}-${new Date()}-${file.name}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);
    const uploadPercent$ = task.percentageChanges();
    this.subscription.add(
      uploadPercent$.subscribe((uploadPercent) => {
        this.archive.controls[index]
          .get('uploadPercent')
          ?.setValue(uploadPercent);
      })
    );
    task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          this.subscription.add(
            fileRef.getDownloadURL().subscribe((url) => {
              this.archive.controls[index].get('fileURL')?.setValue(url);
            })
          );
        })
      )
      .subscribe();
  }

  openFileArchive(index: number) {
    this.dataForm.markAllAsTouched();
    this.uploadFile.forEach((el: ElementRef, i) => {
      if (index === i) {
        el.nativeElement.click();
        return;
      }
    });
  }

  async closeDialog() {
    if (this.validateDocuments.length === 0) {
      this.subscription.unsubscribe();
      this.dialogRef.close();
      return;
    }
    for (let [index, val] of this.validateDocuments.entries()) {
      try {
        await this.commonDocumentsValidateService.deletePdf(val.fileURL);
        this.subscription.unsubscribe();
        this.dialogRef.close();
      } catch (error) {
        console.log(error);
        this.subscription.unsubscribe();
        this.dialogRef.close();
      }
    }
  }

  validityDate(item?: ValidateDocumentsModel | any) {
    return this.commonDocumentsValidateService.validityDate(item);
  }

  insertDateMateInput(item: any) {
    return new Date(item.validityDate['seconds'] * 1000);
  }

  addEventDate(event: MatDatepickerInputEvent<Date>, index: number) {
    const oldDate = event?.value;
    let newDate = new Date(oldDate!);
    newDate.setHours(23, 59, 59, 59);
    this.archive.controls[index].get('validityDate')?.setValue(newDate);
  }

  openVizorPdf(index: number, item?: ValidateDocumentsModel) {
    let fileURL;
    if (item) {
      fileURL = item.fileURL;
    } else {
      fileURL = this.archive.controls[index].get('fileURL')?.value;
    }

    this.dialog.open(VisorPdfComponent, {
      width: '100%',
      data: fileURL,
      panelClass: 'border-dialog',
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get archive(): FormArray {
    return this.dataForm.get('archive') as FormArray;
  }
}
