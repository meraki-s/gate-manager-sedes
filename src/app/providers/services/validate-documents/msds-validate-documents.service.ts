import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, of } from 'rxjs';
import { ShortUser, User } from 'src/app/auth/models/user.model';
import { ValidateDocumentsModel } from '../../models/validate-documents.model';
import { shareReplay, switchMap, take } from 'rxjs/operators';

import * as firebase from 'firebase/compat/app';
import { AuthService } from 'src/app/auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class MsdsValidateDocumentsService {
  constructor(
    private afs: AngularFirestore,
    private authService: AuthService,
    private afAuth: AngularFireAuth
  ) {}

  getAllValidateDocumentsMsdsDesc(): Observable<ValidateDocumentsModel[]> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        return this.afs
          .collection<ValidateDocumentsModel>(
            `/db/ferreyros/providers/${user?.providerId}/msdsDocumentsValidate`,
            (ref) => ref.orderBy('validityDate', 'desc')
          )
          .valueChanges();
      })
    );
  }

  getAllValidateDocumentsMsdsAsc(
    id: string | null | undefined
  ): Observable<ValidateDocumentsModel[]> {
    return this.afs
      .collection<ValidateDocumentsModel>(
        `/db/ferreyros/providers/${id}/msdsDocumentsValidate`,
        (ref) => ref.orderBy('validityDate', 'asc')
      )
      .valueChanges();
  }

  addValidateDocumentsMsds(
    list: ValidateDocumentsModel[]
  ): Observable<firebase.default.firestore.WriteBatch[]> {
    let batchCount = Math.ceil(list.length / 500);
    let batchArray: firebase.default.firestore.WriteBatch[] = [];

    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        // check if user is defined
        if (!user) return of([]);

        for (let index = 0; index < batchCount; index++) {
          const batch = this.afs.firestore.batch();
          let limit =
            500 * (index + 1) > list.length ? list.length : 500 * (index + 1);
          for (let j = 500 * index; j < limit; j++) {
            if (list[j].id === null) {
              const validateDocumentsMsdsDocRef = this.afs.firestore
                .collection(
                  `/db/ferreyros/providers/${user.providerId}/msdsDocumentsValidate/`
                )
                .doc();

              const shortUser: ShortUser = {
                uid: user.uid,
                displayName: user.name,
              };

              const data: Partial<ValidateDocumentsModel> = {
                id: validateDocumentsMsdsDocRef.id,
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
              batch.set(validateDocumentsMsdsDocRef, data);
            }
          }
          batchArray.push(batch);
        }
        return of(batchArray);
      })
    );
  }

  deleteValidateDocumentsMsds(
    idFromDelete: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        const batch = this.afs.firestore.batch();

        // check if user is defined
        if (!user) return of(batch);

        const validateDocumentsMsdsDocRef = this.afs.firestore.doc(
          `/db/ferreyros/providers/${user.providerId}/msdsDocumentsValidate/${idFromDelete}`
        );
        batch.delete(validateDocumentsMsdsDocRef);
        return of(batch);
      })
    );
  }

  getUser(): Observable<User | undefined> {
    return this.afAuth.authState.pipe(
      switchMap((user) => {
        return this.afs
          .collection<User>('users')
          .doc(`${user?.uid}`)
          .valueChanges();
      }),
      shareReplay(1),
      take(1)
    );
  }
}
