export interface CommonDateModel {
    uid: string | null | undefined;
    email: string | null | undefined;
    displayName: string | null | undefined;
}

export interface CommonExitsDocumentValidateModel {
    exists: boolean,
    status: 'approved' | 'pending' | 'rejected' | 'notDocuments'
}

