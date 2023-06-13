import { ShortUser } from 'src/app/auth/models/user.model';
import { CommonExitsDocumentValidateModel } from 'src/app/shared/models/common.models';

export interface ValidateDocumentsModel {
  id: string;
  validityDate: Date & firebase.default.firestore.Timestamp;
  file?: string;
  fileURL: string;
  name: string;
  type: string;
  uploadPercent: string;
  createdAt: Date & firebase.default.firestore.Timestamp;
  createdBy: ShortUser;
  updatedAt: Date & firebase.default.firestore.Timestamp;
  updatedBy: ShortUser;
  status: 'rejected' | 'approved' | 'pending';
}

export interface ExitsDocumentValidateModel
  extends CommonExitsDocumentValidateModel {}
