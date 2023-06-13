import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import {
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

  providers$!: Observable<Provider[]>;
  collaborators = new BehaviorSubject<Collaborator[]>([]);
  collaborators$ = this.collaborators.asObservable();
  //#endregion

  //#region other variables
  firstTime = true;

  ruc: string = '';
  providerSearch!: ProviderSearch | null;
  filteredCollaborators$!: Observable<Collaborator[]>;
  documents = [
    {
      name: 'Plan COVID',
      collection: 'covidDocumentsValidate',
      files: new Array<ValidateDocumentsModel>(),
    },
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
      collection: 'lotoDocumentsValidate',
      files: new Array<ValidateDocumentsModel>(),
    },
    {
      name: 'PETS',
      collection: 'proceduresDocumentsValidate',
      files: new Array<ValidateDocumentsModel>(),
    },
    {
      name: 'MSDS',
      collection: 'msdsDocumentsValidate',
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
    private breakpoint: BreakpointObserver
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
                const swornDeclarationValidity =
                  collaborator.swornDeclarationDate
                    ? collaborator.swornDeclarationDate.toMillis()
                    : null;
                const now = Date.now();

                if (sctrValidity && sctrValidity < now) {
                  collaborator.sctrStatus = 'expired';
                }

                if (svlValidity && svlValidity < now) {
                  collaborator.svlStatus = 'expired';
                }

                if (
                  swornDeclarationValidity &&
                  swornDeclarationValidity < now
                ) {
                  collaborator.swornDeclarationStatus = 'expired';
                }

                return collaborator;
              });

            this.providerSearch.collaborators =
              this.providerSearch.collaborators.sort((a, b) => {
                return a.entryDeparture.localeCompare(b.entryDeparture);
              });
            this.buildDocumentData(provider);
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

    //#region covid
    this.documents[0].files = provider.covidPlanFiles;
    // check if there is a file with pending status
    provider.covidPlanFiles.some((file) => {
      if (file.status === 'pending') {
        this.documents[0].status = 'pending';
        return false;
      }
      return true;
    });

    // check if there is a file with approved status otherwise set to rejected
    this.documents[0].status = provider.covidPlanFiles.every(
      (file) => file.status === 'approved'
    )
      ? 'approved'
      : provider.covidPlanFiles.every((file) => file.status === 'rejected')
      ? 'rejected'
      : 'pending';
    //#endregion

    //#region iperc
    this.documents[1].files = provider.ipercFiles;
    // check if there is a file with pending status
    provider.ipercFiles.some((file) => {
      if (file.status === 'pending') {
        this.documents[1].status = 'pending';
        return false;
      }
      return true;
    });

    // check if there is a file with approved status otherwise set to rejected
    this.documents[1].status = provider.ipercFiles.every(
      (file) => file.status === 'approved'
    )
      ? 'approved'
      : provider.ipercFiles.every((file) => file.status === 'rejected')
      ? 'rejected'
      : 'pending';
    //#endregion

    //#region ats
    this.documents[2].files = provider.atsFiles;
    // check if there is a file with pending status
    provider.atsFiles.some((file) => {
      if (file.status === 'pending') {
        this.documents[2].status = 'pending';
        return false;
      }
      return true;
    });

    // check if there is a file with approved status otherwise set to rejected
    this.documents[2].status = provider.atsFiles.every(
      (file) => file.status === 'approved'
    )
      ? 'approved'
      : provider.atsFiles.every((file) => file.status === 'rejected')
      ? 'rejected'
      : 'pending';
    //#endregion

    //#region loto
    this.documents[3].files = provider.lotoFiles;
    // check if there is a file with pending status
    provider.lotoFiles.some((file) => {
      if (file.status === 'pending') {
        this.documents[3].status = 'pending';
        return false;
      }
      return true;
    });

    // check if there is a file with approved status otherwise set to rejected
    this.documents[3].status = provider.lotoFiles.every(
      (file) => file.status === 'approved'
    )
      ? 'approved'
      : provider.lotoFiles.every((file) => file.status === 'rejected')
      ? 'rejected'
      : 'pending';
    //#endregion

    //#region procedures
    this.documents[4].files = provider.proceduresFiles;
    // check if there is a file with pending status
    provider.proceduresFiles.some((file) => {
      if (file.status === 'pending') {
        this.documents[4].status = 'pending';
        return false;
      }
      return true;
    });

    // check if there is a file with approved status otherwise set to rejected
    this.documents[4].status = provider.proceduresFiles.every(
      (file) => file.status === 'approved'
    )
      ? 'approved'
      : provider.proceduresFiles.every((file) => file.status === 'rejected')
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
              this.providerSearch!.collaborators[index].symptomatologyStatus =
                res.driveData.symptomatologyStatus
                  ? res.driveData.symptomatologyStatus
                  : 'unassigned';
              this.providerSearch!.collaborators[index].symptomatologyDate = res
                .driveData.symptomatologyDate
                ? res.driveData.symptomatologyDate
                : (new Date(0) as Date & firebase.default.firestore.Timestamp);
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

  approveMedicalExamination(collaborator: Collaborator): void {
    this.loadingMedicalExamination.next(true);
    this.searchService
      .approveMedicalExamination(
        collaborator.id,
        collaborator.name + ' ' + collaborator.lastname,
        collaborator.dni,
        this.providerSearch!.providerId,
        this.providerSearch!.companyName,
        this.providerSearch!.companyRuc
      )
      .pipe(take(1))
      .subscribe((batch) => {
        if (batch) {
          batch
            .commit()
            .then(() => {
              const index = this.providerSearch!.collaborators.findIndex(
                (col) => col.id === collaborator.id
              );
              this.providerSearch!.collaborators[
                index
              ].medicalExaminationStatus = 'approved';
              this.loadingMedicalExamination.next(false);
              this.snackbar.open('✅ Examen médico aprobado', 'Cerrar', {
                duration: 5000,
              });
            })
            .catch(() => {
              this.loadingMedicalExamination.next(false);
              this.snackbar.open(
                '😞 Error al aprobar examen médico',
                'Cerrar',
                {
                  duration: 5000,
                }
              );
            });
        }
      });
  }

  rejectMedicalExamination(collaborator: Collaborator): void {
    this.loadingMedicalExamination.next(true);
    this.searchService
      .rejectMedicalExamination(
        collaborator.id,
        collaborator.name + ' ' + collaborator.lastname,
        collaborator.dni,
        this.providerSearch!.providerId,
        this.providerSearch!.companyName,
        this.providerSearch!.companyRuc
      )
      .pipe(take(1))
      .subscribe((batch) => {
        if (batch) {
          batch
            .commit()
            .then(() => {
              const index = this.providerSearch!.collaborators.findIndex(
                (col) => col.id === collaborator.id
              );
              this.providerSearch!.collaborators[
                index
              ].medicalExaminationStatus = 'rejected';
              this.loadingMedicalExamination.next(false);
              this.snackbar.open('❌ Examen médico rechazado', 'Cerrar', {
                duration: 5000,
              });
            })
            .catch(() => {
              this.loadingMedicalExamination.next(false);
              this.snackbar.open(
                '😞 Error al rechazar examen médico',
                'Cerrar',
                {
                  duration: 5000,
                }
              );
            });
        }
      });
  }

  approveVaccinationCard(collaborator: Collaborator): void {
    this.loadingVaccinationCard.next(true);
    this.searchService
      .approveVaccinationCard(
        collaborator.id,
        collaborator.name + ' ' + collaborator.lastname,
        collaborator.dni,
        this.providerSearch!.providerId,
        this.providerSearch!.companyName,
        this.providerSearch!.companyRuc
      )
      .pipe(take(1))
      .subscribe((batch) => {
        if (batch) {
          batch
            .commit()
            .then(() => {
              const index = this.providerSearch!.collaborators.findIndex(
                (col) => col.id === collaborator.id
              );
              this.providerSearch!.collaborators[index].doseStatus =
                'vaccinated';
              this.loadingVaccinationCard.next(false);
              this.snackbar.open('✅ Carnet de vacunación aprobado', 'Cerrar', {
                duration: 5000,
              });
            })
            .catch(() => {
              this.loadingVaccinationCard.next(false);
              this.snackbar.open(
                '😞 Error al aprobar carnet de vacunación',
                'Cerrar',
                {
                  duration: 5000,
                }
              );
            });
        }
      });
  }

  rejectVaccinationCard(collaborator: Collaborator): void {
    this.loadingVaccinationCard.next(true);
    this.searchService
      .rejectVaccinationCard(
        collaborator.id,
        collaborator.name + ' ' + collaborator.lastname,
        collaborator.dni,
        this.providerSearch!.providerId,
        this.providerSearch!.companyName,
        this.providerSearch!.companyRuc
      )
      .pipe(take(1))
      .subscribe((batch) => {
        if (batch) {
          batch
            .commit()
            .then(() => {
              const index = this.providerSearch!.collaborators.findIndex(
                (col) => col.id === collaborator.id
              );
              this.providerSearch!.collaborators[index].doseStatus =
                'not-fully-vaccinated';
              this.loadingVaccinationCard.next(false);
              this.snackbar.open(
                '❌ Carnet de vacunación rechazado',
                'Cerrar',
                {
                  duration: 5000,
                }
              );
            })
            .catch(() => {
              this.loadingVaccinationCard.next(false);
              this.snackbar.open(
                '😞 Error al rechazar carnet de vacunación',
                'Cerrar',
                {
                  duration: 5000,
                }
              );
            });
        }
      });
  }
}
