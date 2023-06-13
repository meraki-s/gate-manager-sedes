import { UploadFile } from './register-collaborator';

export interface scanCollaborator {
  providerId: string;
  companyName: string;
  companyRuc: number;
  salesRepresentative: string;
  status: 'registered' | 'enabled' | 'disabled';
  blockedBy: string;
  numberOfWorkers: number;
  name: string;
  lastname: string;
  jobTitle: string;
  dni: string;
  phone: number;
  collaboratorId: string;
  medicalExaminationStatus:
    | 'approved'
    | 'pending'
    | 'rejected'
    | 'expired'
    | 'unassigned';
  medicalExaminationFile: UploadFile;
  medicalExaminationDate: (Date & firebase.default.firestore.Timestamp) | null;
  doseStatus: 'vaccinated' | 'not-fully-vaccinated' | 'unassigned' | 'rejected';
  vaccinationCardFile: UploadFile | null;
  firstDoseDate: (Date & firebase.default.firestore.Timestamp) | null;
  secondDoseDate: (Date & firebase.default.firestore.Timestamp) | null;
  thirdDoseDate: (Date & firebase.default.firestore.Timestamp) | null;
  sctrFile?: UploadFile;
  sctrDate?: Date & firebase.default.firestore.Timestamp;
  sctrStatus?: 'approved' | 'pending' | 'rejected' | 'expired' | 'unassigned';
  svlFile: UploadFile;
  svlDate?: Date & firebase.default.firestore.Timestamp;
  svlStatus?: 'approved' | 'pending' | 'rejected' | 'expired' | 'unassigned';
  swornDeclarationFile: UploadFile;
  swornDeclarationDate?: Date & firebase.default.firestore.Timestamp;
  swornDeclarationStatus?:
    | 'approved'
    | 'pending'
    | 'rejected'
    | 'expired'
    | 'unassigned';
  inductionStatus:
    | 'approved'
    | 'pending'
    | 'rejected'
    | 'expired'
    | 'unassigned';
  inductionDate: (Date & firebase.default.firestore.Timestamp) | null;
  symptomatologyStatus:
    | 'approved'
    | 'pending'
    | 'rejected'
    | 'expired'
    | 'unassigned';
  symptomatologyDate: (Date & firebase.default.firestore.Timestamp) | null;
  authorizedBy: string;
  entryDeparture: 'inside' | 'outside';
}
