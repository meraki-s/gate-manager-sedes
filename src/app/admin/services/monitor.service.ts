import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Provider } from 'src/app/auth/models/provider.model';
import { Collaborator } from 'src/app/providers/models/register-collaborator';
import { RegisterVisit } from 'src/app/providers/models/register-visit.model';

@Injectable({
  providedIn: 'root',
})
export class MonitorService {
  constructor(private afs: AngularFirestore) {}

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
}
