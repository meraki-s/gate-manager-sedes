import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable } from 'rxjs';
import { DisseminationDocument } from '../models/dissemination-document.model';
import * as firebase from 'firebase/compat/app';
import { AuthService } from 'src/app/auth/services/auth.service';
import { take } from 'rxjs/operators';
import { ShortUser } from 'src/app/auth/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class DisseminationService {
  private basePath = 'db/ferreyros/disseminationDocuments';

  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage,
    private authService: AuthService
  ) {}

  /**
   * Get all dissemination documents ordered by order field
   */
  getAllDisseminationDocuments(): Observable<DisseminationDocument[]> {
    return this.afs
      .collection<DisseminationDocument>(this.basePath, (ref) =>
        ref.orderBy('order', 'asc')
      )
      .valueChanges({ idField: 'id' });
  }

  /**
   * Add a new dissemination document
   */
  async addDisseminationDocument(
    file: File,
    name: string,
    description: string,
    required: boolean
  ): Promise<void> {
    const user = await this.authService.user$.pipe(take(1)).toPromise();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const shortUser: ShortUser = {
      displayName: user.name + ' ' + user.lastname,
      uid: user.uid,
    };

    // Get current max order
    const docs = await this.afs
      .collection<DisseminationDocument>(this.basePath)
      .valueChanges()
      .pipe(take(1))
      .toPromise();

    const maxOrder = docs && docs.length > 0
      ? Math.max(...docs.map((d) => d.order || 0))
      : 0;

    // Upload file to storage
    const id = this.afs.createId();
    const filePath = `dissemination-documents/${id}_${file.name}`;
    const fileRef = this.storage.ref(filePath);

    await this.storage.upload(filePath, file).then();
    const fileURL = await fileRef.getDownloadURL().toPromise();

    // Create document
    const doc: DisseminationDocument = {
      id,
      name,
      description,
      fileURL,
      fileName: file.name,
      order: maxOrder + 1,
      required,
      createdBy: shortUser,
      createdAt: firebase.default.firestore.FieldValue.serverTimestamp() as Date &
        firebase.default.firestore.Timestamp,
    };

    return this.afs.doc(`${this.basePath}/${id}`).set(doc);
  }

  /**
   * Update an existing dissemination document (metadata only, not file)
   */
  async updateDisseminationDocument(
    id: string,
    name: string,
    description: string,
    required: boolean
  ): Promise<void> {
    const user = await this.authService.user$.pipe(take(1)).toPromise();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const shortUser: ShortUser = {
      displayName: user.name + ' ' + user.lastname,
      uid: user.uid,
    };

    return this.afs.doc(`${this.basePath}/${id}`).update({
      name,
      description,
      required,
      editedBy: shortUser,
      editedAt: firebase.default.firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * Delete a dissemination document (file and document)
   */
  async deleteDisseminationDocument(doc: DisseminationDocument): Promise<void> {
    // 1. Delete file from Storage
    try {
      const fileRef = this.storage.refFromURL(doc.fileURL);
      await fileRef.delete().toPromise();
    } catch (error) {
      console.error('Error al eliminar archivo de storage:', error);
      // Continue even if file deletion fails
    }

    // 2. Delete document from Firestore
    return this.afs.doc(`${this.basePath}/${doc.id}`).delete();
  }

  /**
   * Reorder documents (update order field for all documents)
   */
  async reorderDocuments(documents: DisseminationDocument[]): Promise<void> {
    const batch = this.afs.firestore.batch();

    documents.forEach((doc, index) => {
      const ref = this.afs.doc(`${this.basePath}/${doc.id}`).ref;
      batch.update(ref, { order: index });
    });

    return batch.commit();
  }
}
