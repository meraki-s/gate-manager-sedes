import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, of } from 'rxjs';
import { SwornDeclaration } from '../models/dashboard.model';
import { ShortUser } from 'src/app/auth/models/user.model';
import { Collaborator, UploadFile } from '../models/register-collaborator';
import { switchMap, take } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';

import * as firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root',
})
export class SwornDeclarationService {
  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private authservice: AuthService
  ) {}

  /**
   * Get all provider's collaborators
   *
   * @return {*}  {Observable<Collaborator[]>}
   * @memberof SwornDeclarationService
   */
  getAllCollaborators(): Observable<Collaborator[]> {
    return this.authservice.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) return of([]);

        return this.afs
          .collection<Collaborator>(
            `db/ferreyros/providers/${user.providerId}/collaborators`,
            (ref) => ref.orderBy('lastname', 'asc')
          )
          .valueChanges();
      })
    );
  }

  /**
   * Register a new sworn declaration
   *
   * @param {SwornDeclaration} form - Sworn declaration form
   * @param {Array<CollaboratorList>} collaboratorList - Collaborator list
   * @param {string} url - File URL
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof SwornDeclarationService
   */
  swornDeclarationRegister(
    form: SwornDeclaration,
    collaboratorList: Array<Collaborator>,
    swornDeclarationFile: UploadFile
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authservice.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();

        // check if user is defined
        if (!user) return of(batch);

        // create reference for document in evaluation entries collection
        const swornDeclarationDocRef = this.afs.firestore
          .collection(
            `/db/ferreyros/providers/${user.providerId}/swornDeclarationList`
          )
          .doc();

        const data: Partial<SwornDeclaration> = {
          id: swornDeclarationDocRef.id,
          createdBy: user,
          createdAt:
            firebase.default.firestore.FieldValue.serverTimestamp() as Date &
              firebase.default.firestore.Timestamp,
          code: form.code,
          validityDate: form.validityDate,
          swornDeclarationFile: swornDeclarationFile,
          collaborators: collaboratorList,
        };

        batch.set(swornDeclarationDocRef, data);

        // correlate sworn declaration with collaborators
        collaboratorList.forEach((collaborator) => {
          const collaboratorDocRef = this.afs.firestore
            .collection(
              `/db/ferreyros/providers/${user.providerId}/collaborators`
            )
            .doc(collaborator.id);

          batch.update(collaboratorDocRef, {
            swornDeclarationId: swornDeclarationDocRef.id,
            swornDeclarationFile: swornDeclarationFile,
            swornDeclarationDate: form.validityDate,
            swornDeclarationStatus: 'approved',
          });
        });

        return of(batch);
      })
    );
  }

  /**
   * Get all the sworn declarations
   *
   * @param {string} providerId - Provider ID
   * @return {*}  {Observable<SwornDeclaration[]>}
   * @memberof SwornDeclarationService
   */
  getAllSwornDeclarationDocuments(): Observable<SwornDeclaration[]> {
    return this.authservice.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) return of([]);

        return this.afs
          .collection<SwornDeclaration>(
            `/db/ferreyros/providers/${user.providerId}/swornDeclarationList`,
            (ref) => ref.orderBy('createdAt', 'desc')
          )
          .valueChanges();
      })
    );
  }

  /**
   * Delete a sworn declaration file
   *
   * @param {string} swornDeclarationId - Sworn declaration ID
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof SwornDeclarationService
   */
  deleteFileSwornDeclaration(
    swornDeclarationId: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authservice.user$.pipe(
      take(1),
      switchMap((user) => {
        const batch = this.afs.firestore.batch();

        // check if user is defined
        if (!user) return of(batch);

        const sctDocRef = this.afs.firestore.doc(
          `/db/ferreyros/providers/${user.providerId}/swornDeclarationList/${swornDeclarationId}`
        );

        const data: Partial<SwornDeclaration> = {
          swornDeclarationFile: {
            fileURL: '',
            name: '',
            type: '',
          },
        };

        batch.update(sctDocRef, data);

        return of(batch);
      })
    );
  }

  /**
   * Delete a file from storage
   *
   * @param {string} url - File URL
   * @return {*}  {Promise<any>}
   * @memberof SwornDeclarationService
   */
  async deleteFileStorage(url: string | null): Promise<void> {
    if (!url) return Promise.resolve();
    return await this.storage.storage.refFromURL(url).delete();
  }

  /**
   * Update a sworn declaration
   *
   * @param {*} swornDeclarationId - Sworn declaration ID
   * @param {SwornDeclaration} form - Sworn declaration form
   * @param {Array<CollaboratorList>} collaboratorList - Collaborator list
   * @param {string} url - File URL
   * @param {User} user - User data
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof SwornDeclarationService
   */
  swornDeclarationUpdate(
    swornDeclarationId: any,
    form: SwornDeclaration,
    collaboratorList: Array<Collaborator>,
    swornDeclarationFile: UploadFile | null
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authservice.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();

        // check if user is defined
        if (!user) return of(batch);

        const swornDeclarationDocRef = this.afs.firestore.doc(
          `/db/ferreyros/providers/${user.providerId}/swornDeclarationList/${swornDeclarationId}`
        );

        const shortUser: ShortUser = {
          displayName: user.displayName,
          uid: user.uid,
        };

        const data: Partial<SwornDeclaration> = {
          editedBy: shortUser,
          editedAt: new Date() as Date & firebase.default.firestore.Timestamp,
          code: form.code,
          validityDate: form.validityDate,
          swornDeclarationFile: swornDeclarationFile,
          collaborators: collaboratorList,
        };

        batch.update(swornDeclarationDocRef, data);

        // correlate sworn declaration with collaborators
        collaboratorList.forEach((collaborator) => {
          const collaboratorDocRef = this.afs.firestore
            .collection(
              `/db/ferreyros/providers/${user.providerId}/collaborators`
            )
            .doc(collaborator.id);

          batch.update(collaboratorDocRef, {
            swornDeclarationFile: swornDeclarationFile,
            swornDeclarationDate: form.validityDate,
            swornDeclarationStatus: 'approved',
          });
        });

        return of(batch);
      })
    );
  }

  /**
   * Delete a sworn declaration
   *
   * @param {string} providerId - Provider ID
   * @param {string} swornDeclaratioId - Sworn declaration ID
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof SwornDeclarationService
   */
  deleteSwornDeclaration(
    providerId: string,
    swornDeclaratioId: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    // create batch
    const batch = this.afs.firestore.batch();

    const docRef = this.afs.firestore.doc(
      `db/ferreyros/providers/${providerId}/swornDeclarationList/${swornDeclaratioId}`
    );

    batch.delete(docRef);

    return of(batch);
  }
}
