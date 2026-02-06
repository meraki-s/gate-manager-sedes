import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { Provider } from 'src/app/auth/models/provider.model';
import { Collaborator } from 'src/app/providers/models/register-collaborator';
import { RegisterVisit } from 'src/app/providers/models/register-visit.model';
import { historyEntry } from 'src/app/providers/models/historyEntry.model';
import { ShortUser } from 'src/app/auth/models/user.model';
import { AuthService } from 'src/app/auth/services/auth.service';
import { LoggerService } from './logger.service';
import * as firebase from 'firebase/compat/app';
import { increment } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class MonitorService {
  constructor(
    private afs: AngularFirestore,
    private authService: AuthService,
    private loggerService: LoggerService
  ) {}

  getAllProviderInsidePlant(): Observable<Provider[]> {
    return this.afs
      .collection<Provider>('db/ferreyros/providers', (ref) =>
        ref.where('workersIn', '>', 0)
      )
      .valueChanges();
  }

  getAllCollaboratorsInPlant(): Observable<Collaborator[]> {
    return this.afs
      .collectionGroup<Collaborator>('collaborators', (ref) =>
        ref.where('entryDeparture', '==', 'inside').orderBy('companyName', 'asc')
      )
      .valueChanges();
  }

  getAllVisitsInPlant(): Observable<RegisterVisit[]> {
    return this.afs
      .collectionGroup<RegisterVisit>('visits', (ref) =>
        ref.where('accessStatus', '==', 'inside').orderBy('companyName', 'asc')
      )
      .valueChanges();
  }

  /**
   * Force exit for a collaborator (manual removal from plant)
   * Creates history entry, updates collaborator status, decrements provider workersIn count
   *
   * @param collaboratorId - ID of the collaborator
   * @param providerId - ID of the provider
   * @param collaborator - Collaborator data
   * @param adminName - Name of the admin forcing the exit
   * @returns Observable<void>
   */
  forceExitCollaborator(
    collaboratorId: string,
    providerId: string,
    collaborator: Collaborator,
    adminName: string
  ): Observable<void> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) return of();

        const batch = this.afs.firestore.batch();

        // Create short user for audit
        const shortUser: ShortUser = {
          displayName: user.name + ' ' + user.lastname,
          uid: user.uid,
        };

        // 1. Create history entry with forced exit note
        const historyDocRef = this.afs.firestore
          .collection('/db/ferreyros/accessHistory')
          .doc();

        const historyData: Partial<historyEntry> = {
          id: historyDocRef.id,
          name: collaborator.name,
          lastname: collaborator.lastname,
          companyName: collaborator.companyName,
          companyRuc: collaborator.companyRuc,
          dni: collaborator.dni,
          entryAt: null,
          departureAt: new Date() as Date & firebase.default.firestore.Timestamp,
          status: 'enabled', // Default status for forced exit
          createdAt: new Date() as Date & firebase.default.firestore.Timestamp,
          createdBy: shortUser,
          entryDeparture: 'Salida forzada por administrador: ' + adminName,
        };

        batch.set(historyDocRef, historyData);

        // 2. Update collaborator status to 'outside'
        const collaboratorDocRef = this.afs.firestore.doc(
          `/db/ferreyros/providers/${providerId}/collaborators/${collaboratorId}`
        );

        const collaboratorUpdate: Partial<Collaborator> = {
          entryDeparture: 'outside',
          authorizedBy: '',
        };

        batch.update(collaboratorDocRef, collaboratorUpdate);

        // 3. Decrement provider workersIn count
        const providerRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${providerId}`
        );

        batch.update(providerRef, { workersIn: increment(-1) });

        // 4. Log the activity
        this.loggerService.saveActivity(
          collaborator.companyName,
          collaborator.companyRuc,
          'Forzó salida de colaborador',
          `${collaborator.name} ${collaborator.lastname}`,
          collaborator.dni,
          'Salida forzada desde monitor administrativo'
        );

        // Commit batch
        return new Observable<void>((observer) => {
          batch
            .commit()
            .then(() => {
              observer.next();
              observer.complete();
            })
            .catch((error) => {
              observer.error(error);
            });
        });
      })
    );
  }

  /**
   * Force exit for a visit (manual removal from plant)
   * Creates history entry, updates visit status, decrements provider workersIn count
   *
   * @param visitId - ID of the visit
   * @param providerId - ID of the provider
   * @param visit - RegisterVisit data
   * @param adminName - Name of the admin forcing the exit
   * @returns Observable<void>
   */
  forceExitVisit(
    visitId: string,
    providerId: string,
    visit: RegisterVisit,
    adminName: string
  ): Observable<void> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        if (!user) return of();

        const batch = this.afs.firestore.batch();

        // Create short user for audit
        const shortUser: ShortUser = {
          displayName: user.name + ' ' + user.lastname,
          uid: user.uid,
        };

        // 1. Create history entry with forced exit note
        const historyDocRef = this.afs.firestore
          .collection('/db/ferreyros/accessHistory')
          .doc();

        const historyData: Partial<historyEntry> = {
          id: historyDocRef.id,
          name: visit.name,
          lastname: visit.lastname,
          companyName: visit.companyName,
          companyRuc: visit.companyRuc,
          dni: visit.dni.toString(),
          entryAt: null,
          departureAt: new Date() as Date & firebase.default.firestore.Timestamp,
          status: 'enabled', // Default status for forced exit
          createdAt: new Date() as Date & firebase.default.firestore.Timestamp,
          createdBy: shortUser,
          entryDeparture: 'Salida forzada (VISITA) por administrador: ' + adminName,
        };

        batch.set(historyDocRef, historyData);

        // 2. Update visit status to 'outside'
        const visitDocRef = this.afs.firestore.doc(
          `/db/ferreyros/providers/${providerId}/visits/${visitId}`
        );

        const visitUpdate: Partial<RegisterVisit> = {
          accessStatus: 'outside',
        };

        batch.update(visitDocRef, visitUpdate);

        // 3. Decrement provider workersIn count
        const providerRef = this.afs.firestore.doc(
          `db/ferreyros/providers/${providerId}`
        );

        batch.update(providerRef, { workersIn: increment(-1) });

        // 4. Log the activity
        this.loggerService.saveActivity(
          visit.companyName,
          visit.companyRuc,
          'Forzó salida de visitante',
          `${visit.name} ${visit.lastname}`,
          visit.dni.toString(),
          'Salida forzada desde monitor administrativo'
        );

        // Commit batch
        return new Observable<void>((observer) => {
          batch
            .commit()
            .then(() => {
              observer.next();
              observer.complete();
            })
            .catch((error) => {
              observer.error(error);
            });
        });
      })
    );
  }
}
