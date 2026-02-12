import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, combineLatest, from, Observable, Subscription } from 'rxjs';
import {
  concatMap,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
  take,
} from 'rxjs/operators';
import { Provider } from 'src/app/auth/models/provider.model';
import {
  Collaborator,
  UploadFile,
} from 'src/app/providers/models/register-collaborator';
import { ValidateDocumentsModel } from 'src/app/providers/models/validate-documents.model';
import { VisorPdfComponent } from 'src/app/shared/components/visor-pdf/visor-pdf.component';
import { ProviderSearch } from '../../models/providerSearch.model';
import { SearchService } from '../../services/search.service';
import { RejectedDescriptionComponent } from './dialogs/rejected-description/rejected-description.component';
import { DeleteCollaboratorComponent } from './dialogs/delete-collaborator/delete-collaborator.component';
import { DisseminationReviewComponent } from './dialogs/dissemination-review/dissemination-review.component';
import { DisseminationDocument } from '../../models/dissemination-document.model';
import { DisseminationEvidence } from 'src/app/providers/models/dissemination-evidence.model';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  //#region controllers
  searchDNIControl = new FormControl();
  searchRUCControl = new FormControl();
  //#endregion

  //#region observables
  searchDNI = new BehaviorSubject<boolean>(false);
  searchDNI$ = this.searchDNI.asObservable();

  searchRUC = new BehaviorSubject<boolean>(false);
  searchRUC$ = this.searchRUC.asObservable();

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  loadingDocuments = new BehaviorSubject<boolean>(false);
  loadingDocuments$ = this.loading.asObservable();

  loadingMedicalExamination = new BehaviorSubject<boolean>(false);
  loadingMedicalExamination$ = this.loading.asObservable();

  loadingVaccinationCard = new BehaviorSubject<boolean>(false);
  loadingVaccinationCard$ = this.loading.asObservable();

  syncingDrive = new BehaviorSubject<boolean>(false);
  syncingDrive$ = this.syncingDrive.asObservable();

  syncAllProgress = new BehaviorSubject<{ current: number; total: number } | null>(null);
  syncAllProgress$ = this.syncAllProgress.asObservable();

  providers$!: Observable<Provider[]>;
  collaborators = new BehaviorSubject<Collaborator[]>([]);
  collaborators$ = this.collaborators.asObservable();

  disseminationData$!: Observable<any[]>;
  //#endregion

  //#region other variables
  firstTime = true;

  ruc: string = '';
  providerSearch!: ProviderSearch | null;
  filteredCollaborators$!: Observable<Collaborator[]>;
  documents = [
    {
      name: 'IPERC',
      collection: 'ipercDocumentsValidate',
      files: new Array<ValidateDocumentsModel>(),
      status: 'pending',
    },
    {
      name: 'ATS y PTAR',
      collection: 'atsDocumentsValidate',
      files: new Array<ValidateDocumentsModel>(),
    },
    {
      name: 'Plan de emergencia',
      collection: 'emergencyDocumentsValidate',
      files: new Array<ValidateDocumentsModel>(),
    },
    {
      name: 'PETS',
      collection: 'petsDocumentsValidate',
      files: new Array<ValidateDocumentsModel>(),
    },
    {
      name: 'Certificados',
      collection: 'certificatesDocumentsValidate',
      files: new Array<ValidateDocumentsModel>(),
    },
    {
      name: 'MSDS',
      collection: 'msdsDocumentsValidate',
      files: new Array<ValidateDocumentsModel>(),
    },
    {
      name: 'Checklist',
      collection: 'checklistDocumentsValidate',
      files: new Array<ValidateDocumentsModel>(),
    },
  ];

  subscriptions = new Subscription();
  isMobile!: boolean;
  //#endregion

  constructor(
    private searchService: SearchService,
    private route: ActivatedRoute,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
    private breakpoint: BreakpointObserver,
    private afs: AngularFirestore
  ) {}

  ngOnInit(): void {
    // check if app is runing on mobile device adn prortrait orientation
    this.subscriptions.add(
      this.breakpoint
        .observe([Breakpoints.HandsetPortrait])
        .subscribe((res) => {
          if (res.matches) {
            this.isMobile = true;
          } else {
            this.isMobile = false;
          }
        })
    );

    // check if component route has params for provider pre-loading
    this.subscriptions.add(
      this.route.params.subscribe((params) => {
        if (params['ruc']) {
          this.ruc = params['ruc'];

          this.searchRUCControl.setValue(this.ruc);
          this.searchRUC.next(true);
          this.firstTime = false;
        }
      })
    );

    this.searchDNIControl.disable();

    // search by ruc subscription
    this.subscriptions.add(
      this.searchRUC$
        .pipe(
          filter((searching) => searching),
          switchMap(() => {
            this.loading.next(true);

            const ruc = parseInt(
              this.searchRUCControl.value['companyRuc']
                ? this.searchRUCControl.value['companyRuc']
                : this.searchRUCControl.value
            );

            return this.searchService.getProvider(ruc);
          })
        )
        .subscribe((provider) => {
          if (provider) {
            this.providerSearch = { ...provider };
            this.providerSearch.collaborators =
              this.providerSearch.collaborators.map((collaborator) => {
                const sctrValidity = collaborator.sctrDate
                  ? collaborator.sctrDate.toMillis()
                  : null;
                const svlValidity = collaborator.svlDate
                  ? collaborator.svlDate.toMillis()
                  : null;
                // const swornDeclarationValidity =
                //   collaborator.swornDeclarationDate
                //     ? collaborator.swornDeclarationDate.toMillis()
                //     : null;
                const now = Date.now();

                if (sctrValidity && sctrValidity < now) {
                  collaborator.sctrStatus = 'expired';
                }

                if (svlValidity && svlValidity < now) {
                  collaborator.svlStatus = 'expired';
                }

                // if (
                //   swornDeclarationValidity &&
                //   swornDeclarationValidity < now
                // ) {
                //   collaborator.swornDeclarationStatus = 'expired';
                // }

                return collaborator;
              });

            this.providerSearch.collaborators =
              this.providerSearch.collaborators.sort((a, b) => {
                return a.entryDeparture.localeCompare(b.entryDeparture);
              });
            this.buildDocumentData(provider);
            this.buildDisseminationData(provider.providerId);
            this.searchDNIControl.enable();
            this.collaborators.next(this.providerSearch.collaborators);
          } else {
            this.providerSearch = null;
            this.searchDNIControl.disable();
            this.snackbar.open('😞 No se encontró el proveedor', 'Cerrar', {
              duration: 5000,
            });
          }

          this.loading.next(false);
          this.searchDNI.next(false);
        })
    );

    this.filteredCollaborators$ = combineLatest(
      this.collaborators$,
      this.searchDNIControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      )
    ).pipe(
      map(([collaborators, dni]) => {
        if (!dni) return collaborators;

        const term = dni.toLowerCase().trim();
        return collaborators.filter((collaborator) => {
          return collaborator.dni.toLowerCase().includes(term);
        });
      })
    );

    // providers observable
    this.providers$ = combineLatest(
      this.searchService.getAllProviders(),
      this.searchRUCControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      )
    ).pipe(
      map(([providers, ruc]) => {
        let filteredProviders = [...providers];

        filteredProviders = filteredProviders.filter((provider) => {
          return (
            provider.companyRuc.toString().includes(ruc) ||
            provider.companyName
              .toLowerCase()
              .includes(String(ruc).toLowerCase())
          );
        });

        return filteredProviders;
      })
    );
  }

  ngOnDestroy(): void {}

  displayProvider(provider: Provider): string {
    return provider && provider.companyName
      ? provider.companyName + ' | ' + provider.companyRuc
      : '';
  }

  selectedProvider(event: MatAutocompleteSelectedEvent): void {
    this.firstTime = false;
    this.searchRUC.next(true);
  }

  searchByDNI(): void {
    this.searchDNI.next(true);
  }

  searchByRUC(): void {
    this.firstTime = false;
    this.searchRUC.next(true);
  }

  buildDocumentData(provider: ProviderSearch): void {
    this.documents.forEach((document, index) => {
      this.documents[index].files = [];
    });

    //#region iperc
    this.documents[0].files = provider.ipercFiles;
    // check if there is a file with pending status
    provider.ipercFiles.some((file) => {
      if (file.status === 'pending') {
        this.documents[0].status = 'pending';
        return false;
      }
      return true;
    });

    // check if there is a file with approved status otherwise set to rejected
    this.documents[0].status = provider.ipercFiles.every(
      (file) => file.status === 'approved'
    )
      ? 'approved'
      : provider.ipercFiles.every((file) => file.status === 'rejected')
      ? 'rejected'
      : 'pending';
    //#endregion

    //#region ats
    this.documents[1].files = provider.atsFiles;
    // check if there is a file with pending status
    provider.atsFiles.some((file) => {
      if (file.status === 'pending') {
        this.documents[1].status = 'pending';
        return false;
      }
      return true;
    });

    // check if there is a file with approved status otherwise set to rejected
    this.documents[1].status = provider.atsFiles.every(
      (file) => file.status === 'approved'
    )
      ? 'approved'
      : provider.atsFiles.every((file) => file.status === 'rejected')
      ? 'rejected'
      : 'pending';
    //#endregion

    //#region emergency
    this.documents[2].files = provider.emergencyFiles;
    // check if there is a file with pending status
    provider.emergencyFiles.some((file) => {
      if (file.status === 'pending') {
        this.documents[2].status = 'pending';
        return false;
      }
      return true;
    });

    // check if there is a file with approved status otherwise set to rejected
    this.documents[2].status = provider.emergencyFiles.every(
      (file) => file.status === 'approved'
    )
      ? 'approved'
      : provider.emergencyFiles.every((file) => file.status === 'rejected')
      ? 'rejected'
      : 'pending';
    //#endregion

    //#region pets
    this.documents[3].files = provider.petsFiles;
    // check if there is a file with pending status
    provider.petsFiles.some((file) => {
      if (file.status === 'pending') {
        this.documents[3].status = 'pending';
        return false;
      }
      return true;
    });

    // check if there is a file with approved status otherwise set to rejected
    this.documents[3].status = provider.petsFiles.every(
      (file) => file.status === 'approved'
    )
      ? 'approved'
      : provider.petsFiles.every((file) => file.status === 'rejected')
      ? 'rejected'
      : 'pending';
    //#endregion

    //#region procedures
    this.documents[4].files = provider.certificatesFiles;
    // check if there is a file with pending status
    provider.certificatesFiles.some((file) => {
      if (file.status === 'pending') {
        this.documents[4].status = 'pending';
        return false;
      }
      return true;
    });

    // check if there is a file with approved status otherwise set to rejected
    this.documents[4].status = provider.certificatesFiles.every(
      (file) => file.status === 'approved'
    )
      ? 'approved'
      : provider.certificatesFiles.every((file) => file.status === 'rejected')
      ? 'rejected'
      : 'pending';
    //#endregion

    //#region msds
    this.documents[5].files = provider.msdsFiles;
    // check if there is a file with pending status
    provider.msdsFiles.some((file) => {
      if (file.status === 'pending') {
        this.documents[5].status = 'pending';
        return false;
      }
      return true;
    });

    // check if there is a file with approved status otherwise set to rejected
    this.documents[5].status = provider.msdsFiles.every(
      (file) => file.status === 'approved'
    )
      ? 'approved'
      : provider.msdsFiles.every((file) => file.status === 'rejected')
      ? 'rejected'
      : 'pending';
    //#endregion

    //#region checklist
    this.documents[6].files = provider.checklistFiles;
    // check if there is a file with pending status
    provider.checklistFiles.some((file) => {
      if (file.status === 'pending') {
        this.documents[6].status = 'pending';
        return false;
      }
      return true;
    });

    // check if there is a file with approved status otherwise set to rejected
    this.documents[6].status = provider.checklistFiles.every(
      (file) => file.status === 'approved'
    )
      ? 'approved'
      : provider.checklistFiles.every((file) => file.status === 'rejected')
      ? 'rejected'
      : 'pending';
    //#endregion
  }

  approveDocuments(
    files: ValidateDocumentsModel[],
    collectionName: string,
    index: number
  ): void {
    this.loadingDocuments.next(true);
    this.searchService
      .approveDocuments(
        files,
        this.providerSearch!.providerId,
        this.providerSearch!.companyName,
        this.providerSearch!.companyRuc,
        collectionName
      )
      .pipe(take(1))
      .subscribe((batch) => {
        if (batch) {
          batch
            .commit()
            .then(() => {
              this.documents[index].files.forEach((file, i) => {
                this.documents[index].files[i].status = 'approved';
              });
              this.documents[index].status = 'approved';
              this.loadingDocuments.next(false);
              this.snackbar.open('✅ Documentos aprobados', 'Cerrar', {
                duration: 5000,
              });
            })
            .catch((err) => {
              this.loadingDocuments.next(false);
              this.snackbar.open('😞 Error al aprobar documentos', 'Cerrar', {
                duration: 5000,
              });
            });
        }
      });
  }

  rejectDocuments(
    files: ValidateDocumentsModel[],
    collectionName: string,
    index: number
  ): void {
    this.loadingDocuments.next(true);
    this.searchService
      .rejectDocuments(
        files,
        this.providerSearch!.providerId,
        this.providerSearch!.companyName,
        this.providerSearch!.companyRuc,
        collectionName
      )
      .pipe(take(1))
      .subscribe((batch) => {
        if (batch) {
          batch
            .commit()
            .then(() => {
              this.documents[index].files.forEach((file, i) => {
                this.documents[index].files[i].status = 'rejected';
              });
              this.documents[index].status = 'rejected';
              this.loadingDocuments.next(false);
              this.snackbar.open('❌ Documentos rechazados', 'Cerrar', {
                duration: 5000,
              });
            })
            .catch(() => {
              this.loadingDocuments.next(false);
              this.snackbar.open('😞 Error al rechazar documentos', 'Cerrar', {
                duration: 5000,
              });
            });
        }
      });
  }

  toggleProviderStatus(): void {
    if (!this.providerSearch) return;

    this.loadingDocuments.next(true);
    if (this.providerSearch.status === 'enabled') {
      this.dialog
        .open(RejectedDescriptionComponent, {
          data: this.providerSearch.companyName,
        })
        .afterClosed()
        .pipe(take(1))
        .subscribe((desc) => {
          if (desc) {
            this.searchService
              .toggleProviderStatus(
                this.providerSearch!.status,
                this.providerSearch!.providerId,
                this.providerSearch!.companyName,
                this.providerSearch!.companyRuc,
                desc
              )
              .pipe(take(1))
              .subscribe((batch) => {
                if (batch) {
                  batch.commit().then(() => {
                    this.providerSearch!.status =
                      this.providerSearch!.status === 'enabled'
                        ? 'disabled'
                        : 'enabled';
                    this.loadingDocuments.next(false);
                    this.snackbar.open('✅ Estado actualizado', 'Cerrar', {
                      duration: 5000,
                    });
                  });
                }
              });
          }
        });
    } else {
      this.searchService
        .toggleProviderStatus(
          this.providerSearch.status,
          this.providerSearch.providerId,
          this.providerSearch.companyName,
          this.providerSearch.companyRuc
        )
        .pipe(take(1))
        .subscribe((batch) => {
          if (batch) {
            batch.commit().then(() => {
              this.providerSearch!.status =
                this.providerSearch!.status === 'enabled'
                  ? 'disabled'
                  : 'enabled';
              this.loadingDocuments.next(false);
              this.snackbar.open('✅ Estado actualizado', 'Cerrar', {
                duration: 5000,
              });
            });
          }
        });
    }
  }

  openPdfViewer(file: UploadFile | undefined | null): void {
    if (!file) return;

    this.dialog.open(VisorPdfComponent, {
      width: '100%',
      data: file,
      panelClass: 'border-dialog',
    });
  }

  syncDrive(collaborator: Collaborator, index: number): void {
    this.syncingDrive.next(true);

    this.searchService
      .syncDrive(
        collaborator.id,
        collaborator.name + ' ' + collaborator.lastname,
        collaborator.dni,
        this.providerSearch!.providerId,
        this.providerSearch!.companyName,
        this.providerSearch!.companyRuc
      )
      .pipe(take(1))
      .subscribe((res) => {
        if (res) {
          res.batch
            .commit()
            .then(() => {
              this.providerSearch!.collaborators[index].inductionStatus = res
                .driveData.inductionStatus
                ? res.driveData.inductionStatus
                : 'unassigned';
              this.providerSearch!.collaborators[index].inductionDate = res
                .driveData.inductionDate
                ? res.driveData.inductionDate
                : (new Date(0) as Date & firebase.default.firestore.Timestamp);
              // this.providerSearch!.collaborators[index].symptomatologyStatus =
              //   res.driveData.symptomatologyStatus
              //     ? res.driveData.symptomatologyStatus
              //     : 'unassigned';
              // this.providerSearch!.collaborators[index].symptomatologyDate = res
              //   .driveData.symptomatologyDate
              //   ? res.driveData.symptomatologyDate
              //   : (new Date(0) as Date & firebase.default.firestore.Timestamp);
              this.syncingDrive.next(false);
              this.snackbar.open('✅ Drive sincronizado', 'Cerrar', {
                duration: 5000,
              });
            })
            .catch(() => {
              this.syncingDrive.next(false);
              this.snackbar.open('😞 Error al sincronizar Drive', 'Cerrar', {
                duration: 5000,
              });
            });
        }
      });
  }

  syncAllDrive(): void {
    const collaborators = this.providerSearch?.collaborators;
    if (!collaborators || collaborators.length === 0) return;

    const total = collaborators.length;
    let current = 0;

    this.syncingDrive.next(true);
    this.syncAllProgress.next({ current, total });

    const requests = collaborators.map((collaborator, index) =>
      this.searchService
        .syncDrive(
          collaborator.id,
          collaborator.name + ' ' + collaborator.lastname,
          collaborator.dni,
          this.providerSearch!.providerId,
          this.providerSearch!.companyName,
          this.providerSearch!.companyRuc
        )
        .pipe(
          take(1),
          map((res) => ({ res, index }))
        )
    );

    from(requests)
      .pipe(concatMap((req) => req))
      .subscribe({
        next: ({ res, index }) => {
          current++;
          this.syncAllProgress.next({ current, total });
          if (res) {
            res.batch.commit().then(() => {
              this.providerSearch!.collaborators[index].inductionStatus = res
                .driveData.inductionStatus
                ? res.driveData.inductionStatus
                : 'unassigned';
              this.providerSearch!.collaborators[index].inductionDate = res
                .driveData.inductionDate
                ? res.driveData.inductionDate
                : (new Date(0) as Date & firebase.default.firestore.Timestamp);
            });
          }
        },
        error: () => {
          this.syncingDrive.next(false);
          this.syncAllProgress.next(null);
          this.snackbar.open('😞 Error al sincronizar Drive', 'Cerrar', {
            duration: 5000,
          });
        },
        complete: () => {
          this.syncingDrive.next(false);
          this.syncAllProgress.next(null);
          this.snackbar.open('✅ Drive sincronizado para todos', 'Cerrar', {
            duration: 5000,
          });
        },
      });
  }

  deleteCollaborator(collaborator: Collaborator, providerId: string): void {
    console.log(collaborator, providerId);

    this.dialog.open(DeleteCollaboratorComponent, {
      data: { collaborator: collaborator, providerId: providerId },
    });
  }

  /**
   * Build dissemination data for the provider
   * Combines dissemination documents with provider's evidences
   */
  buildDisseminationData(providerId: string): void {
    const disseminationDocuments$ = this.afs
      .collection<DisseminationDocument>('db/ferreyros/disseminationDocuments', (ref) =>
        ref.orderBy('order', 'asc')
      )
      .valueChanges({ idField: 'id' });

    const disseminationEvidences$ = this.searchService.getProviderDisseminationEvidences(providerId);

    this.disseminationData$ = combineLatest([
      disseminationDocuments$,
      disseminationEvidences$,
    ]).pipe(
      map(([documents, evidences]) => {
        return documents.map((doc) => {
          const evidence = evidences.find(
            (e: DisseminationEvidence) => e.disseminationDocumentId === doc.id
          );
          return {
            document: doc,
            evidence: evidence || null,
            status: evidence?.status || 'not-uploaded',
          };
        });
      })
    );
  }

  /**
   * Open dissemination review dialog
   */
  onReviewDisseminationEvidence(item: any): void {
    if (!item.evidence) return;

    const dialogRef = this.dialog.open(DisseminationReviewComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: {
        document: item.document,
        evidence: item.evidence,
        providerName: this.providerSearch!.companyName,
        providerRUC: this.providerSearch!.companyRuc,
      },
      panelClass: 'border-dialog',
    });

    dialogRef.afterClosed().pipe(take(1)).subscribe((result) => {
      if (result) {
        // Evidence was approved/rejected, refresh will happen automatically via observable
        this.snackbar.open('✅ Evidencia actualizada', 'Cerrar', {
          duration: 2000,
        });
      }
    });
  }

  /**
   * Get status color for dissemination evidence
   */
  getDisseminationStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'primary';
      case 'pending':
        return 'accent';
      case 'rejected':
        return 'warn';
      default:
        return '';
    }
  }

  /**
   * Get status icon for dissemination evidence
   */
  getDisseminationStatusIcon(status: string): string {
    switch (status) {
      case 'approved':
        return 'check_circle';
      case 'pending':
        return 'schedule';
      case 'rejected':
        return 'cancel';
      case 'not-uploaded':
        return 'cloud_off';
      default:
        return 'help';
    }
  }

  /**
   * Get status text for dissemination evidence
   */
  getDisseminationStatusText(status: string): string {
    switch (status) {
      case 'approved':
        return 'Aprobada';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazada';
      case 'not-uploaded':
        return 'No subida';
      default:
        return 'Desconocido';
    }
  }

  // approveMedicalExamination(collaborator: Collaborator): void {
  //   this.loadingMedicalExamination.next(true);
  //   this.searchService
  //     .approveMedicalExamination(
  //       collaborator.id,
  //       collaborator.name + ' ' + collaborator.lastname,
  //       collaborator.dni,
  //       this.providerSearch!.providerId,
  //       this.providerSearch!.companyName,
  //       this.providerSearch!.companyRuc
  //     )
  //     .pipe(take(1))
  //     .subscribe((batch) => {
  //       if (batch) {
  //         batch
  //           .commit()
  //           .then(() => {
  //             const index = this.providerSearch!.collaborators.findIndex(
  //               (col) => col.id === collaborator.id
  //             );
  //             this.providerSearch!.collaborators[
  //               index
  //             ].medicalExaminationStatus = 'approved';
  //             this.loadingMedicalExamination.next(false);
  //             this.snackbar.open('✅ Examen médico aprobado', 'Cerrar', {
  //               duration: 5000,
  //             });
  //           })
  //           .catch(() => {
  //             this.loadingMedicalExamination.next(false);
  //             this.snackbar.open(
  //               '😞 Error al aprobar examen médico',
  //               'Cerrar',
  //               {
  //                 duration: 5000,
  //               }
  //             );
  //           });
  //       }
  //     });
  // }

  // rejectMedicalExamination(collaborator: Collaborator): void {
  //   this.loadingMedicalExamination.next(true);
  //   this.searchService
  //     .rejectMedicalExamination(
  //       collaborator.id,
  //       collaborator.name + ' ' + collaborator.lastname,
  //       collaborator.dni,
  //       this.providerSearch!.providerId,
  //       this.providerSearch!.companyName,
  //       this.providerSearch!.companyRuc
  //     )
  //     .pipe(take(1))
  //     .subscribe((batch) => {
  //       if (batch) {
  //         batch
  //           .commit()
  //           .then(() => {
  //             const index = this.providerSearch!.collaborators.findIndex(
  //               (col) => col.id === collaborator.id
  //             );
  //             this.providerSearch!.collaborators[
  //               index
  //             ].medicalExaminationStatus = 'rejected';
  //             this.loadingMedicalExamination.next(false);
  //             this.snackbar.open('❌ Examen médico rechazado', 'Cerrar', {
  //               duration: 5000,
  //             });
  //           })
  //           .catch(() => {
  //             this.loadingMedicalExamination.next(false);
  //             this.snackbar.open(
  //               '😞 Error al rechazar examen médico',
  //               'Cerrar',
  //               {
  //                 duration: 5000,
  //               }
  //             );
  //           });
  //       }
  //     });
  // }

  // approveVaccinationCard(collaborator: Collaborator): void {
  //   this.loadingVaccinationCard.next(true);
  //   this.searchService
  //     .approveVaccinationCard(
  //       collaborator.id,
  //       collaborator.name + ' ' + collaborator.lastname,
  //       collaborator.dni,
  //       this.providerSearch!.providerId,
  //       this.providerSearch!.companyName,
  //       this.providerSearch!.companyRuc
  //     )
  //     .pipe(take(1))
  //     .subscribe((batch) => {
  //       if (batch) {
  //         batch
  //           .commit()
  //           .then(() => {
  //             const index = this.providerSearch!.collaborators.findIndex(
  //               (col) => col.id === collaborator.id
  //             );
  //             this.providerSearch!.collaborators[index].doseStatus =
  //               'vaccinated';
  //             this.loadingVaccinationCard.next(false);
  //             this.snackbar.open('✅ Carnet de vacunación aprobado', 'Cerrar', {
  //               duration: 5000,
  //             });
  //           })
  //           .catch(() => {
  //             this.loadingVaccinationCard.next(false);
  //             this.snackbar.open(
  //               '😞 Error al aprobar carnet de vacunación',
  //               'Cerrar',
  //               {
  //                 duration: 5000,
  //               }
  //             );
  //           });
  //       }
  //     });
  // }

  // rejectVaccinationCard(collaborator: Collaborator): void {
  //   this.loadingVaccinationCard.next(true);
  //   this.searchService
  //     .rejectVaccinationCard(
  //       collaborator.id,
  //       collaborator.name + ' ' + collaborator.lastname,
  //       collaborator.dni,
  //       this.providerSearch!.providerId,
  //       this.providerSearch!.companyName,
  //       this.providerSearch!.companyRuc
  //     )
  //     .pipe(take(1))
  //     .subscribe((batch) => {
  //       if (batch) {
  //         batch
  //           .commit()
  //           .then(() => {
  //             const index = this.providerSearch!.collaborators.findIndex(
  //               (col) => col.id === collaborator.id
  //             );
  //             // this.providerSearch!.collaborators[index].doseStatus =
  //             //   'not-fully-vaccinated';
  //             this.loadingVaccinationCard.next(false);
  //             this.snackbar.open(
  //               '❌ Carnet de vacunación rechazado',
  //               'Cerrar',
  //               {
  //                 duration: 5000,
  //               }
  //             );
  //           })
  //           .catch(() => {
  //             this.loadingVaccinationCard.next(false);
  //             this.snackbar.open(
  //               '😞 Error al rechazar carnet de vacunación',
  //               'Cerrar',
  //               {
  //                 duration: 5000,
  //               }
  //             );
  //           });
  //       }
  //     });
  // }

}
