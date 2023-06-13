import { ShortUser } from 'src/app/auth/models/user.model';
import { UploadFile } from './register-collaborator';

export interface RegisterVisit {
  id: string;
  name: string;
  lastname: string;
  dni: number;
  jobTitle: string;
  telephone: number;
  visitDate: Date & firebase.default.firestore.Timestamp;
  invitedBy: string;
  reasonVisit: string;
  covidFile: UploadFile;
  covidDate: Date & firebase.default.firestore.Timestamp;
  covidStatus: 'approved' | 'pending' | 'rejected';
  sctrFile: UploadFile;
  sctrDate: Date & firebase.default.firestore.Timestamp;
  sctrStatus: 'approved' | 'pending' | 'rejected';
  vaccinationCardFile: UploadFile;
  firstDoseDate: Date & firebase.default.firestore.Timestamp;
  secondDoseDate: Date & firebase.default.firestore.Timestamp;
  thirdDoseDate: Date & firebase.default.firestore.Timestamp;
  doseStatus: 'vaccinated' | 'not-fully-vaccinated';
  status: 'approved' | 'pending' | 'canceled' | 'rejected';
  createdBy: ShortUser;
  createdAt: Date & firebase.default.firestore.Timestamp;
  editedBy?: ShortUser;
  editedAt?: Date & firebase.default.firestore.Timestamp;
  accessStatus: 'inside' | 'outside' | 'waiting';
  companyName: string;
  companyRuc: number;
  providerId: string;
}
