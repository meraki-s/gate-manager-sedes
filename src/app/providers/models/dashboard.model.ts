import { ShortUser } from 'src/app/auth/models/user.model';
import { Collaborator, UploadFile } from './register-collaborator';

export interface SCTR {
  id: string;
  code: string;
  validityDate: Date & firebase.default.firestore.Timestamp;
  sctrFile: UploadFile;
  collaborators: Array<Collaborator>;
  createdBy: ShortUser;
  createdAt: Date & firebase.default.firestore.Timestamp;
  editedBy?: ShortUser;
  editedAt?: Date & firebase.default.firestore.Timestamp;
}

export interface SVL {
  id: string;
  code: string;
  validityDate: Date & firebase.default.firestore.Timestamp;
  svlFile: UploadFile;
  collaborators: Array<Collaborator>;
  createdBy: ShortUser;
  createdAt: Date & firebase.default.firestore.Timestamp;
  editedBy?: ShortUser;
  editedAt?: Date & firebase.default.firestore.Timestamp;
}

export interface SwornDeclaration {
  id: string;
  code: string;
  validityDate: Date & firebase.default.firestore.Timestamp;
  swornDeclarationFile: UploadFile | null;
  collaborators: Array<Collaborator>;
  createdBy: ShortUser;
  createdAt: Date & firebase.default.firestore.Timestamp;
  editedBy?: ShortUser | null;
  editedAt?: Date & firebase.default.firestore.Timestamp;
}

