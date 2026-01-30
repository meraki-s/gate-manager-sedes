import { ShortUser } from '../../auth/models/user.model';
import { ResponsibleList } from '../../admin/models/setting.model';
export interface historyEntry {
  id: string;
  name: string;
  lastname: string;
  companyName: string;
  companyRuc: number;
  dni: string;
  entryAt: (Date & firebase.default.firestore.Timestamp) | null;
  departureAt: (Date & firebase.default.firestore.Timestamp) | null;
  status: 'enabled' | 'disabled' | 'registered';
  authorizedBy?: string;
  createdAt: Date & firebase.default.firestore.Timestamp;
  createdBy: ShortUser;
  entryDeparture: string;
}
