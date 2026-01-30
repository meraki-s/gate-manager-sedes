import { User } from "src/app/auth/models/user.model";

export interface Location {
  id: string;
  name: string;
  usersRelated: Array<User>;
  visits: number;
  worksInProgress: number;
  workersOnLocation: number;
  createdAt: Date & firebase.default.firestore.Timestamp;
  createdBy: string;
  editedAt: Date & firebase.default.firestore.Timestamp;
  editedBy: string;
}
