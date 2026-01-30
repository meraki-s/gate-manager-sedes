export interface User {
  uid: string;
  email: string;
  name: string;
  lastname: string;
  charge: string;
  displayName: string;
  dni: string;
  jobTitle: string;
  phone: string;
  companyName: string;
  companyRuc: number;
  companyAddress: string;
  companyField: string;
  companyLogoURL: string;
  salesRepresentative: string;
  ceo: string;
  providerId: string;
  role: 'Administrator' | 'Provider' | 'Visitor' | 'Vigilant' | 'Superuser';
  // locations: Array<{ name: string; id: string }>;
  // currentLocation: string;
  createdAt: Date & firebase.default.firestore.Timestamp;
  createdBy: string;
  status: 'registered' | 'enabled' | 'disabled';
}

export interface ShortUser {
  displayName: string;
  uid: string;
}
