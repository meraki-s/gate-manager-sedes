import { ShortUser } from 'src/app/auth/models/user.model';

export interface EventActivity {
  collaboratorName: string;
  collaboratorDNI: string;
  providerName: string;
  providerRUC: number;
  activity: string;
  description?: string;
  createdAt: Date & firebase.default.firestore.Timestamp;
  createdBy: ShortUser;
}
