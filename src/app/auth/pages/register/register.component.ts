import {
  Component,
  OnInit,
  Input,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
// import { MediaObserver, MediaChange } from '@angular/flex-layout';
import {
  FormControl,
  FormGroup,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';
import { ProviderService } from '../../services/provider.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize, debounceTime } from 'rxjs/operators';
import { MatDialogRef } from '@angular/material/dialog';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  @Input() file!: File | undefined | any;
  @ViewChild('imageProvider') inputImageProvider?: ElementRef;
  @Output() onDeleteImage: EventEmitter<string> = new EventEmitter<string>();
  @Output() onNewImage: EventEmitter<object> = new EventEmitter<object>();

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  checkingRuc = new BehaviorSubject<boolean>(false);
  checkingRuc$ = this.checkingRuc.asObservable();

  mediaSub!: Subscription;
  deviceXs: boolean = false;
  deviceSm: boolean = false;
  isLinear = false;

  uploadPercent!: Observable<number | undefined> | undefined | null;
  snapshot!: Observable<any> | null;
  urlImage: string = '';
  public formSubmitted = false;

  firstFormGroup: FormGroup = this.fb.group(
    {
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required),
      password2: new FormControl('', Validators.required),
      name: new FormControl('', Validators.required),
      lastname: new FormControl('', Validators.required),
      dni: new FormControl('', Validators.required),
      charge: new FormControl('', Validators.required),
      phone: new FormControl('', Validators.required),
    },
    {
      validators: this.samePasswords('password', 'password2'),
    }
  );

  secondFormGroup: FormGroup = this.fb.group({
    companyName: new FormControl('', Validators.required),
    companyRuc: new FormControl('', Validators.required),
    companyAddress: new FormControl('', Validators.required),
    companyField: new FormControl('', Validators.required),
    salesRepresentative: new FormControl('', Validators.required),
    ceo: new FormControl('', Validators.required),
  });

  validRuc = false;
  rucMessage = '';

  constructor(
    // public mediaObserver: MediaObserver,
    private fb: FormBuilder,
    private providerService: ProviderService,
    private snackbar: MatSnackBar,
    private angularFireStorage: AngularFireStorage,
    public dialogRef: MatDialogRef<RegisterComponent>
  ) {}

  ngOnInit(): void {
    // this.mediaSub = this.mediaObserver.media$.subscribe(
    //   (result: MediaChange) => {
    //     console.log(result.mqAlias);
    //     this.deviceXs = result.mqAlias === 'xs' ? true : false;
    //     this.deviceSm = result.mqAlias === 'sm' ? true : false;
    //   }
    // );

    this.secondFormGroup
      .get('companyRuc')
      ?.valueChanges.pipe(debounceTime(1000))
      .subscribe((value) => {
        this.checkingRuc.next(true);

        const valueString = value + '';

        if (valueString.length < 11 || valueString.length > 11) {
          this.rucMessage = 'Ruc inválido';
          this.validRuc = false;
          this.checkingRuc.next(false);
        }

        if (valueString.length === 11) {
          // check if ruc exist in database
          this.providerService.checkRuc(value).subscribe((doc) => {
            if (doc.empty) {
              this.validRuc = true;
              this.rucMessage = '✅ RUC Válido';
            } else {
              this.validRuc = false;
              this.rucMessage = '❌ Este RUC ya existe';
            }

            this.checkingRuc.next(false);
          });
        }
      });
  }

  ngOnDestroy() {
    this.mediaSub.unsubscribe();
  }

  createProvider() {
    try {
      this.loading.next(true);
      if (
        this.firstFormGroup.invalid &&
        this.secondFormGroup.invalid &&
        this.urlImage === ''
      ) {
        this.firstFormGroup.markAllAsTouched();
        this.secondFormGroup.markAllAsTouched();
        return;
      }

      this.providerService
        .createUserProvider(
          this.firstFormGroup.value,
          this.secondFormGroup.value,
          this.urlImage
        )
        .subscribe(
          (resp) => {
            this.snackbar.open('✅ Usuario creado!', 'Aceptar', {
              duration: 6000,
            });

            this.dialogRef.close();
            this.loading.next(false);
          },
          (error) => {
            this.snackbar.open('🚨 Hubo un error.', 'Aceptar', {
              duration: 6000,
            });
          }
        );
    } catch (error) {
      console.log(error);

      this.snackbar.open(
        '🚨 Hubo un error, debe de ingresar todo los datos requeridos',
        'Aceptar',
        {
          duration: 6000,
        }
      );
      // this.loading.next(false);
    }

    this.formSubmitted = true;
  }

  invalidField(campo: string) {
    if (
      this.firstFormGroup.get(campo)?.invalid &&
      this.secondFormGroup.get(campo)?.invalid &&
      this.formSubmitted
    ) {
      return true;
    } else {
      return false;
    }
  }

  passwordInvalid() {
    const pass1 = this.firstFormGroup.get('password')?.value;
    const pass2 = this.firstFormGroup.get('password2')?.value;

    if (pass1 !== pass2 && this.formSubmitted) {
      return true;
    } else {
      return false;
    }
  }

  samePasswords(pass1Name: string, pass2Name: string) {
    return (formGroup: FormGroup) => {
      const pass1Control = formGroup.get(pass1Name);
      const pass2Control = formGroup.get(pass2Name);

      if (pass1Control?.value === pass2Control?.value) {
        pass2Control?.setErrors(null);
      } else pass2Control?.setErrors({ noEsIgual: true });
    };
  }

  onUpload(e: any) {
    const id = Math.random().toString(36).substring(2);
    const file = e.target.files[0];
    const filePath = `providers/logo_provider_${id}`;
    const ref = this.angularFireStorage.ref(filePath);
    const task = this.angularFireStorage.upload(filePath, file);

    this.uploadPercent = task.percentageChanges();
    task
      .snapshotChanges()
      .pipe(
        finalize(async () => {
          this.urlImage = await ref.getDownloadURL().toPromise();
          let data = {
            name: file.name,
            fileURL: this.uploadPercent,
            type: file.type,
          };
          this.onNewImage.emit(data);
        })
      )
      .subscribe();
  }

  deleteImage(url: string) {
    this.onDeleteImage.emit(url);

    if (url) {
      this.urlImage = '';
      this.uploadPercent = null;
      this.snapshot = null;
    }
  }
}
