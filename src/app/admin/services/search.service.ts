import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { combineLatest, Observable, of, firstValueFrom, Subject } from 'rxjs';
import { map, switchMap, take, catchError } from 'rxjs/operators';
import { Provider } from 'src/app/auth/models/provider.model';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Collaborator } from 'src/app/providers/models/register-collaborator';
import { ValidateDocumentsModel } from 'src/app/providers/models/validate-documents.model';
import { environment } from 'src/environments/environment';
import { ProviderSearch } from '../models/providerSearch.model';
import { LoggerService } from './logger.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

export interface DownloadProgress {
  phase: 'fetching' | 'processing' | 'generating' | 'downloading' | 'complete';
  message: string;
  percentage: number;
  currentBatch?: number;
  totalBatches?: number;
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private downloadProgressSubject = new Subject<DownloadProgress>();
  downloadProgress$ = this.downloadProgressSubject.asObservable();

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

  /**
   * Get documents by category for a provider
   * @private
   */
  private async getDocumentsByCategory(
    providerId: string,
    collection: string
  ): Promise<ValidateDocumentsModel[]> {
    try {
      const docs = await firstValueFrom(
        this.afs
          .collection<ValidateDocumentsModel>(
            `db/ferreyros/providers/${providerId}/${collection}`
          )
          .valueChanges()
      );
      return docs || [];
    } catch (error) {
      console.error(`Error obteniendo documentos de ${collection} para proveedor ${providerId}:`, error);
      return [];
    }
  }

  /**
   * Format timestamp to readable date string
   * @private
   */
  private formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';

    try {
      // Handle Firebase Timestamp
      if (timestamp.toDate) {
        const date = timestamp.toDate();
        return this.formatDateObject(date);
      }
      // Handle Date object
      if (timestamp instanceof Date) {
        return this.formatDateObject(timestamp);
      }
      // Handle string
      if (typeof timestamp === 'string') {
        return timestamp;
      }
      return 'N/A';
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Format date object to dd/MM/yyyy
   * @private
   */
  private formatDateObject(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Generate Excel report with all providers and their documents
   * Downloads an Excel file with provider information and document statuses
   */
  async generateProvidersReport(): Promise<void> {
    try {
      // 1. Get all providers
      this.downloadProgressSubject.next({
        phase: 'fetching',
        message: 'Obteniendo lista de proveedores...',
        percentage: 5,
      });

      const providers = await firstValueFrom(this.getAllProviders());

      if (!providers || providers.length === 0) {
        this.snackbar.open('No hay proveedores para generar el reporte', 'Cerrar', {
          duration: 3000,
        });
        return;
      }

      // 2. Collect all document data
      const providersData: any[] = [];

      // Categories to process
      const categories = [
        { name: 'IPERC', collection: 'ipercDocumentsValidate' },
        { name: 'ATS y PTAR', collection: 'atsDocumentsValidate' },
        { name: 'Plan de Emergencia', collection: 'emergencyDocumentsValidate' },
        { name: 'PETS', collection: 'petsDocumentsValidate' },
        { name: 'Certificados', collection: 'certificatesDocumentsValidate' },
        { name: 'MSDS', collection: 'msdsDocumentsValidate' },
        { name: 'Checklist', collection: 'checklistDocumentsValidate' },
      ];

      // Process providers in batches of 10 for better performance
      const batchSize = 10;
      const totalBatches = Math.ceil(providers.length / batchSize);

      for (let i = 0; i < providers.length; i += batchSize) {
        const batch = providers.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;

        // Emit progress
        this.downloadProgressSubject.next({
          phase: 'processing',
          message: `Procesando documentos de proveedores...`,
          percentage: 10 + Math.floor((currentBatch / totalBatches) * 70),
          currentBatch,
          totalBatches,
        });

        // Process batch in parallel
        await Promise.all(
          batch.map(async (provider) => {
            // Process all categories for this provider in parallel
            const categoryPromises = categories.map(async (category) => {
              try {
                const documents = await this.getDocumentsByCategory(
                  provider.id,
                  category.collection
                );

                const rows: any[] = [];

                if (documents && documents.length > 0) {
                  // Add one row per document
                  documents.forEach((doc: ValidateDocumentsModel) => {
                    rows.push({
                      'RUC': provider.companyRuc,
                      'Empresa': provider.companyName,
                      'Categoría': category.name,
                      'Nombre Documento': doc.name || 'Sin nombre',
                      'URL Documento': doc.fileURL || 'N/A',
                      'Estado': this.translateStatus(doc.status),
                      'Fecha Validez': this.formatDate(doc.validityDate),
                      'Creado Por': doc.createdBy?.displayName || 'N/A',
                      'Fecha Creación': this.formatDate(doc.createdAt),
                      'Actualizado Por': doc.updatedBy?.displayName || 'N/A',
                      'Fecha Actualización': this.formatDate(doc.updatedAt),
                    });
                  });
                } else {
                  // If no documents in category, add one row with "Sin documentos"
                  rows.push({
                    'RUC': provider.companyRuc,
                    'Empresa': provider.companyName,
                    'Categoría': category.name,
                    'Nombre Documento': 'Sin documentos',
                    'URL Documento': 'N/A',
                    'Estado': 'N/A',
                    'Fecha Validez': 'N/A',
                    'Creado Por': 'N/A',
                    'Fecha Creación': 'N/A',
                    'Actualizado Por': 'N/A',
                    'Fecha Actualización': 'N/A',
                  });
                }

                return rows;
              } catch (error) {
                console.error(
                  `Error al obtener documentos de ${category.name} para proveedor ${provider.companyName}:`,
                  error
                );
                return [];
              }
            });

            const categoryResults = await Promise.all(categoryPromises);
            // Flatten and add to providersData
            categoryResults.forEach((rows) => {
              providersData.push(...rows);
            });
          })
        );
      }

      // 3. Generate Excel
      if (providersData.length === 0) {
        this.snackbar.open('No hay datos para generar el reporte', 'Cerrar', {
          duration: 3000,
        });
        return;
      }

      this.downloadProgressSubject.next({
        phase: 'generating',
        message: 'Generando archivo Excel...',
        percentage: 85,
      });

      const ws = XLSX.utils.json_to_sheet(providersData);

      // Configure column widths
      ws['!cols'] = [
        { wch: 12 }, // RUC
        { wch: 30 }, // Empresa
        { wch: 20 }, // Categoría
        { wch: 40 }, // Nombre Documento
        { wch: 50 }, // URL Documento
        { wch: 12 }, // Estado
        { wch: 15 }, // Fecha Validez
        { wch: 20 }, // Creado Por
        { wch: 18 }, // Fecha Creación
        { wch: 20 }, // Actualizado Por
        { wch: 18 }, // Fecha Actualización
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Proveedores y Documentos');

      // 4. Download file
      this.downloadProgressSubject.next({
        phase: 'downloading',
        message: 'Preparando descarga...',
        percentage: 95,
      });

      const timestamp = new Date();
      const dateStr = this.formatDateObject(timestamp).replace(/\//g, '-');
      const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `proveedores_documentos_${dateStr}_${timeStr}.xlsx`;

      // Generate buffer and download
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      FileSaver.saveAs(data, fileName);

      this.downloadProgressSubject.next({
        phase: 'complete',
        message: '¡Descarga completada!',
        percentage: 100,
      });

      this.snackbar.open('✅ Reporte descargado exitosamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ Error al generar el reporte:', error);
      this.snackbar.open(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, 'Cerrar', {
        duration: 5000,
      });
      throw error;
    }
  }

  /**
   * Translate status from English to Spanish
   * @private
   */
  private translateStatus(status: string): string {
    const translations: { [key: string]: string } = {
      'approved': 'Aprobado',
      'pending': 'Pendiente',
      'rejected': 'Rechazado',
      'expired': 'Vencido',
    };
    return translations[status] || status || 'N/A';
  }

  /**
   * Get dissemination evidences for a provider
   * @param providerId - provider id
   * @returns Observable of dissemination evidences array
   */
  getProviderDisseminationEvidences(
    providerId: string
  ): Observable<any[]> {
    return this.afs
      .collection(
        `db/ferreyros/providers/${providerId}/disseminationEvidences`
      )
      .valueChanges({ idField: 'id' });
  }

  /**
   * Approve dissemination evidence
   * @param providerId - provider id
   * @param evidenceId - evidence id
   * @param providerName - provider name
   * @param providerRUC - provider RUC
   * @returns Promise
   */
  async approveDisseminationEvidence(
    providerId: string,
    evidenceId: string,
    providerName: string,
    providerRUC: number
  ): Promise<void> {
    const currentUser = await firstValueFrom(this.authService.user$);
    if (!currentUser) throw new Error('No authenticated user');

    const evidenceRef = this.afs.firestore.doc(
      `db/ferreyros/providers/${providerId}/disseminationEvidences/${evidenceId}`
    );

    await evidenceRef.update({
      status: 'approved',
      updatedBy: {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
      },
      updatedAt: new Date(),
    });

    // Log activity
    this.loggerService.saveActivity(
      providerName,
      providerRUC,
      'Aprobó evidencia de documento de difusión',
      currentUser.displayName || 'Admin',
      ''
    );
  }

  /**
   * Reject dissemination evidence
   * @param providerId - provider id
   * @param evidenceId - evidence id
   * @param reason - rejection reason
   * @param providerName - provider name
   * @param providerRUC - provider RUC
   * @returns Promise
   */
  async rejectDisseminationEvidence(
    providerId: string,
    evidenceId: string,
    reason: string,
    providerName: string,
    providerRUC: number
  ): Promise<void> {
    const currentUser = await firstValueFrom(this.authService.user$);
    if (!currentUser) throw new Error('No authenticated user');

    const evidenceRef = this.afs.firestore.doc(
      `db/ferreyros/providers/${providerId}/disseminationEvidences/${evidenceId}`
    );

    await evidenceRef.update({
      status: 'rejected',
      rejectionReason: reason,
      updatedBy: {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email,
      },
      updatedAt: new Date(),
    });

    // Log activity
    this.loggerService.saveActivity(
      providerName,
      providerRUC,
      `Rechazó evidencia de documento de difusión - Motivo: ${reason}`,
      currentUser.displayName || 'Admin',
      ''
    );
  }
}
