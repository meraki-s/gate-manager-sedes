import {
  Component,
  ElementRef,
  Inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { UploadFile } from 'src/app/providers/models/register-collaborator';

@Component({
  selector: 'app-visor-pdf',
  templateUrl: './visor-pdf.component.html',
  styleUrls: ['./visor-pdf.component.scss'],
})
export class VisorPdfComponent implements OnInit {
  url: SafeResourceUrl | undefined;

  constructor(
    public dialogRef: MatDialogRef<VisorPdfComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UploadFile & string,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.dialogRef.disableClose = false;
  }

  getUrlSnippet() {
    return (
      this.sanitizer.bypassSecurityTrustResourceUrl(
        this.data.fileURL ? this.data.fileURL : this.data
      )
    );
  }
}
