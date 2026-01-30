import { ShortUser } from 'src/app/auth/models/user.model';

export interface Collaborator {
  id: string;
  name: string;
  lastname: string;
  dni: string;
  jobTitle: string;
  inductionStatus:
    | 'approved'
    | 'pending'
    | 'rejected'
    | 'expired'
    | 'unassigned';
  inductionDate: (Date & firebase.default.firestore.Timestamp) | null;

  // symptomatologyStatus:
  //   | 'approved'
  //   | 'pending'
  //   | 'rejected'
  //   | 'expired'
  //   | 'unassigned';
  // symptomatologyDate: Date & firebase.default.firestore.Timestamp | null;
  lotoStatus: 'approved' | 'pending' | 'rejected' | 'expired' | 'unassigned';
  lotoDate: (Date & firebase.default.firestore.Timestamp) | null;
  // medicalExaminationFile?: UploadFile | null;
  // medicalExaminationDate?: (Date & firebase.default.firestore.Timestamp) | null;
  // medicalExaminationStatus?:
  //   | 'approved'
  //   | 'pending'
  //   | 'rejected'
  //   | 'expired'
  //   | 'unassigned';
  // vaccinationCardFile: UploadFile | null;
  // firstDoseDate: (Date & firebase.default.firestore.Timestamp) | null;
  // secondDoseDate: (Date & firebase.default.firestore.Timestamp) | null;
  // thirdDoseDate: (Date & firebase.default.firestore.Timestamp) | null;
  // doseStatus: 'vaccinated' | 'not-fully-vaccinated' | 'unassigned' | 'rejected';
  sctrId: string;
  sctrFile?: UploadFile;
  sctrDate?: Date & firebase.default.firestore.Timestamp;
  sctrStatus?: 'approved' | 'pending' | 'rejected' | 'expired' | 'unassigned';
  svlId: string;
  svlFile: UploadFile;
  svlDate?: Date & firebase.default.firestore.Timestamp;
  svlStatus?: 'approved' | 'pending' | 'rejected' | 'expired' | 'unassigned';
  // swornDeclarationId: string;
  // swornDeclarationFile: UploadFile;
  // swornDeclarationDate?: Date & firebase.default.firestore.Timestamp;
  // swornDeclarationStatus?:
  //   | 'approved'
  //   | 'pending'
  //   | 'rejected'
  //   | 'expired'
  //   | 'unassigned';
  createdBy: ShortUser;
  createdAt: Date & firebase.default.firestore.Timestamp;
  editedBy?: ShortUser;
  editedAt?: Date & firebase.default.firestore.Timestamp;
  companyName: string;
  companyRuc: number;
  providerId: string;
  authorizedBy: string;
  entryDeparture: 'inside' | 'outside';
}

export interface UploadFile {
  fileURL: string;
  name: string;
  type: string;
}
