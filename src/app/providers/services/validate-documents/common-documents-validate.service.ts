import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, of } from "rxjs";
import { shareReplay, switchMap, take } from "rxjs/operators";
import { ExitsDocumentValidateModel, ValidateDocumentsModel } from "../../models/validate-documents.model";
import { User } from "src/app/auth/models/user.model";

@Injectable({
    providedIn: 'root',
})

export class CommonDocumentsValidateService {

    validations = {
        validationApprovedDateFalse: JSON.stringify({ status: 'approved', validityDate: false }),
        validationApprovedDateTrue: JSON.stringify({ status: 'approved', validityDate: true }),
        validationPendingDateFalse: JSON.stringify({ status: 'pending', validityDate: false }),
        validationPendingDateTrue: JSON.stringify({ status: 'pending', validityDate: true })
    };

    private existsApproved: ExitsDocumentValidateModel[] = [
        { exists: true, status: 'approved' },
        { exists: false, status: 'pending' },
        { exists: false, status: 'rejected' },
        { exists: false, status: 'notDocuments' },
    ];

    private existsPending: ExitsDocumentValidateModel[] = [
        { exists: false, status: 'approved' },
        { exists: true, status: 'pending' },
        { exists: false, status: 'rejected' },
        { exists: false, status: 'notDocuments' },
    ];

    private existsReject: ExitsDocumentValidateModel[] = [
        { exists: false, status: 'approved' },
        { exists: false, status: 'pending' },
        { exists: true, status: 'rejected' },
        { exists: false, status: 'notDocuments' },
    ];

    private existsNotDocuments: ExitsDocumentValidateModel[] = [
        { exists: false, status: 'approved' },
        { exists: false, status: 'pending' },
        { exists: false, status: 'rejected' },
        { exists: true, status: 'notDocuments' },
    ];

    constructor(
        private afs: AngularFirestore,
        private afAuth: AngularFireAuth,
        private storage: AngularFireStorage,
    ) { }

    validityDate(item?: ValidateDocumentsModel | any): boolean {
        try {
            const date = new Date();
            const oldDate = new Date(item?.validityDate['seconds'] * 1000);
            const newDate = new Date(date)
            oldDate.setHours(23, 59, 59, 59);
            newDate.setHours(23, 59, 59, 59);
            if (oldDate >= newDate) {
                return false;
            } else {
                return true;
            }
        } catch (error) {
            console.log(error)
            return false;
        }
    }

    async deletePdf(imagesObj: string): Promise<any> {
        return await this.storage.storage.refFromURL(imagesObj).delete();
    }

    getUser(): Observable<User | undefined> {
        return this.afAuth.authState.pipe(
            switchMap((user) => {
                return this.afs.collection<User>('users').doc(`${user?.uid}`).valueChanges()
            }),
            shareReplay(1),
            take(1)
        )
    }

    getExistsApprovedTrue(): ExitsDocumentValidateModel[] {
        return this.existsApproved;
    }

    getExistsApprovedFalse(): ExitsDocumentValidateModel[] {
        return this.existsNotDocuments;
    }

    getExistsPendingTrue(): ExitsDocumentValidateModel[] {
        return this.existsPending;
    }

    getExistsPendingFalse(): ExitsDocumentValidateModel[] {
        return this.existsNotDocuments;
    }

    getExistsRejectTrue(): ExitsDocumentValidateModel[] {
        return this.existsReject;
    }

    getExistsRejectFalse(): ExitsDocumentValidateModel[] {
        return this.existsNotDocuments;
    }

    getExistsNotDocuments(): ExitsDocumentValidateModel[] {
        return this.existsNotDocuments;
    }
}
