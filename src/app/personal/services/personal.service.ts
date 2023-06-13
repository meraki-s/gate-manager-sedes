import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, of } from 'rxjs';
import { switchMap, take, map, takeLast } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { RegisterVisit } from '../../providers/models/register-visit.model';
import * as firebase from 'firebase/compat/app';
import { Collaborator } from 'src/app/providers/models/register-collaborator';
import { Provider } from 'src/app/auth/models/provider.model';
import { scanCollaborator } from '../../providers/models/scanCollaborator.model';
import { historyEntry } from '../../providers/models/historyEntry.model';
import { ProviderService } from '../../auth/services/provider.service';
import { FieldValue, increment, where } from 'firebase/firestore';
// const db  = firebase.default.firestore();

// const query = db.collectionGroup('visits').where('name','==','Marco').orderBy('name')

@Injectable({
  providedIn: 'root',
})
export class PersonalService {
  collaboratorScanned!: scanCollaborator;
  historyAccessId!: string;

  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private authSevice: AuthService,
    private providerService: ProviderService
  ) {}

  /**
   * get all visits for today and all ones that still inside plant
   *
   * @return {*}  {Observable<RegisterVisit[]>}
   * @memberof PersonalService
   */

  getVisits(): Observable<RegisterVisit[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 0);

    return this.afs
      .collectionGroup<RegisterVisit>(`visits`, (ref) =>
        ref
          .where('visitDate', '>=', start)
          .where('visitDate', '<=', end)
          .where('accessStatus', '==', 'waiting')
          .orderBy('visitDate', 'asc')
      )
      .valueChanges();
  }

  getVisitsInside(): Observable<RegisterVisit[]> {
    return this.afs
      .collectionGroup<RegisterVisit>(`visits`, (ref) =>
        ref.where('accessStatus', '==', 'inside').orderBy('lastname', 'asc')
      )
      .valueChanges();
  }

  getCollaborator() {
    return this.afs
      .collectionGroup<Collaborator>('collaborators', (ref) =>
        ref.orderBy('name')
      )
      .valueChanges();
  }

  accessInside(
    visitId: string,
    providerId: string
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
          `db/ferreyros/providers/${providerId}/visits/${visitId}`
        );

        const data: Partial<RegisterVisit> = {
          accessStatus: 'inside',
        };

        batch.update(collaboratorDocRef, data);

        // run transaction
        const providerRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${providerId}`
        );

        providerRef.firestore.runTransaction(async (transaction) => {
          const provider = await transaction.get(providerRef);
          const providerData: Provider = provider.data() as Provider;
          providerData.workersIn =
            (providerData.workersIn ? providerData.workersIn : 0) + 1;
          transaction.update(providerRef, {
            workersIn: providerData.workersIn,
          });
        });

        return of(batch);
      })
    );
  }

  accessOutside(visitId: string, providerId: string) {
    return this.authSevice.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();

        // check is user is defined
        if (!user) return of(batch);

        // create reference for document in evaluation entries collection
        const collaboratorDocRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${providerId}/visits/${visitId}`
        );

        const data: Partial<RegisterVisit> = {
          accessStatus: 'outside',
        };

        batch.update(collaboratorDocRef, data);

        // run transaction
        const providerRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${providerId}`
        );

        providerRef.firestore.runTransaction(async (transaction) => {
          const provider = await transaction.get(providerRef);
          const providerData: Provider = provider.data() as Provider;
          providerData.workersIn =
            (providerData.workersIn ? providerData.workersIn : 0) - 1;
          transaction.update(providerRef, {
            workersIn: providerData.workersIn,
          });
        });

        return of(batch);
      })
    );
  }

  scanCollaborator(dni: string): Observable<scanCollaborator | null> {
    return this.afs
      .collectionGroup<Collaborator>('collaborators', (ref) =>
        ref.where('dni', '==', dni)
      )
      .valueChanges()
      .pipe(
        switchMap((collaborator) => {
          if (collaborator.length > 0) {
            return this.afs
              .doc<Provider>(
                `db/ferreyros/providers/${collaborator[0].providerId}`
              )
              .valueChanges()
              .pipe(
                map((provider) => {
                  // console.log(provider);
                  if (!provider) {
                    return null;
                  }

                  const data: scanCollaborator = {
                    providerId: provider.id,
                    companyName: provider.companyName,
                    companyRuc: provider.companyRuc,
                    salesRepresentative: provider.salesRepresentative,
                    status: provider.status,
                    blockedBy: provider.blockedBy ? provider.blockedBy : '',
                    numberOfWorkers: provider.numberOfWorkers,
                    name: collaborator[0].name,
                    lastname: collaborator[0].lastname,
                    jobTitle: collaborator[0].jobTitle,
                    dni: collaborator[0].dni,
                    phone: provider.phoneUser,
                    collaboratorId: collaborator[0].id,
                    medicalExaminationStatus:
                      collaborator[0].medicalExaminationStatus!,
                    medicalExaminationFile:
                      collaborator[0].medicalExaminationFile!,
                    medicalExaminationDate:
                      collaborator[0].medicalExaminationDate!,
                    vaccinationCardFile: collaborator[0].vaccinationCardFile,
                    firstDoseDate: collaborator[0].firstDoseDate,
                    secondDoseDate: collaborator[0].secondDoseDate,
                    thirdDoseDate: collaborator[0].thirdDoseDate,
                    doseStatus: collaborator[0].doseStatus,
                    sctrFile: collaborator[0].sctrFile,
                    sctrDate: collaborator[0].sctrDate,
                    sctrStatus: collaborator[0].sctrStatus,
                    svlFile: collaborator[0].svlFile,
                    svlDate: collaborator[0].svlDate,
                    svlStatus: collaborator[0].svlStatus,
                    swornDeclarationFile: collaborator[0].swornDeclarationFile,
                    swornDeclarationDate: collaborator[0].swornDeclarationDate,
                    swornDeclarationStatus:
                      collaborator[0].swornDeclarationStatus,
                    inductionStatus: collaborator[0].inductionStatus,
                    inductionDate: collaborator[0].inductionDate,
                    symptomatologyDate: collaborator[0].symptomatologyDate,
                    symptomatologyStatus: collaborator[0].symptomatologyStatus,
                    authorizedBy: collaborator[0].authorizedBy,
                    entryDeparture: collaborator[0].entryDeparture,
                  };

                  this.collaboratorScanned = data;

                  return data;
                })
              );
          } else {
            return of(null);
          }
        })
      );
  }

  authorized(form: string): Observable<firebase.default.firestore.WriteBatch> {
    return this.authSevice.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();
        // check if user is defined
        if (!user) return of(batch);

        // create reference for document in evaluation entries collection
        const entryDocRef = this.afs.firestore
          .collection(`/db/ferreyros/accessHistory`)
          .doc();

        this.historyAccessId = entryDocRef.id;

        const data: Partial<historyEntry> = {
          id: entryDocRef.id,
          name: this.collaboratorScanned.name,
          lastname: this.collaboratorScanned.lastname,
          companyName: this.collaboratorScanned.companyName,
          companyRuc: this.collaboratorScanned.companyRuc,
          dni: this.collaboratorScanned.dni,
          entryAt: new Date() as Date & firebase.default.firestore.Timestamp,
          departureAt: null,
          status: this.collaboratorScanned.status,
          createdAt: new Date() as Date & firebase.default.firestore.Timestamp,
          createdBy: user,
          authorizedBy: form,
        };
        // console.log(data)

        batch.set(entryDocRef, data);

        const collaboratorDocRef = this.afs.firestore.doc(
          `/db/ferreyros/providers/${this.collaboratorScanned.providerId}/collaborators/${this.collaboratorScanned.collaboratorId}`
        );

        const dataCollaborator: Partial<Collaborator> = {
          entryDeparture: 'inside',
          authorizedBy: form,
        };

        batch.update(collaboratorDocRef, dataCollaborator);

        const providerRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${this.collaboratorScanned.providerId}`
        );

        batch.update(providerRef, { workersIn: increment(1) });

        // providerRef.firestore.runTransaction(async (transaction) => {
        //   const provider = await transaction.get(providerRef);
        //   const providerData: Provider = provider.data() as Provider;
        //   // const workersIn =
        //   //   (providerData.workersIn ? providerData.workersIn : 0) + 1;
        //   transaction.update(providerRef, {
        //     workersIn: increment(1),
        //   });
        // });

        return of(batch);
      })
    );
  }

  depatureCollaborator(): Observable<firebase.default.firestore.WriteBatch> {
    return this.authSevice.user$.pipe(
      take(1),
      switchMap((user) => {
        // create batch
        const batch = this.afs.firestore.batch();
        // check if user is defined
        if (!user) return of(batch);

        // create reference for document in evaluation entries collection
        const entryDocRef = this.afs.firestore
          .collection(`/db/ferreyros/accessHistory`)
          .doc();

        this.historyAccessId = entryDocRef.id;

        const data: Partial<historyEntry> = {
          id: entryDocRef.id,
          name: this.collaboratorScanned.name,
          lastname: this.collaboratorScanned.lastname,
          companyName: this.collaboratorScanned.companyName,
          companyRuc: this.collaboratorScanned.companyRuc,
          dni: this.collaboratorScanned.dni,
          entryAt: null,
          departureAt: new Date() as Date &
            firebase.default.firestore.Timestamp,
          status: this.collaboratorScanned.status,
          createdAt: new Date() as Date & firebase.default.firestore.Timestamp,
          createdBy: user,
        };
        // console.log(data)

        batch.set(entryDocRef, data);

        const collaboratorDocRef = this.afs.firestore.doc(
          `/db/ferreyros/providers/${this.collaboratorScanned.providerId}/collaborators/${this.collaboratorScanned.collaboratorId}`
        );

        const dataCollaborator: Partial<Collaborator> = {
          entryDeparture: 'outside',
          authorizedBy: '',
        };

        batch.update(collaboratorDocRef, dataCollaborator);

        const providerRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${this.collaboratorScanned.providerId}`
        );

        batch.update(providerRef, { workersIn: increment(-1) });

        // providerRef.firestore.runTransaction(async (transaction) => {
        //   const provider = await transaction.get(providerRef);
        //   const providerData: Provider = provider.data() as Provider;
        //   const workersIn =
        //     (providerData.workersIn ? providerData.workersIn : 0) - 1;
        //   transaction.update(providerRef, {
        //     workersIn: increment(-1),
        //   });
        // });

        return of(batch);
      })
    );
  }
}
