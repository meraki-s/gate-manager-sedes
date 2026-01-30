
import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { Observable, of } from "rxjs";
import { ResponsibleList } from '../models/setting.model';

@Injectable({
  providedIn: 'root',
})
export class SettingService {
  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage
  ) {}

   /**
   * update the ResponsibleList entry
   * @param {ResponsibleList} form - Form data passed on andon edit
   * @param {User} user - imgs
   */
    responsibleRegister( responsibleList: Array<ResponsibleList> ): Observable<firebase.default.firestore.WriteBatch> {
        // create batch
       
        const batch = this.afs.firestore.batch();
        // create reference for document in evaluation entries collection
        responsibleList.forEach((responsible: ResponsibleList) => {
          const responsibleDocRef = this.afs.firestore.collection(`/db/generalConfig/ListResponsible`).doc();

          if (!responsible.id) {
            batch.set(responsibleDocRef, {
              id: responsibleDocRef.id,
              name: responsible.name,
              createdAt: new Date(),
              createdBy: '',
            });
          }
        });
    
        return of(batch);
       
    }

     // get all QualityListResponsibleArea
  getAllListResponsible(): Observable<ResponsibleList[]> {
  return this.afs
    .collection<ResponsibleList>(
      `/db/generalConfig/ListResponsible`,
      (ref) => ref.orderBy('createdAt', 'asc')
    )
    .valueChanges();
  }

  
  deleteListResponsible( id: any
  ): Observable<firebase.default.firestore.WriteBatch> {
    // create batch
    const batch = this.afs.firestore.batch();
    const docRef = this.afs.firestore.doc(
      `/db/generalConfig/ListResponsible/${id}`
    );
    //
    batch.delete( docRef);
    return of(batch);
  }

}