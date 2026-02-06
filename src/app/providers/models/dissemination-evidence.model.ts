import { ShortUser } from '../../auth/models/user.model';

export interface DisseminationEvidence {
  id: string;
  disseminationDocumentId: string; // Referencia al documento de difusión
  disseminationDocumentName: string;

  evidenceFileURL: string;
  evidenceFileName: string;

  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;

  providerId: string;
  providerName: string;
  providerRUC: number;

  createdBy: ShortUser;
  createdAt: Date & firebase.default.firestore.Timestamp;
  updatedBy?: ShortUser;
  updatedAt?: Date & firebase.default.firestore.Timestamp;
}
