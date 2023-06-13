import { CommonDateModel } from 'src/app/shared/models/common.models';
import { CollaboratorList, UploadFile } from './register-collaborator';

export interface SctrModel {
    id: string;
    createdBy: CommonDateModel;
    createdAt: Date | any;
    editedBy?: CommonDateModel;
    editedAt?: CommonDateModel;
    codigo: number,
    validityDate: Date | any,
    sctrFile: UploadFile;
    colaboratorList: CollaboratorList[];
}