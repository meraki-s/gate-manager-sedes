import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Subscription } from 'rxjs';
import { UsersService } from 'src/app/admin/services/users.service';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss'],
})
export class CreateUserComponent implements OnInit, OnDestroy {
  //#region controllers
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
      role: new FormControl('', Validators.required),
    },
    {
      validators: this.samePasswords('password', 'password2'),
    }
  );
  //#region

  //#region observables
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();
  //#endregion

  //#region other variables
  isLinear = false;
  formSubmitted = false;

  subscriptions = new Subscription();
  isMobile!: boolean;
  //#endregion

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private snackbar: MatSnackBar,
    public dialogRef: MatDialogRef<CreateUserComponent>,
    private breakpoint: BreakpointObserver
  ) {}

  ngOnInit(): void {
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
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  invalidField(campo: string) {
    if (this.firstFormGroup.get(campo)?.invalid && this.formSubmitted) {
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

  createUser() {
    this.loading.next(true);
    this.usersService.createUser(this.firstFormGroup.value).subscribe((res) => {
      if (res.ok) {
        this.snackbar.open('✅ Usuario creado con éxito', 'Cerrar', {
          duration: 3000,
        });
        this.loading.next(false);
        this.dialogRef.close();
      } else {
        this.loading.next(false);
      }
    });
  }
}
