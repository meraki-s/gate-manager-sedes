import { Component, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UploadFile } from 'src/app/providers/models/register-collaborator';

@Component({
  selector: 'app-upload-files',
  templateUrl: './upload-files.component.html',
  styleUrls: ['./upload-files.component.scss']
})
export class UploadFilesComponent implements OnInit,OnDestroy {

  @Input() file!: File | undefined | any;
  @Input() pathStorage!: string ;

  @Output() onNewImage: EventEmitter<UploadFile> = new EventEmitter<UploadFile>();
  @Output() onDeleteImage: EventEmitter<string> = new EventEmitter<string>();

  task!: AngularFireUploadTask;

  percentage: Observable<number | undefined> | undefined | null;
  snapshot!: Observable<any > | null ;
  downloadURL!: string ;

  subcription = new Subscription();
  constructor(private storage: AngularFireStorage) {}

  ngOnInit(): void {
    this.startUpload();
  }

  startUpload(): void {
    const result: File |undefined | any = this.file;
    const path = `${this.pathStorage}-${new Date()}-${result.name}`;
    const ref = this.storage.ref(path);
    this.task = this.storage.upload(path, result);
    this.percentage = this.task.percentageChanges();
    this.snapshot = this.task.snapshotChanges().pipe(
      finalize(async () => {
        this.downloadURL = await ref.getDownloadURL().toPromise();
        let data ={
          name:this.file.name,
          fileURL:this.downloadURL,
          type:this.file.type
        };

        this.onNewImage.emit(data);
      })
    );
  }

  isActive(snapshot:any): boolean {
    return (
      snapshot.state === 'running' &&
      snapshot.bytesTransferred < snapshot.totalBytes
    );
  }

  ngOnDestroy(): void {
    this.subcription.unsubscribe();
  }

  deleteImage(url:string): void {
    this.onDeleteImage.emit(url);

    if (url) {
      this.downloadURL = '';
      this.percentage  = null;
      this.snapshot = null;
    }
  }

}
