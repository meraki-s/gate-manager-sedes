import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';
import { UiConfig } from '../classes/ui-config';
import { GeneralConfig } from '../models/general-config.model';
import { User } from '../models/user.model';

import * as firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  user$: Observable<User | null | undefined>;

  uiConfig: UiConfig = new UiConfig();

  version: string = '0.0.1';

  constructor(private afAuth: AngularFireAuth, public afs: AngularFirestore) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap((user) => {
        if (!user) return of(null);

        return this.afs
          .collection('users')
          .doc<User>(`${user.uid}`)
          .valueChanges();
      }),
      shareReplay(1)
    );
  }

  setCurrentLocation(uid: string, locationId: string) {
    this.afs.doc(`users/${uid}`).update({
      currentLocation: locationId,
    });
  }

  getGeneralConfigDoc(): Observable<GeneralConfig | undefined> {
    return this.afs
      .doc<GeneralConfig>('/configuration/generalConfig')
      .valueChanges()
      .pipe(shareReplay(1));
  }

  async login(user: {
    email: string;
    password: string;
  }): Promise<firebase.default.auth.UserCredential | string> {
    try {
      await firebase.default
        .auth()
        .setPersistence(firebase.default.auth.Auth.Persistence.LOCAL);
      return await this.afAuth.signInWithEmailAndPassword(
        user.email,
        user.password
      );
    } catch (error) {
      console.log(error);
      return 'Error';
    }
  }

  async createUser(user: {
    email: string;
    password: string;
  }): Promise<firebase.default.auth.UserCredential | null> {
    try {
      return await this.afAuth.createUserWithEmailAndPassword(
        user.email,
        user.password
      );
    } catch (error) {
      return null;
    }
  }

  async logout(): Promise<void> {
    return await this.afAuth.signOut();
  }
}
