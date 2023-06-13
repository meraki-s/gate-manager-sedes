import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { historyEntry } from 'src/app/providers/models/historyEntry.model';

@Injectable({
  providedIn: 'root',
})
export class AccessReportService {
  constructor(
    private afs: AngularFirestore
  ) {}

  getAccessHistory(from: Date, to: Date): Observable<historyEntry[]> {
    return this.afs.collection<historyEntry>('db/ferreyros/accessHistory', ref => ref.orderBy('createdAt', 'desc').where('createdAt', '>=', from).where('createdAt', '<=', to)).valueChanges();
  }
}
