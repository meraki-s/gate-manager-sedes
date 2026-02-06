import { ShortUser } from '../../auth/models/user.model';

export interface DisseminationDocument {
  id: string;
  name: string;
  description?: string;
  fileURL: string;
  fileName: string;
  order: number; // Para ordenar en UI
  required: boolean;

  createdBy: ShortUser;
  createdAt: Date & firebase.default.firestore.Timestamp;
  editedBy?: ShortUser;
  editedAt?: Date & firebase.default.firestore.Timestamp;
}
