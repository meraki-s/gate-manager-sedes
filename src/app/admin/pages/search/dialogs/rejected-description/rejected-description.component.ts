import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-rejected-description',
  templateUrl: './rejected-description.component.html',
  styleUrls: ['./rejected-description.component.scss'],
})
export class RejectedDescriptionComponent implements OnInit {
  descriptionControl = new FormControl('', Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: string,
    private dialogRef: MatDialogRef<RejectedDescriptionComponent>
  ) {}

  ngOnInit(): void {}

  block(): void {
    this.dialogRef.close(this.descriptionControl.value);
  }
}
