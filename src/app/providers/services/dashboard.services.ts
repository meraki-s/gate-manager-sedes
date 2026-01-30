import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, of } from 'rxjs';
import { map, switchMap, take, catchError } from 'rxjs/operators';
import { ShortUser, User } from 'src/app/auth/models/user.model';
import { AuthService } from 'src/app/auth/services/auth.service';
import { SCTR, SVL } from '../models/dashboard.model';
import { Collaborator, UploadFile } from '../models/register-collaborator';

import * as firebase from 'firebase/compat/app';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Provider } from 'src/app/auth/models/provider.model';
@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  /**
   * Register a new SCTR
   *
   * @param {SCTR} form - Form data passed on register dialog
   * @param {Array<CollaboratorList>} collaboratorList - Collaborator list
   * @param {string} url - File url
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof DashboardService
   */
  sctrRegister(
    form: SCTR,
    collaboratorList: Array<Collaborator>,
    sctrFile: UploadFile
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();
        // check if user is defined
        if (!user) return of(batch);

        // create reference for document in evaluation entries collection
        const sctrDocRef = this.afs.firestore
          .collection(`db/ferreyros/providers/${user.providerId}/sctrList`)
          .doc();

        const shortUser: ShortUser = {
          uid: user.uid,
          displayName: user.displayName,
        };

        const data: Partial<SCTR> = {
          id: sctrDocRef.id,
          createdBy: shortUser,
          createdAt:
            firebase.default.firestore.FieldValue.serverTimestamp() as Date &
              firebase.default.firestore.Timestamp,
          code: form.code,
          validityDate: form.validityDate,
          sctrFile: sctrFile,
          collaborators: collaboratorList,
        };

        batch.set(sctrDocRef, data);

        // correlate sctr with collaborators
        collaboratorList.forEach((collaborator) => {
          const collaboratorDocRef = this.afs.firestore
            .collection(
              `db/ferreyros/providers/${user.providerId}/collaborators`
            )
            .doc(collaborator.id);

          batch.update(collaboratorDocRef, {
            sctrId: sctrDocRef.id,
            sctrFile: sctrFile,
            sctrDate: form.validityDate,
            sctrStatus: 'approved',
          });
        });

        return of(batch);
      })
    );
  }

  /**
   * Returns a list of all SVL documents
   *
   * @param {string} providerId - Provider ID
   * @return {*}  {Observable<SVL[]>}
   * @memberof DashboardService
   */
  getAllSvlDocuments(): Observable<SVL[]> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) return of([]);

        return this.afs
          .collection<SVL>(
            `db/ferreyros/providers/${user.providerId}/svlList`,
            (ref) => ref.orderBy('createdAt', 'desc')
          )
          .valueChanges();
      })
    );
  }

  svlRegister(
    form: SVL,
    collaboratorList: Array<Collaborator>,
    svlFile: UploadFile,
    user: User
  ): Observable<firebase.default.firestore.WriteBatch> {
    // create batch
    const batch = this.afs.firestore.batch();
    // create reference for document in evaluation entries collection
    const svlDocRef = this.afs.firestore
      .collection(`db/ferreyros/providers/${user.providerId}/svlList`)
      .doc();

    const data: Partial<SVL> = {
      id: svlDocRef.id,
      createdBy: user,
      createdAt:
        firebase.default.firestore.FieldValue.serverTimestamp() as Date &
          firebase.default.firestore.Timestamp,
      code: form.code,
      validityDate: form.validityDate,
      svlFile: svlFile,
      collaborators: collaboratorList,
    };

    batch.set(svlDocRef, data);

    // correlate svl with collaborators
    collaboratorList.forEach((collaborator) => {
      const collaboratorDocRef = this.afs.firestore
        .collection(`db/ferreyros/providers/${user.providerId}/collaborators`)
        .doc(collaborator.id);

      batch.update(collaboratorDocRef, {
        svlId: svlDocRef.id,
        svlFile: svlFile,
        svlDate: form.validityDate,
        svlStatus: 'approved',
      });
    });

    return of(batch);
  }

  /**
   * Update SVL data
   *
   * @param {*} svlId - SVL ID
   * @param {SVL} form - Form data passed on svl edit
   * @param {Array<Collaborator>} collaboratorList
   * @param {string} url
   * @param {User} user
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof DashboardService
   */
  svlUpdate(
    svlId: any,
    form: SVL,
    collaboratorList: Array<Collaborator>,
    svlFile: UploadFile,
    user: User
  ): Observable<firebase.default.firestore.WriteBatch> {
    // create batch
    const batch = this.afs.firestore.batch();
    // create reference for document in evaluation entries collection
    const svlDocRef = this.afs.firestore.doc(
      `db/ferreyros/providers/${user.providerId}/svlList/${svlId}`
    );

    const data: Partial<SVL> = {
      editedBy: user,
      editedAt: new Date() as Date & firebase.default.firestore.Timestamp,
      code: form.code,
      validityDate: form.validityDate,
      svlFile: svlFile,
      collaborators: collaboratorList,
    };

    batch.update(svlDocRef, data);

    // correlate svl with collaborators
    collaboratorList.forEach((collaborator) => {
      const collaboratorDocRef = this.afs.firestore
        .collection(`db/ferreyros/providers/${user.providerId}/collaborators`)
        .doc(collaborator.id);

      batch.update(collaboratorDocRef, {
        svlFile: svlFile,
        svlDate: form.validityDate,
        svlStatus: 'approved',
      });
    });

    return of(batch);
  }

  /**
   * Delete SVL document
   *
   * @param {string} providerId - Provider ID
   * @param {string} svlId - SVL ID
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof DashboardService
   */
  svlDelete(
    providerId: string,
    svlId: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    // create batch
    const batch = this.afs.firestore.batch();
    const docRef = this.afs.firestore.doc(
      `db/ferreyros/providers/${providerId}/svlList/${svlId}`
    );
    //
    batch.delete(docRef);
    return of(batch);
  }

  /**
   * Update SCTR data
   *
   * @param {*} sctrId - SCTR ID
   * @param {SCTR} form - Form data passed on sctr edit
   * @param {Array<CollaboratorList>} collaboratorList - Collaborator list
   * @param {string} url - File url
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof DashboardService
   */
  sctrUpdate(
    sctrId: any,
    form: SCTR,
    collaboratorList: Array<Collaborator>,
    sctrFile: UploadFile
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();
        // check if user is defined
        if (!user) return of(batch);

        // create reference for document in evaluation entries collection
        const sctrDocRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user.providerId}/sctrList/${sctrId}`
        );

        const shortUser: ShortUser = {
          uid: user.uid,
          displayName: user.displayName,
        };

        const data: Partial<SCTR> = {
          editedBy: shortUser,
          editedAt: new Date() as Date & firebase.default.firestore.Timestamp,
          code: form.code,
          validityDate: form.validityDate,
          sctrFile: sctrFile,
          collaborators: collaboratorList,
        };

        batch.update(sctrDocRef, data);

        // correlate svl with collaborators
        collaboratorList.forEach((collaborator) => {
          const collaboratorDocRef = this.afs.firestore
            .collection(
              `db/ferreyros/providers/${user.providerId}/collaborators`
            )
            .doc(collaborator.id);

          batch.update(collaboratorDocRef, {
            sctrFile: sctrFile,
            sctrDate: form.validityDate,
            sctrStatus: 'approved',
          });
        });

        return of(batch);
      })
    );
  }

  /**
   * Delete SCTR document
   *
   * @param {string} providerId - Provider ID
   * @param {*} sctrId - SCTR ID
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof DashboardService
   */
  sctrDelete(
    providerId: string,
    sctrId: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    // create batch
    const batch = this.afs.firestore.batch();
    const docRef = this.afs.firestore.doc(
      `db/ferreyros/providers/${providerId}/sctrList/${sctrId}`
    );
    //
    batch.delete(docRef);
    return of(batch);
  }

  /**
   * Get all SCTR documents from provider
   *
   * @return {*}  {Observable<SCTR[]>}
   * @memberof DashboardService
   */
  getAllSctrDocuments(): Observable<SCTR[]> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) return of([]);

        return this.afs
          .collection<SCTR>(
            `/db/ferreyros/providers/${user.providerId}/sctrList`,
            (ref) => ref.orderBy('createdAt', 'desc')
          )
          .valueChanges();
      })
    );
  }

  /**
   * Get all collaborators from provider
   *
   * @return {*}  {Observable<Collaborator[]>}
   * @memberof DashboardService
   */
  getAllCollaborators(): Observable<Collaborator[]> {
    return this.authService.user$.pipe(
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
   * Delete collaborator document from provider's list
   *
   * @param {string} collaboratorId - Collaborator ID
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof DashboardService
   */
  deleteCollaborator(
    collaboratorId: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();
        // Check if user is available
        if (!user) return of(batch);

        const docRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user.providerId}/collaborators/${collaboratorId}`
        );

        batch.delete(docRef);

        const providerRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user.providerId}`
        );

        providerRef.firestore.runTransaction(async (transaction) => {
          const provider = await transaction.get(providerRef);
          const providerData: Provider = provider.data() as Provider;
          providerData.numberOfWorkers = providerData.numberOfWorkers - 1;
          transaction.update(providerRef, {
            numberOfWorkers: providerData.numberOfWorkers,
          });
        });

        return of(batch);
      })
    );
  }

  async deleteFileStorage(url: string): Promise<any> {
    if (!url) return Promise.resolve();
    return await this.storage.storage.refFromURL(url).delete();
  }

  /**
   * Delete SCTR file from storage
   *
   * @param {*} sctrId - SCTR ID
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof DashboardService
   */
  deleteFileSCTR(
    sctrId: any
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        const batch = this.afs.firestore.batch();
        // Check if user is defined
        if (!user) return of(batch);

        // create reference for document in evaluation entries collection
        const sctDocRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user.providerId}/sctrList/${sctrId}`
        );
        // Structuring the data model
        const data: any = {
          sctrFile: null,
        };
        batch.update(sctDocRef, data);

        return of(batch);
      })
    );
  }

  deleteFileSVL(
    entryId: any
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();

        // Check if user is defined
        if (!user) return of(batch);

        // create reference for document in evaluation entries collection
        const sctDocRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user.providerId}/svlList/${entryId}`
        );
        // Structuring the data model
        const data: any = {
          sctrFile: null,
        };
        batch.update(sctDocRef, data);

        return of(batch);
      })
    );
  }

  /**
   * Register a new collaborator to provider's list
   *
   * @param {string} providerId - Provider ID
   * @param {Collaborator} form - Collaborator data
   * @param {UploadFile} examenDoc - File data
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof DashboardService
   */
  registerCollaborator(
    form: Collaborator,
    // medicalExaminationFile: UploadFile,
    // vaccinationCardFile: UploadFile
  ): Observable<{
    batch: firebase.default.firestore.WriteBatch;
    collaboratorId: string;
    collaboratorDni: string;
  }> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();
        // first, check if user is available to work
        if (!user)
          return of({ batch: batch, collaboratorId: '', collaboratorDni: '' });

        // create reference for document in {doc} entries collection
        const collaboratorDocRef = this.afs.firestore
          .collection(`db/ferreyros/providers/${user.providerId}/collaborators`)
          .doc();

        const shortUser: ShortUser = {
          uid: user.uid,
          displayName: user.displayName,
        };

        const dni = form.dni + '';

        // Structuring the data model
        const data: Partial<Collaborator> = {
          id: collaboratorDocRef.id,
          name: form.name,
          lastname: form.lastname,
          dni: dni,
          jobTitle: form.jobTitle,
          // medicalExaminationDate: form.medicalExaminationDate
          //   ? form.medicalExaminationDate
          //   : null,
          // medicalExaminationFile: medicalExaminationFile
          //   ? medicalExaminationFile
          //   : null,
          // medicalExaminationStatus: medicalExaminationFile
          //   ? 'pending'
          //   : 'unassigned',
          // vaccinationCardFile: vaccinationCardFile ?? null,
          // firstDoseDate: form.firstDoseDate ?? null,
          // secondDoseDate: form.secondDoseDate ?? null,
          // thirdDoseDate: form.thirdDoseDate ?? null,
          // doseStatus: vaccinationCardFile ? 'vaccinated' : 'unassigned',
          createdBy: shortUser,
          createdAt:
            firebase.default.firestore.FieldValue.serverTimestamp() as Date &
              firebase.default.firestore.Timestamp,
          sctrStatus: 'unassigned',
          svlStatus: 'unassigned',
          // swornDeclarationStatus: 'unassigned',
          providerId: user.providerId,
          entryDeparture: 'outside',
          companyName: user.companyName,
          companyRuc: user.companyRuc,
        };

        batch.set(collaboratorDocRef, data);

        const providerRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user.providerId}`
        );

        providerRef.firestore.runTransaction(async (transaction) => {
          const provider = await transaction.get(providerRef);
          const providerData: Provider = provider.data() as Provider;
          providerData.numberOfWorkers = providerData.numberOfWorkers + 1;
          transaction.update(providerRef, {
            numberOfWorkers: providerData.numberOfWorkers,
          });
        });

        return of({
          batch,
          collaboratorId: collaboratorDocRef.id,
          collaboratorDni: form.dni + '',
        });
      })
    );
  }

  /**
   * Update collaborator document in provider's list
   *
   * @param {string} collaboratorId
   * @param {Collaborator} form
   * @param {UploadFile} medicalExaminationFile
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof DashboardService
   */
  updateCollaborator(
    collaboratorId: string,
    form: Collaborator,
    // medicalExaminationFile: UploadFile | null,
    // vaccinationCardFile: UploadFile | null
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();
        // first, check if user is defined
        if (!user) return of(batch);

        const collaboratorDocRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user?.providerId}/collaborators/${collaboratorId}`
        );

        const shortUser: ShortUser = {
          uid: user.uid,
          displayName: user.displayName,
        };

        const data: Partial<Collaborator> = {
          name: form.name,
          lastname: form.lastname,
          jobTitle: form.jobTitle,
          dni: form.dni,
          // medicalExaminationDate: form.medicalExaminationDate
          //   ? form.medicalExaminationDate
          //   : null,
          // medicalExaminationFile: medicalExaminationFile
          //   ? medicalExaminationFile
          //   : null,
          // medicalExaminationStatus: medicalExaminationFile
          //   ? 'pending'
          //   : 'unassigned',
          // firstDoseDate: form.firstDoseDate ?? null,
          // secondDoseDate: form.secondDoseDate ?? null,
          // thirdDoseDate: form.thirdDoseDate ?? null,
          // vaccinationCardFile: vaccinationCardFile ?? null,
          // doseStatus: vaccinationCardFile ? 'vaccinated' : 'unassigned',
          editedBy: shortUser,
          editedAt: new Date() as Date & firebase.default.firestore.Timestamp,
        };

        batch.update(collaboratorDocRef, data);

        return of(batch);
      })
    );
  }

  queryDriveIndSymp(
    collaboratorId: string,
    dni: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();
        // first, check if user is defined
        if (!user) return of(batch);

        const collaboratorDocRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user?.providerId}/collaborators/${collaboratorId}`
        );

        return this.http.get(environment.queryDriveURL + `/${dni}`).pipe(
          take(1),
          map((res: any) => {
            const data = res.data;

            const driveData: Partial<Collaborator> = {
              inductionStatus: data['inductionStatus'] ?? 'unassigned',
              inductionDate:
                (new Date(data['inductionValidity']) as Date &
                  firebase.default.firestore.Timestamp) ?? null,
              // symptomatologyStatus:
              //   data['symptomatologyStatus'] ?? 'unassigned',
              // symptomatologyDate:
              //   (new Date(data['symptomatologyValidity']) as Date &
              //     firebase.default.firestore.Timestamp) ?? null,
              lotoStatus: data['lotoStatus'] ?? 'unassigned',
              lotoDate:
                (new Date(data['lotoValidity']) as Date &
                  firebase.default.firestore.Timestamp) ?? null,
            };

            batch.update(collaboratorDocRef, driveData);

            return batch;
          }),
          catchError((err) => {
            const driveData: Partial<Collaborator> = {
              inductionStatus: 'unassigned',
              inductionDate: null,
              // symptomatologyStatus: 'unassigned',
              // symptomatologyDate: null,
              lotoStatus: 'unassigned',
              lotoDate: null,
            };

            batch.update(collaboratorDocRef, driveData);

            return of(batch);
          })
        );
      })
    );
  }

  deleteMedicalExamination(
    collaboratorId: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        const batch = this.afs.firestore.batch();

        if (!user) return of(batch);

        const collaboratorDocRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user.providerId}/collaborators/${collaboratorId}`
        );

        const data: any = {
          medicalExaminationFile: null,
          medicalExaminationDate: null,
          medicalExaminationStatus: 'unassigned',
        };

        batch.update(collaboratorDocRef, data);

        return of(batch);
      })
    );
  }

  deleteVaccinationCard(
    collaboratorId: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        const batch = this.afs.firestore.batch();

        if (!user) return of(batch);

        const collaboratorDocRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${user.providerId}/collaborators/${collaboratorId}`
        );

        const data: any = {
          vaccinationCardFile: null,
          vaccinationCardDate: null,
          vaccinationCardStatus: 'unassigned',
        };

        batch.update(collaboratorDocRef, data);

        return of(batch);
      })
    );
  }

  getProvider(providerId: string): Observable<Provider | null> {
    return this.afs
      .doc<Provider>(`db/ferreyros/providers/${providerId}`)
      .valueChanges()
      .pipe(
        map((provider) => {
          if (!provider) return null;
          return provider;
        })
      );
  }

  checkCollaboratorsListInDocument(
    collaborators: Collaborator[]
  ): Observable<Array<boolean>> {
    // start an empty array for booleans
    let booleanArray: Array<boolean> = collaborators.map((res) => true);
    let promises: any[] = [];

    return this.authService.user$.pipe(
      switchMap((user) => {
        // create batch for query
        collaborators.map((element) => {
          const collaboratorRef = this.afs
            .collection(
              `db/ferreyros/providers/${user?.providerId}/collaborators`
            )
            .doc(element.id);

          promises.push(collaboratorRef.get().toPromise());
        });

        return Promise.all(promises).then((res) => {
          console.log(res);
          return res.map((res) => res.exists);
        });
      })
    );
  }
}
