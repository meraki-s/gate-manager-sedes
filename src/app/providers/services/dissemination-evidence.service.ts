import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable } from 'rxjs';
import { DisseminationEvidence } from '../models/dissemination-evidence.model';
import { DisseminationDocument } from 'src/app/admin/models/dissemination-document.model';
import * as firebase from 'firebase/compat/app';
import { ShortUser } from 'src/app/auth/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class DisseminationEvidenceService {
  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage
  ) {}

  /**
   * Get all dissemination documents (global list from admin)
   */
  getAllDisseminationDocuments(): Observable<DisseminationDocument[]> {
    return this.afs
      .collection<DisseminationDocument>(
        'db/ferreyros/disseminationDocuments',
        (ref) => ref.orderBy('order', 'asc')
      )
      .valueChanges({ idField: 'id' });
  }

  /**
   * Get evidences for a specific provider
   */
  getProviderEvidences(providerId: string): Observable<DisseminationEvidence[]> {
    return this.afs
      .collection<DisseminationEvidence>(
        `db/ferreyros/providers/${providerId}/disseminationEvidences`
      )
      .valueChanges({ idField: 'id' });
  }

  /**
   * Upload evidence for a dissemination document
   */
  async uploadEvidence(
    providerId: string,
    disseminationDoc: DisseminationDocument,
    file: File,
    providerName: string,
    providerRUC: number,
    currentUser: ShortUser
  ): Promise<void> {
    // 1. Upload file to Storage
    const timestamp = Date.now();
    const filePath = `providers/${providerId}/dissemination-evidence/${timestamp}_${file.name}`;
    const fileRef = this.storage.ref(filePath);

    await this.storage.upload(filePath, file).then();
    const fileURL = await fileRef.getDownloadURL().toPromise();

    // 2. Create evidence document
    const id = this.afs.createId();
    const evidence: DisseminationEvidence = {
      id,
      disseminationDocumentId: disseminationDoc.id,
      disseminationDocumentName: disseminationDoc.name,
      evidenceFileURL: fileURL,
      evidenceFileName: file.name,
      status: 'pending',
      providerId,
      providerName,
      providerRUC,
      createdBy: currentUser,
      createdAt: firebase.default.firestore.FieldValue.serverTimestamp() as Date &
        firebase.default.firestore.Timestamp,
    };

    return this.afs
      .doc(
        `db/ferreyros/providers/${providerId}/disseminationEvidences/${id}`
      )
      .set(evidence);
  }

  /**
   * Update evidence file (re-upload)
   */
  async updateEvidence(
    providerId: string,
    evidenceId: string,
    file: File,
    currentUser: ShortUser
  ): Promise<void> {
    // Get existing evidence to delete old file
    const existingEvidence = await this.afs
      .doc<DisseminationEvidence>(
        `db/ferreyros/providers/${providerId}/disseminationEvidences/${evidenceId}`
      )
      .valueChanges()
      .toPromise();

    if (!existingEvidence) {
      throw new Error('Evidencia no encontrada');
    }

    // Delete old file from storage
    try {
      const oldFileRef = this.storage.refFromURL(existingEvidence.evidenceFileURL);
      await oldFileRef.delete().toPromise();
    } catch (error) {
      console.error('Error al eliminar archivo anterior:', error);
    }

    // Upload new file
    const timestamp = Date.now();
    const filePath = `providers/${providerId}/dissemination-evidence/${timestamp}_${file.name}`;
    const fileRef = this.storage.ref(filePath);

    await this.storage.upload(filePath, file).then();
    const fileURL = await fileRef.getDownloadURL().toPromise();

    // Update evidence
    return this.afs
      .doc(
        `db/ferreyros/providers/${providerId}/disseminationEvidences/${evidenceId}`
      )
      .update({
        evidenceFileURL: fileURL,
        evidenceFileName: file.name,
        status: 'pending',
        updatedBy: currentUser,
        updatedAt: firebase.default.firestore.FieldValue.serverTimestamp(),
      });
  }

  /**
   * Delete evidence
   */
  async deleteEvidence(
    providerId: string,
    evidence: DisseminationEvidence
  ): Promise<void> {
    // 1. Delete from Storage
    try {
      const fileRef = this.storage.refFromURL(evidence.evidenceFileURL);
      await fileRef.delete().toPromise();
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
    }

    // 2. Delete from Firestore
    return this.afs
      .doc(
        `db/ferreyros/providers/${providerId}/disseminationEvidences/${evidence.id}`
      )
      .delete();
  }
}
