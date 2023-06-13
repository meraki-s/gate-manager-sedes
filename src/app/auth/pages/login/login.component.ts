import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { RegisterComponent } from '../register/register.component';
import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  loginFormGroup: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  public login(): void {
    this.loading.next(true);
    if (this.loginFormGroup.valid) {
      this.authService
        .login(this.loginFormGroup.value)
        .then((user) => {
          if (typeof user !== 'string') {
            this.loading.next(false);
            this.authService.user$.pipe(take(1)).subscribe((user) => {
              switch (user?.role) {
                case 'Administrator':
                  this.router.navigate(['/admin/search']);
                  break;
                case 'Vigilant':
                  this.router.navigate(['/personal/access-control']);
                  break;
                case 'Provider':
                  this.router.navigate(['/providers/dashboard']);
                  break;
                case 'Superuser':
                  this.router.navigate(['/admin/search']);
                  break;
                default:
                  console.log('Role nor assigned!');

                  break;
              }
            });
          } else {
            this.loading.next(false);
            this.snackbar.open(`🚨 ${user}`, 'Aceptar', { duration: 3000 });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      this.loading.next(false);
      this.snackbar.open('Debes completar todos los campos.', 'Aceptar', {
        duration: 3000,
      });
    }
  }

  public register() {
    const a = this.dialog.open(RegisterComponent, {
      width: '90vw',
      maxWidth: '500px',
    });
  }

  passwordRecovery(): void {
    //
  }
}
