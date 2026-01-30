import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-recovery',
  templateUrl: './recovery.component.html',
  styleUrls: ['./recovery.component.scss'],
})
export class RecoveryComponent {
  email = new FormControl('', [Validators.required, Validators.email]);

  constructor(private auth: AuthService) {}

  send(): void {
    if (!this.email.valid) return;

    this.auth.sendResetPassword(this.email.value!);
  }
}
