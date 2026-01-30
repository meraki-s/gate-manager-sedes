import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { combineLatest, Observable, of } from 'rxjs';
import { map, switchMap, take, catchError } from 'rxjs/operators';
import { Provider } from 'src/app/auth/models/provider.model';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Collaborator } from 'src/app/providers/models/register-collaborator';
import { ValidateDocumentsModel } from 'src/app/providers/models/validate-documents.model';
import { environment } from 'src/environments/environment';
import { ProviderSearch } from '../models/providerSearch.model';
import { LoggerService } from './logger.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(
    private afs: AngularFirestore,
    private http: HttpClient,
    private loggerService: LoggerService,
    private authService: AuthService,
    private snackbar: MatSnackBar
  ) {}

  /**
   *Get a provider by ruc number
   *
   * @param {number} ruc - ruc number
   * @return {*}  {Observable<Provider>}
   * @memberof SearchService
   */
  getProvider(ruc: number): Observable<ProviderSearch | null> {
    if (!ruc) return of(null);

    const provider$ = this.afs
      .collection<Provider>(`db/ferreyros/providers`, (ref) =>
        ref.where('companyRuc', '==', ruc)
      )
      .valueChanges();

    return provider$.pipe(
      switchMap((providerList) => {
        if (providerList.length > 0) {
          const provider = providerList[0];

          // const covid$: Observable<ValidateDocumentsModel[]> = this.afs
          //   .collection<ValidateDocumentsModel>(
          //     `db/ferreyros/providers/${provider.id}/covidDocumentsValidate`
          //   )
          //   .valueChanges();
          const iperc$: Observable<ValidateDocumentsModel[]> = this.afs
            .collection<ValidateDocumentsModel>(
              `db/ferreyros/providers/${provider.id}/ipercDocumentsValidate`
            )
            .valueChanges();
          const ats$: Observable<ValidateDocumentsModel[]> = this.afs
            .collection<ValidateDocumentsModel>(
              `db/ferreyros/providers/${provider.id}/atsDocumentsValidate`
            )
            .valueChanges();
          const emergency$: Observable<ValidateDocumentsModel[]> = this.afs
            .collection<ValidateDocumentsModel>(
              `db/ferreyros/providers/${provider.id}/emergencyDocumentsValidate`
            )
            .valueChanges();
          // const loto$: Observable<ValidateDocumentsModel[]> = this.afs
          //   .collection<ValidateDocumentsModel>(
          //     `db/ferreyros/providers/${provider.id}/lotoDocumentsValidate`
          //   )
          //   .valueChanges();
          // const procedures$: Observable<ValidateDocumentsModel[]> = this.afs
          //   .collection<ValidateDocumentsModel>(
          //     `db/ferreyros/providers/${provider.id}/proceduresDocumentsValidate`
          //   )
          //   .valueChanges();
          
          const pets$: Observable<ValidateDocumentsModel[]> = this.afs
            .collection<ValidateDocumentsModel>(
              `db/ferreyros/providers/${provider.id}/petsDocumentsValidate`
            )
            .valueChanges();
          const certificates$: Observable<ValidateDocumentsModel[]> = this.afs
            .collection<ValidateDocumentsModel>(
              `db/ferreyros/providers/${provider.id}/certificatesDocumentsValidate`
            )
            .valueChanges();
          const msds$: Observable<ValidateDocumentsModel[]> = this.afs
            .collection<ValidateDocumentsModel>(
              `db/ferreyros/providers/${provider.id}/msdsDocumentsValidate`
            )
            .valueChanges();
          const checklist$: Observable<ValidateDocumentsModel[]> = this.afs
            .collection<ValidateDocumentsModel>(
              `db/ferreyros/providers/${provider.id}/checklistDocumentsValidate`
            )
            .valueChanges();
          const collaborators$: Observable<Collaborator[]> = this.afs
            .collection<Collaborator>(
              `db/ferreyros/providers/${provider.id}/collaborators`
            )
            .valueChanges();

          const providerSearch$: Observable<ProviderSearch> = combineLatest([           
            iperc$,
            ats$,
            emergency$,
            pets$,
            certificates$,
            msds$,
            checklist$,
            collaborators$,
          ]).pipe(
            map(([iperc, ats, emergency, pets, certificates, msds, checklist, collabs]) => {
              const providerData: ProviderSearch = {
                providerId: provider.id,
                companyName: provider.companyName,
                companyRuc: provider.companyRuc,
                companyAddress: provider.companyAddress,
                companyField: provider.companyField,
                manager: provider.manager,
                salesRepresentative: provider.salesRepresentative,
                status: provider.status,
                blockedBy: provider.blockedBy,
                blockDescription: provider.blockDescription,
                ipercFiles: iperc as ValidateDocumentsModel[],
                atsFiles: ats as ValidateDocumentsModel[],
                emergencyFiles: emergency as ValidateDocumentsModel[],
                petsFiles: pets as ValidateDocumentsModel[],
                certificatesFiles: certificates as ValidateDocumentsModel[],
                msdsFiles: msds as ValidateDocumentsModel[],
                checklistFiles: checklist as ValidateDocumentsModel[],
                collaborators: collabs as Collaborator[],
              };

              return providerData;
            })
          );

          return providerSearch$;
        } else {
          return of(null);
        }
      })
    );
  }

  /**
   * get all providers in database
   *
   * @return {*}  {Observable<Provider[]>}
   * @memberof SearchService
   */
  getAllProviders(): Observable<Provider[]> {
    const providers$ = this.afs
      .collection<Provider>(`db/ferreyros/providers`, (ref) =>
        ref.orderBy('companyName', 'asc')
      )
      .valueChanges();

    return providers$;
  }

  /**
   *Approve documents
   *
   * @param {ValidateDocumentsModel[]} files - files to approve
   * @param {string} providerId - provider id
   * @param {string} providerName - provider name
   * @param {number} providerRUC - provider ruc
   * @param {string} collectionName - collection name
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof SearchService
   */
  approveDocuments(
    files: ValidateDocumentsModel[],
    providerId: string,
    providerName: string,
    providerRUC: number,
    collectionName: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    if (!files.length || !providerId) return of();

    const batch = this.afs.firestore.batch();

    files.forEach((file) => {
      const fileRef = this.afs.firestore
        .collection(`db/ferreyros/providers/${providerId}/${collectionName}`)
        .doc(file.id);

      batch.update(fileRef, { status: 'approved' });
    });

    this.loggerService.saveActivity(
      providerName,
      providerRUC,
      `Aprobación de documentos ${collectionName}`
    );

    return of(batch);
  }

  /**
   *Reject documents
   *
   * @param {ValidateDocumentsModel[]} files
   * @param {string} providerId
   * @param {string} collectionName
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof SearchService
   */
  rejectDocuments(
    files: ValidateDocumentsModel[],
    providerId: string,
    providerName: string,
    providerRUC: number,
    collectionName: string
  ): Observable<firebase.default.firestore.WriteBatch> {
    if (!files.length || !providerId) return of();

    const batch = this.afs.firestore.batch();

    files.forEach((file) => {
      const fileRef = this.afs.firestore
        .collection(`db/ferreyros/providers/${providerId}/${collectionName}`)
        .doc(file.id);

      batch.update(fileRef, { status: 'rejected' });
    });

    this.loggerService.saveActivity(
      providerName,
      providerRUC,
      `Rechazo de documentos ${collectionName}`
    );

    return of(batch);
  }

  /**
   * toggle provider status (enabled/disabled)
   *
   * @param {string} status - provider status
   * @param {string} providerId - provider id
   * @param {string} providerName - provider name
   * @param {number} providerRUC - provider ruc
   * @param {string} [description] - description
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof SearchService
   */
  toggleProviderStatus(
    status: string,
    providerId: string,
    providerName: string,
    providerRUC: number,
    description?: string
  ): Observable<firebase.default.firestore.WriteBatch | null> {
    if (!providerId) return of();

    return this.authService.user$.pipe(
      switchMap((user) => {
        if (user) {
          const batch = this.afs.firestore.batch();

          const providerRef = this.afs.firestore
            .collection(`db/ferreyros/providers`)
            .doc(providerId);
          const toggledStatus = status === 'enabled' ? 'disabled' : 'enabled';

          batch.update(providerRef, {
            status: toggledStatus,
            blockedBy: toggledStatus === 'disabled' ? user.displayName : null,
            blockDescription: toggledStatus === 'disabled' ? description : null,
          });

          this.loggerService.saveActivity(
            providerName,
            providerRUC,
            `Cambio de estado a ${toggledStatus}`,
            '',
            '',
            description
          );

          return of(batch);
        } else {
          return of(null);
        }
      })
    );
  }

  /**
   * sync provider data with google drive (induction and symtomatology form)
   *
   * @param {string} collaboratorId - collaborator id
   * @param {string} collaboratorName - collaborator name
   * @param {string} dni - collaborator dni
   * @param {string} providerId - provider id
   * @param {string} providerName - provider name
   * @param {number} providerRUC - provider ruc
   * @return {*}  {Observable<{
   *     batch: firebase.default.firestore.WriteBatch;
   *     driveData: Partial<Collaborator>;
   *   }>}
   * @memberof SearchService
   */
  syncDrive(
    collaboratorId: string,
    collaboratorName: string,
    dni: string,
    providerId: string,
    providerName: string,
    providerRUC: number
  ): Observable<{
    batch: firebase.default.firestore.WriteBatch;
    driveData: Partial<Collaborator>;
  }> {
    // create batch
    const batch = this.afs.firestore.batch();

    const collaboratorDocRef = this.afs.firestore.doc(
      `db/ferreyros/providers/${providerId}/collaborators/${collaboratorId}`
    );

    return this.http.get(environment.queryDriveURL + `/${dni}`).pipe(
      take(1),
      map((res: any) => {
        const data = res.data;
        console.log(data);

        const driveData: Partial<Collaborator> = {
          inductionStatus: data['inductionStatus'] ?? 'unassigned',
          inductionDate:
            (new Date(data['inductionValidity']) as Date &
              firebase.default.firestore.Timestamp) ?? null,
          // symptomatologyStatus: data['symptomatologyStatus'] ?? 'unassigned',
          // symptomatologyDate:
          //   (new Date(data['symptomatologyValidity']) as Date &
          //     firebase.default.firestore.Timestamp) ?? null,
        };

        batch.update(collaboratorDocRef, driveData);

        this.loggerService.saveActivity(
          providerName,
          providerRUC,
          `Sincronización de datos con Google Drive`,
          collaboratorName,
          dni
        );

        return { batch, driveData };
      }),
      catchError((err) => {
        const driveData: Partial<Collaborator> = {
          inductionStatus: 'unassigned',
          inductionDate: null,
          // symptomatologyStatus: 'unassigned',
          // symptomatologyDate: null,
          lotoStatus: 'unassigned',
          lotoDate: null,
        };

        batch.update(collaboratorDocRef, driveData);

        return of({ batch, driveData });
      })
    );
  }

  /**
   * aprrove collaborator medical examination
   *
   * @param {string} collaboratorId - collaborator id
   * @param {string} collaboratorName - collaborator name
   * @param {string} collaboratorDNI - collaborator dni
   * @param {string} providerId - provider id
   * @param {string} providerName - provider name
   * @param {number} providerRUC - provider ruc
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof SearchService
   */
  // approveMedicalExamination(
  //   collaboratorId: string,
  //   collaboratorName: string,
  //   collaboratorDNI: string,
  //   providerId: string,
  //   providerName: string,
  //   providerRUC: number
  // ): Observable<firebase.default.firestore.WriteBatch> {
  //   // create batch
  //   const batch = this.afs.firestore.batch();

  //   const collaboratorDocRef = this.afs.firestore.doc(
  //     `db/ferreyros/providers/${providerId}/collaborators/${collaboratorId}`
  //   );

  //   const driveData: Partial<Collaborator> = {
  //     medicalExaminationStatus: 'approved',
  //   };

  //   batch.update(collaboratorDocRef, driveData);

  //   this.loggerService.saveActivity(
  //     providerName,
  //     providerRUC,
  //     `Aprobación de examen médico`,
  //     collaboratorName,
  //     collaboratorDNI
  //   );

  //   return of(batch);
  // }

  /**
   * reject collaborator medical examination
   *
   * @param {string} collaboratorId - collaborator id
   * @param {string} collaboratorName - collaborator name
   * @param {string} collaboratorDNI - collaborator dni
   * @param {string} providerId - provider id
   * @param {string} providerName - provider name
   * @param {number} providerRUC - provider ruc
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof SearchService
   */
  // rejectMedicalExamination(
  //   collaboratorId: string,
  //   collaboratorName: string,
  //   collaboratorDNI: string,
  //   providerId: string,
  //   providerName: string,
  //   providerRUC: number
  // ): Observable<firebase.default.firestore.WriteBatch> {
  //   // create batch
  //   const batch = this.afs.firestore.batch();

  //   const collaboratorDocRef = this.afs.firestore.doc(
  //     `db/ferreyros/providers/${providerId}/collaborators/${collaboratorId}`
  //   );

  //   const driveData: Partial<Collaborator> = {
  //     medicalExaminationStatus: 'rejected',
  //   };

  //   batch.update(collaboratorDocRef, driveData);

  //   this.loggerService.saveActivity(
  //     providerName,
  //     providerRUC,
  //     `Rechazo de examen médico`,
  //     collaboratorName,
  //     collaboratorDNI
  //   );

  //   return of(batch);
  // }

  /**
   * approve collaborator vaccination card
   *
   * @param {string} collaboratorId - collaborator id
   * @param {string} collaboratorName - collaborator name
   * @param {string} collaboratorDNI - collaborator dni
   * @param {string} providerId - provider id
   * @param {string} providerName - provider name
   * @param {number} providerRUC - provider ruc
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof SearchService
   */
  // approveVaccinationCard(
  //   collaboratorId: string,
  //   collaboratorName: string,
  //   collaboratorDNI: string,
  //   providerId: string,
  //   providerName: string,
  //   providerRUC: number
  // ): Observable<firebase.default.firestore.WriteBatch> {
  //   // create batch
  //   const batch = this.afs.firestore.batch();

  //   const collaboratorDocRef = this.afs.firestore.doc(
  //     `db/ferreyros/providers/${providerId}/collaborators/${collaboratorId}`
  //   );

  //   const driveData: Partial<Collaborator> = {
  //     doseStatus: 'vaccinated',
  //   };

  //   batch.update(collaboratorDocRef, driveData);

  //   this.loggerService.saveActivity(
  //     providerName,
  //     providerRUC,
  //     `Aprobación de carnet de vacunación`,
  //     collaboratorName,
  //     collaboratorDNI
  //   );

  //   return of(batch);
  // }

  /**
   * reject collaborator vaccination card
   *
   * @param {string} collaboratorId - collaborator id
   * @param {string} collaboratorName - collaborator name
   * @param {string} collaboratorDNI - collaborator dni
   * @param {string} providerId - provider id
   * @param {string} providerName - provider name
   * @param {number} providerRUC - provider ruc
   * @return {*}  {Observable<firebase.default.firestore.WriteBatch>}
   * @memberof SearchService
   */
  // rejectVaccinationCard(
  //   collaboratorId: string,
  //   collaboratorName: string,
  //   collaboratorDNI: string,
  //   providerId: string,
  //   providerName: string,
  //   providerRUC: number
  // ): Observable<firebase.default.firestore.WriteBatch> {
  //   // create batch
  //   const batch = this.afs.firestore.batch();

  //   const collaboratorDocRef = this.afs.firestore.doc(
  //     `db/ferreyros/providers/${providerId}/collaborators/${collaboratorId}`
  //   );

  //   // const data: Partial<Collaborator> = {
  //   //   doseStatus: 'not-fully-vaccinated',
  //   // };

  //   // batch.update(collaboratorDocRef, data);

  //   this.loggerService.saveActivity(
  //     providerName,
  //     providerRUC,
  //     `Rechazo de carnet de vacunación`,
  //     collaboratorName,
  //     collaboratorDNI
  //   );

  //   return of(batch);
  // }

  deleteCollaboratorFromAdmin(
    collaboratorId: string,
    providerId: string
  ): void {
    this.afs
      .doc(
        `db/ferreyros/providers/${providerId}/collaborators/${collaboratorId}`
      )
      .delete()
      .then((res) => {
        this.snackbar.open('✅ Colaborador eliminado', 'Aceptar', {
          duration: 6000,
        });
      })
      .catch((err) => {
        console.log(err);
        this.snackbar.open('🚩 Parece que hubo un error', 'Aceptar', {
          duration: 6000,
        });
      });
  }
}
