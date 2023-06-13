import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { finalize, switchMap, take } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';
import { DashboardService } from '../../services/dashboard.services';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  //#region controllers
  companyFormGroup!: FormGroup;
  //#endregion

  //#region observables
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  //#endregion

  //#region other variables
  uploadPercent!: Observable<number | undefined>;
  snapshot!: Observable<any>;
  urlImage: string = '';
  providerId!: string;

  subscriptions = new Subscription();
  isMobile!: boolean;
  //#endregion

  constructor(
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private angularFireStorage: AngularFireStorage,
    private breakpoint: BreakpointObserver,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private afs: AngularFirestore
  ) {}

  ngOnInit(): void {
    this.formInit();

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

    this.authService.user$
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user) return of(null);
          this.providerId = user.providerId;
          return this.dashboardService.getProvider(user.providerId);
        })
      )
      .subscribe((provider) => {
        if (provider) {
          this.companyFormGroup.patchValue({
            companyName: provider.companyName,
            companyRuc: provider.companyRuc,
            companyAddress: provider.companyAddress,
            companyField: provider.companyField,
            salesRepresentative: provider.salesRepresentative,
            manager: provider.manager,
          });

          this.urlImage = provider.companyLogoURL;
        }
      });
  }

  formInit(): void {
    this.companyFormGroup = this.fb.group({
      companyName: ['', Validators.required],
      companyRuc: ['', Validators.required],
      companyAddress: ['', Validators.required],
      companyField: ['', Validators.required],
      companyLogo: ['', Validators.required],
      salesRepresentative: ['', Validators.required],
      manager: ['', Validators.required],
    });
  }

  deleteImage(url: string): void {
    if (url) {
      this.urlImage = '';
      this.uploadPercent = of(undefined);
      this.snapshot = of(null);
    }
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
          // ref.getDownloadURL().subscribe((url) => {
          //   this.urlImage = url;

          // });
          // this.onNewImage.emit(data);
        })
      )
      .subscribe();
  }

  update(): void {
    this.loading.next(true);

    this.afs
      .doc(`db/ferreyros/providers/${this.providerId}`)
      .update({
        companyName: this.companyFormGroup.value.companyName,
        companyRuc: this.companyFormGroup.value.companyRuc,
        companyAddress: this.companyFormGroup.value.companyAddress,
        companyField: this.companyFormGroup.value.companyField,
        companyLogoURL: this.urlImage,
        salesRepresentative: this.companyFormGroup.value.salesRepresentative,
        manager: this.companyFormGroup.value.manager,
      })
      .then(() => {
        this.loading.next(false);
        this.snackbar.open('✅ Perfil actualizado correctamente', 'Aceptar', {
          duration: 6000,
        });
      });
  }
}
