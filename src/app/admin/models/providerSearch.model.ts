import { Collaborator } from 'src/app/providers/models/register-collaborator';
import { ValidateDocumentsModel } from 'src/app/providers/models/validate-documents.model';

export interface ProviderSearch {
  providerId: string;
  companyName: string;
  companyRuc: number;
  companyAddress: string;
  companyField: string;
  manager: string;
  salesRepresentative: string;
  status: string;
  ipercFiles: ValidateDocumentsModel[];
  atsFiles: ValidateDocumentsModel[];
  emergencyFiles: ValidateDocumentsModel[];
  petsFiles: ValidateDocumentsModel[];
  certificatesFiles: ValidateDocumentsModel[];
  msdsFiles: ValidateDocumentsModel[];
  checklistFiles: ValidateDocumentsModel[];
  collaborators: Collaborator[];
  blockedBy?: string;
  blockDescription?: string;
}
