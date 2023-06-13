import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of } from 'rxjs';
import { EventActivity } from '../models/eventActivity.model';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  constructor(private afs: AngularFirestore) {}

  getEvents(start?: Date, end?: Date): Observable<EventActivity[]> {
    if (start && end) {
      return this.afs
        .collection<EventActivity>(`/db/ferreyros/systemActivity`, (ref) =>
          ref.where('createdAt', '>=', start).where('createdAt', '<=', end).orderBy('createdAt', 'desc')
        )
        .valueChanges();
    } else {
      return of([]);
    }
  }
}
