import { Injectable } from '@angular/core';
import { EventActivity } from '../models/eventActivity.model';

import * as firebase from 'firebase/compat/app';
import { AuthService } from 'src/app/auth/services/auth.service';
import { take } from 'rxjs/operators';
import { ShortUser } from 'src/app/auth/models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  constructor(
    private authService: AuthService,
    private afs: AngularFirestore,
    private snackbar: MatSnackBar
  ) {}

  /**
   *save an event activity
   *
   * @param {string} userName - user name
   * @param {string} providerName - provider name
   * @param {string} userDNI - user dni
   * @param {string} activity - activity
   * @memberof LoggerService
   */
  saveActivity(
    providerName: string,
    providerRUC: number,
    activity: string,
    collaboratorName?: string,
    collaboratorDNI?: string,
    description?: string
  ): void {
    this.authService.user$.pipe(take(1)).subscribe((user) => {
      if (!user) return;

      const shortUser: ShortUser = {
        displayName: user.name + ' ' + user.lastname,
        uid: user.uid,
      };

      const data: EventActivity = {
        collaboratorName: collaboratorName ? collaboratorName : '',
        collaboratorDNI: collaboratorDNI ? collaboratorDNI : '',
        providerName,
        providerRUC,
        activity,
        description: description ? description : '',
        createdAt:
          firebase.default.firestore.FieldValue.serverTimestamp() as Date &
            firebase.default.firestore.Timestamp,
        createdBy: shortUser,
      };

      const batch = this.afs.firestore.batch();

      const eventActivityRef = this.afs.firestore
        .collection('db/ferreyros/systemActivity')
        .doc();

      batch.set(eventActivityRef, data);

      batch.commit().catch((error) => {
        console.log(error);
        this.snackbar.open('😞 Error al registrar la actividad', 'Cerrar', {
          duration: 5000,
        });
      });
    });
  }
}
