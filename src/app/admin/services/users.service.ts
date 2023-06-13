import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { User } from 'src/app/auth/models/user.model';

import * as firebase from 'firebase/compat/app';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class UsersService {
  createUserUrl: string = environment.createUser;
  deleteUserUrl: string = environment.deleteUser;

  constructor(private afs: AngularFirestore, private http: HttpClient) {}

  /**
   *Get users collection
   *
   * @return {*}  {Observable<User[]>}
   * @memberof UsersService
   */
  getUsers(): Observable<User[]> {
    return this.afs
      .collection<User>('users', (ref) => ref.orderBy('lastname', 'asc'))
      .valueChanges();
  }

  /**
   *Enable user status
   *
   * @param {string} uid - user id
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof UsersService
   */
  enableUser(uid: string): Observable<firebase.default.firestore.WriteBatch> {
    if (!uid) return of();

    const batch = this.afs.firestore.batch();

    const userRef = this.afs.firestore.doc(`users/${uid}`);

    batch.update(userRef, { status: 'enabled' });

    return of(batch);
  }

  /**
   *Disable user status
   *
   * @param {string} uid - user id
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof UsersService
   */
  disableUser(uid: string): Observable<firebase.default.firestore.WriteBatch> {
    if (!uid) return of();

    const batch = this.afs.firestore.batch();

    const userRef = this.afs.firestore.doc(`users/${uid}`);

    batch.update(userRef, { status: 'disabled' });

    return of(batch);
  }

  /**
   *Create new user (Administrator or Vigilant)
   *
   * @param {Partial<User>} user - user data
   * @return {*}  {Observable<{ ok: boolean; msg: string }>}
   * @memberof UsersService
   */
  createUser(user: Partial<User>): Observable<{ ok: boolean; msg: string }> {
    const data = {
      user,
    };
    return this.http.post<{ ok: boolean; msg: string }>(
      this.createUserUrl,
      data
    );
  }

  deleteUser(uid: string): Observable<{ ok: boolean; msg: string }> {
    const data = {
      uid,
    };
    return this.http.post<{ ok: boolean; msg: string }>(
      this.deleteUserUrl,
      data
    );
  }
}
