import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { ShortUser } from 'src/app/auth/models/user.model';
import { ValidateDocumentsModel } from '../../models/validate-documents.model';
import { switchMap, take } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';

import * as firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root',
})
export class CertificatesValidateDocumentsService {

  constructor(
    private afs: AngularFirestore,
    private authService: AuthService
  ) {}

  getAllValidateDocumentsCertificatesDesc(): Observable<ValidateDocumentsModel[]> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        return this.afs
          .collection<ValidateDocumentsModel>(
            `/db/ferreyros/providers/${user?.providerId}/certificatesDocumentsValidate`,
            (ref) => ref.orderBy('validityDate', 'desc')
          )
          .valueChanges();
      })
    );
  }

  getAllValidateDocumentsCertificatesAsc(
    id: string | null | undefined
  ): Observable<ValidateDocumentsModel[]> {
    return this.afs
      .collection<ValidateDocumentsModel>(
        `/db/ferreyros/providers/${id}/certificatesDocumentsValidate`,
        (ref) => ref.orderBy('validityDate', 'asc')
      )
      .valueChanges();
  }

  addValidateDocumentsCertificates(
    list: ValidateDocumentsModel[]
  ): Observable<firebase.default.firestore.WriteBatch[]> {
    let batchCount = Math.ceil(list.length / 500);
    let batchArray: firebase.default.firestore.WriteBatch[] = [];

    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        // check if user is undefined
        if (!user) return of([]);

        for (let index = 0; index < batchCount; index++) {
          const batch = this.afs.firestore.batch();
          let limit =
            500 * (index + 1) > list.length ? list.length : 500 * (index + 1);
          for (let j = 500 * index; j < limit; j++) {
            if (list[j].id === null) {
              const validateDocumentsCertificatesDocRef = this.afs.firestore
                .collection(
                  `/db/ferreyros/providers/${user.providerId}/certificatesDocumentsValidate/`
                )
                .doc();

              const shortUser: ShortUser = {
                uid: user.uid,
                displayName: user.name,
              };

              const data: Partial<ValidateDocumentsModel> = {
                id: validateDocumentsCertificatesDocRef.id,
                validityDate: list[j].validityDate,
                fileURL: list[j].fileURL,
                name: list[j].name,
                type: list[j].type,
                uploadPercent: list[j].uploadPercent,
                createdAt:
                  firebase.default.firestore.FieldValue.serverTimestamp() as Date &
                    firebase.default.firestore.Timestamp,
                createdBy: shortUser,
                status: list[j].status,
              };
              batch.set(validateDocumentsCertificatesDocRef, data);
            }
          }
          batchArray.push(batch);
        }
        return of(batchArray);
      })
    );
  }

  deleteValidateDocumentsCertificates(
    idFromDelete: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        const batch = this.afs.firestore.batch();

        // check if user is defined
        if (!user) return of(batch);

        const validateDocumentsCertificatesDocRef = this.afs.firestore.doc(
          `/db/ferreyros/providers/${user.providerId}/certificatesDocumentsValidate/${idFromDelete}`
        );
        batch.delete(validateDocumentsCertificatesDocRef);
        return of(batch);
      })
    );
  }
}
