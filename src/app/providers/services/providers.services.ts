import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, of } from 'rxjs';
import { RegisterVisit } from '../models/register-visit.model';
import { Collaborator, UploadFile } from '../models/register-collaborator';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { ShortUser } from '../../auth/models/user.model';
import { AuthService } from 'src/app/auth/services/auth.service';

import * as firebase from 'firebase/compat/app';
import { Provider } from 'src/app/auth/models/provider.model';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private authSevice: AuthService
  ) { }
  
  getAllCollaborators(): Observable<Collaborator[]> {
    const groupCollectionRef = this.afs.collectionGroup<Collaborator>('collaborators', ref => ref.orderBy('companyName', 'desc'));
    return groupCollectionRef.valueChanges();
  }

  /**
   * get provider by id
   *
   * @param {string} providerId - provider id
   * @return {*}  {(Observable<Provider | undefined>)}
   * @memberof ProviderService
   */
  getProvider(providerId: string): Observable<Provider | undefined> {
    return this.afs
      .doc<Provider>(`/db/ferreyros/providers/${providerId}`)
      .valueChanges();
  }

  /**
   * register visit
   *
   * @param {RegisterVisit} form - register visit form
   * @param {UploadFile} sctrFile - SCTR file
   * @param {UploadFile} covidFile - Covid file
   * @param {UploadFile} VaccinationCardFile - Vaccination Card file
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof ProviderService
   */
  registerVisit(
    form: RegisterVisit,
    sctrFile: UploadFile,
    // covidFile: UploadFile,
    vaccinationCardFile: UploadFile
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authSevice.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();

        // check is user is defined
        if (!user) return of(batch);

        // create reference for document in {doc} entries collection
        const providerDocRef = this.afs.firestore
          .collection(`db/ferreyros/providers/${user.providerId}/visits`)
          .doc();

        const shortUser: ShortUser = {
          displayName: user.displayName,
          uid: user.uid,
        };

        form.sctrDate.setHours(23, 59, 59, 0);
        // form.covidDate.setHours(23, 59, 59, 0);

        // Structuring the data model
        const data: Partial<RegisterVisit> = {
          id: providerDocRef.id,
          name: form.name,
          lastname: form.lastname,
          dni: form.dni,
          jobTitle: form.jobTitle,
          telephone: form.telephone,
          visitDate: form.visitDate,
          invitedBy: form.invitedBy,
          reasonVisit: form.reasonVisit,
          sctrFile: sctrFile,
          sctrDate: form.sctrDate,
          // covidFile: covidFile,
          // covidDate: form.covidDate,
          // vaccinationCardFile: vaccinationCardFile,
          // firstDoseDate: form.firstDoseDate,
          // secondDoseDate: form.secondDoseDate,
          // thirdDoseDate: form.thirdDoseDate,
          // doseStatus: 'vaccinated',
          status: 'approved',
          createdBy: shortUser,
          createdAt:
            firebase.default.firestore.FieldValue.serverTimestamp() as Date &
              firebase.default.firestore.Timestamp,
          providerId: user.providerId,
          accessStatus: 'waiting',
          companyName: user.companyName,
          companyRuc: user.companyRuc,
          // covidStatus: 'approved',
          sctrStatus: 'approved',
        };
        batch.set(providerDocRef, data);

        return of(batch);
      })
    );
  }

  /**
   * Get all provider's visits
   *
   * @return {*}  {Observable<RegisterVisit[]>}
   * @memberof ProviderService
   */
  getVisit(): Observable<RegisterVisit[]> {
    return this.authSevice.user$.pipe(
      take(1),
      switchMap((user) => {
        // check if user is defined
        if (!user) return of([]);

        return this.afs
          .collection<RegisterVisit>(
            `/db/ferreyros/providers/${user.providerId}/visits`,
            (ref) => ref.orderBy('createdAt', 'desc')
          )
          .valueChanges();
      })
    );
  }

  /**
   * Get all platform's visits in a time range
   *
   * @return {*}  {Observable<RegisterVisit[]>}
   * @memberof ProviderService
   */
  getAllVisit(from: Date, to: Date): Observable<RegisterVisit[]> {
    return this.afs
      .collectionGroup<RegisterVisit>(`/db/ferreyros/*/visits`, (ref) =>
        ref
          .where('createdAt', '>=', from)
          .where('createdAt', '<=', to)
          .orderBy('createdAt', 'desc')
      )
      .valueChanges();
  }

  /**
   * Get current month
   *
   * @return {*}
   * @memberof ProviderService
   */
  getCurrentMonthOfViewDate(): { from: Date; to: Date } {
    const date = new Date();
    const fromMonth = date.getMonth();
    const fromYear = date.getFullYear();

    const actualFromDate = new Date(fromYear, fromMonth, 1);

    const toMonth = (fromMonth + 1) % 12;
    let toYear = fromYear;

    if (fromMonth + 1 >= 12) {
      toYear++;
    }

    const toDate = new Date(toYear, toMonth, 1);

    return { from: actualFromDate, to: toDate };
  }

  /**
   * Register collaborator in provider's collection
   *
   * @param {Collaborator} form - Form data register collaborator
   * @param {UploadFile} medicalExaminationFile - File medical examination
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof ProviderService
   */
  registerCollaborator(
    form: Collaborator,
    // medicalExaminationFile: UploadFile
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authSevice.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();
        // check if user is defined
        if (!user) return of(batch);

        // create reference for document in {doc} entries collection
        const providerDocRef = this.afs.firestore
          .collection(`db/ferreyros/providers/${user.providerId}/collaborators`)
          .doc();

        const shortUser: ShortUser = {
          uid: user.uid,
          displayName: user.displayName,
        };

        // Structuring the data model
        const data: Partial<Collaborator> = {
          id: providerDocRef.id,
          name: form.name,
          lastname: form.lastname,
          dni: form.dni,
          jobTitle: form.jobTitle,
          // medicalExaminationDate: form.medicalExaminationDate,
          // medicalExaminationFile: medicalExaminationFile,
          // medicalExaminationStatus: 'approved',
          sctrFile: form.sctrFile,
          sctrDate: form.sctrDate,
          sctrStatus: 'unassigned',
          svlFile: form.svlFile,
          svlDate: form.svlDate,
          svlStatus: 'unassigned',
          // swornDeclarationFile: form.swornDeclarationFile,
          // swornDeclarationDate: form.swornDeclarationDate,
          // swornDeclarationStatus: 'unassigned',
          createdBy: shortUser,
          createdAt: new Date() as Date & firebase.default.firestore.Timestamp,
        };

        batch.set(providerDocRef, data);

        return of(batch);
      })
    );
  }

  /**
   * Delete Covid file form visit
   *
   * @param {string} covidId - Covid file ID
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof ProviderService
   */
  // deleteFileCovid(
  //   covidId: string
  // ): Observable<firebase.default.firestore.WriteBatch> {
  //   return this.authSevice.user$.pipe(
  //     take(1),
  //     switchMap((user) => {
  //       // create batch
  //       const batch = this.afs.firestore.batch();

  //       // check if user is defined
  //       if (!user) return of(batch);

  //       // create reference for document in evaluation entries collection
  //       const sctDocRef = this.afs.firestore.doc(
  //         `db/ferreyros/providers/${user.providerId}/visits/${covidId}`
  //       );

  //       // Structuring the data model
  //       const data: Partial<RegisterVisit> = {
  //         covidFile: {
  //           fileURL: '',
  //           name: '',
  //           type: '',
  //         },
  //       };

  //       batch.update(sctDocRef, data);

  //       return of(batch);
  //     })
  //   );
  // }

  /**
   * Delete SCTR file from visit
   *
   * @param {string} sctrId - SCTR file ID
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof ProviderService
   */
  deleteFileSCTR(
    sctrId: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authSevice.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();

        // check if user is defined
        if (!user) return of(batch);

        // create reference for document in evaluation entries collection
        const sctrDocRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user.providerId}/visits/${sctrId}`
        );
        // Structuring the data model
        const data: Partial<RegisterVisit> = {
          sctrFile: {
            fileURL: '',
            name: '',
            type: '',
          },
        };
        batch.update(sctrDocRef, data);

        return of(batch);
      })
    );
  }

  /**
   * Update provider's visit
   *
   * @param {string} visitId - Visit ID
   * @param {RegisterVisit} form - Form data
   * @param {UploadFile} fileCOVID - Covid file
   * @param {UploadFile} fileSCTR - SCTR file
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof ProviderService
   */
  updateVisit(
    visitId: string,
    form: RegisterVisit,
    // fileCOVID: UploadFile,
    fileSCTR: UploadFile
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authSevice.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();

        // check is user is defined
        if (!user) return of(batch);

        // create reference for document in evaluation entries collection
        const collaboratorDocRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user.providerId}/visits/${visitId}`
        );

        const shortUser: ShortUser = {
          displayName: user.displayName,
          uid: user.uid,
        };

        const data: Partial<RegisterVisit> = {
          name: form.name,
          lastname: form.lastname,
          dni: form.dni,
          jobTitle: form.jobTitle,
          telephone: form.telephone,
          visitDate: form.visitDate,
          invitedBy: form.invitedBy,
          reasonVisit: form.reasonVisit,
          // covidDate: form.covidDate,
          // covidFile: fileCOVID,
          sctrDate: form.sctrDate,
          sctrFile: fileSCTR,
          status: 'pending',
          editedBy: shortUser,
          editedAt: new Date() as Date & firebase.default.firestore.Timestamp,
        };

        batch.update(collaboratorDocRef, data);

        return of(batch);
      })
    );
  }

  /**
   * Cancel visit
   *
   * @param {string} visitId - Visit ID
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof ProviderService
   */
  cancelVisit(
    visitId: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authSevice.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();

        // check is user is defined
        if (!user) return of(batch);

        // create reference for document in evaluation entries collection
        const collaboratorDocRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user.providerId}/visits/${visitId}`
        );

        const data: Partial<RegisterVisit> = {
          status: 'canceled',
        };

        batch.update(collaboratorDocRef, data);

        return of(batch);
      })
    );
  }

  /**
   * Delete visit
   *
   * @param {string} visitId - Visit ID
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof ProviderService
   */
  deleteVisit(
    visitId: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authSevice.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();

        // check is user is defined
        if (!user) return of(batch);

        // create reference for document
        const docRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user.providerId}/visits/${visitId}`
        );
        //
        batch.delete(docRef);
        return of(batch);
      })
    );
  }

  /**
   * Delete file in storage
   *
   * @param {string} url - File URL
   * @return {*}  {Promise<void>}
   * @memberof ProviderService
   */
  async deleteFileStorage(url: string): Promise<void> {
    if (!url) return Promise.resolve();

    return await this.storage.storage.refFromURL(url).delete();
  }
}
