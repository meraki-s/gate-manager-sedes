import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { LocationService } from 'src/app/admin/services/location.service';

@Component({
  selector: 'app-create-location',
  templateUrl: './create-location.component.html',
  styleUrls: ['./create-location.component.scss'],
})
export class CreateLocationComponent {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  locationNameControl = new FormControl('', Validators.required);

  constructor(
    private locationService: LocationService,
    private dialogRef: MatDialogRef<CreateLocationComponent>
  ) {}

  create(): void {
    if (!this.locationNameControl.valid) return;
    this.loading.next(true);

    this.locationService
      .createLocation(this.locationNameControl.value!)
      .subscribe((res) => {
        if (res) {
          this.loading.next(false);
          this.dialogRef.close(true);
        }
      });
  }
}
