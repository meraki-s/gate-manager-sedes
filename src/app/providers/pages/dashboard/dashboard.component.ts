import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  Subscription,
} from 'rxjs';
import {
  debounceTime,
  filter,
  startWith,
  map,
  take,
  switchMap,
  tap,
} from 'rxjs/operators';

//#region Services
import { AtsValidateDocumentsService } from '../../services/validate-documents/ats-validate-documents.service';
import { CommonDocumentsValidateService } from '../../services/validate-documents/common-documents-validate.service';
import { CovidValidateDocumentsService } from '../../services/validate-documents/covid-validate-documents.service';
import { DashboardService } from '../../services/dashboard.services';
import { IpercValidateDocumentsService } from '../../services/validate-documents/iperc-validate-documents.service';
import { EmergencyValidateDocumentsService } from '../../services/validate-documents/emergency-validate-documents.service';
import { MsdsValidateDocumentsService } from '../../services/validate-documents/msds-validate-documents.service';
import { PetsValidateDocumentsService } from '../../services/validate-documents/pets-validate-documents.service';
import { SwornDeclarationService } from '../../services/sworn-declaration.service';
//#endregion

//#region Components
import { AddSctrDialogComponent } from './dialogs/add-sctr-dialog/add-sctr-dialog.component';
import { AddSegVidaLeyDialogComponent } from './dialogs/add-seg-vida-ley-dialog/add-seg-vida-ley-dialog.component';
import { AddSwornDeclarationComponent } from './dialogs/sworn-declaration/add-sworn-declaration/add-sworn-declaration.component';
import { AtsComponent } from './dialogs-validate-documents/ats/ats.component';
import { CovidComponent } from './dialogs-validate-documents/covid/covid.component';
import { DeleteCollaboratorComponent } from './dialogs/delete-collaborator/delete-collaborator.component';
import { DeleteSegVidaLeyDialogComponent } from './dialogs/delete-seg-vida-ley-dialog/delete-seg-vida-ley-dialog.component';
import { DeleteSwornDeclarationComponent } from './dialogs/sworn-declaration/delete-sworn-declaration/delete-sworn-declaration.component';
import { DeleteSctrDialogComponent } from './dialogs/delete-sctr-dialog/delete-sctr-dialog.component';
import { EditCollaboratorComponent } from './dialogs/edit-collaborator/edit-collaborator.component';
import { EditSctrDialogComponent } from './dialogs/edit-sctr-dialog/edit-sctr-dialog.component';
import { EditSegVidaLeyDialogComponent } from './dialogs/edit-seg-vida-ley-dialog/edit-seg-vida-ley-dialog.component';
import { IpercComponent } from './dialogs-validate-documents/iperc/iperc.component';
import { EmergencyComponent } from './dialogs-validate-documents/emergency/emergency.component';
import { PetsComponent } from './dialogs-validate-documents/pets/pets.component';
import { MsdsComponent } from './dialogs-validate-documents/msds/msds.component';
import { RegisterCollaboratorComponent } from './dialogs/register-collaborator/register-collaborator.component';
import { UpdateSwornDeclarationComponent } from './dialogs/sworn-declaration/update-sworn-declaration/update-sworn-declaration.component';
import { VisorPdfComponent } from 'src/app/shared/components/visor-pdf/visor-pdf.component';
//#endregion

//#region Models
import { Collaborator, UploadFile } from '../../models/register-collaborator';
import { User } from 'src/app/auth/models/user.model';
// import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { SCTR, SwornDeclaration, SVL } from '../../models/dashboard.model';
import {
  ExitsDocumentValidateModel,
  ValidateDocumentsModel,
} from '../../models/validate-documents.model';
import { AuthService } from 'src/app/auth/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Provider } from 'src/app/auth/models/provider.model';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CertificatesValidateDocumentsService } from '../../services/validate-documents/certificates-validate-documents.service';
import { ChecklistValidateDocumentsService } from '../../services/validate-documents/checklist-validate-documents.service';
import { EquipmentsValidateDocumentsService } from '../../services/validate-documents/equipments-validate-documents.service';
import { CertificatesComponent } from './dialogs-validate-documents/certificates/certificates.component';
import { ChecklistComponent } from './dialogs-validate-documents/checklist/checklist.component';
import { EquipmentsComponent } from './dialogs-validate-documents/equipments/equipments.component';
//#endregion

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  mediaSub!: Subscription;
  deviceXs: boolean = false;
  deviceSm: boolean = false;

  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  searchSCTR = new FormControl('');
  searchSeguroVL = new FormControl('');

  searchVL = new FormControl('');
  searchSwormDeclaration = new FormControl('');
  searchCollaborator = new FormControl('');

  profileCollaborator$!: Observable<Collaborator[]>;

  collaboratorForm!: FormGroup;

  sctr$!: Observable<SCTR[]>;
  seguroVL$!: Observable<SVL[]>;
  swornDeclaration$!: Observable<SwornDeclaration[]>;

  user: User | null | undefined = null;
  provider!: Provider;

  validateDocument$!: Observable<{
    // covidDocuments: ExitsDocumentValidateModel[];
    ipercDocuments: ExitsDocumentValidateModel[];
    atsDocuments: ExitsDocumentValidateModel[];
    emergencyDocuments: ExitsDocumentValidateModel[];
    petsDocuments: ExitsDocumentValidateModel[];
    certificatesDocuments: ExitsDocumentValidateModel[];
    msdsDocuments: ExitsDocumentValidateModel[];
    checklistDocuments: ExitsDocumentValidateModel[];
    equipmentsDocuments: ExitsDocumentValidateModel[];
  }>;

  info: string = '🚧 Documentación incompleta';

  subscriptions = new Subscription();
  isMobile!: boolean;

  constructor(
    // public mediaObserver: MediaObserver,
    private dialog: MatDialog,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private swornDeclarationService: SwornDeclarationService,
    private commonDocumentsValidateService: CommonDocumentsValidateService,
    private covidValidateDocumentsService: CovidValidateDocumentsService,
    private ipercValidateDocumentsService: IpercValidateDocumentsService,
    private atsValidateDocumentsService: AtsValidateDocumentsService,
    private emergencyValidateDocumentsService: EmergencyValidateDocumentsService,
    private petsValidateDocumentsService: PetsValidateDocumentsService,
    private certificatesValidateDocumentsService: CertificatesValidateDocumentsService,
    private msdsValidateDocumentsService: MsdsValidateDocumentsService,
    private checklistValidateDocumentsService: ChecklistValidateDocumentsService,
    private equipmentsValidateDocumentsService: EquipmentsValidateDocumentsService,
    private snackbar: MatSnackBar,
    private breakpoint: BreakpointObserver
  ) {}

  ngOnInit(): void {
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

    const fecha = '22/12/2023';
    const fechaSplitted = fecha.split('/');

    this.initValidateDocuments();

    this.authService.user$
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user) return of(null);
          this.user = user;
          return this.dashboardService.getProvider(user.providerId);
        })
      )
      .subscribe((provider) => {
        if (!provider) return;

        this.provider = provider;
      });

    this.sctr$ = combineLatest(
      this.dashboardService.getAllSctrDocuments(),
      this.searchSCTR.valueChanges.pipe(
        debounceTime(300),
        filter((input) => input !== null),
        startWith<any>('')
      )
    ).pipe(
      map(([collaborator, search]) => {
        const searchTerm = search.toLowerCase().trim();
        let preFilterSearch: SCTR[] = [...collaborator];

        preFilterSearch = preFilterSearch.filter((data) => {
          return String(data.code).toLowerCase().includes(searchTerm);
        });

        return preFilterSearch;
      })
    );

    this.profileCollaborator$ = combineLatest(
      this.dashboardService.getAllCollaborators(),
      this.searchCollaborator.valueChanges.pipe(
        debounceTime(300),
        filter((input) => input !== null),
        startWith<any>('')
      )
    ).pipe(
      map(([collaborators, search]) => {
        const searchTerm = search.toLowerCase().trim();
        let preFilterSearch: Collaborator[] = [...collaborators];

        preFilterSearch = preFilterSearch.filter((data) => {
          return String(data.name).toLowerCase().includes(searchTerm);
        });

        if (preFilterSearch.length) {
          preFilterSearch.map((collaborator) => {
            const sctrValidity = collaborator.sctrDate?.toMillis();
            const svlValidity = collaborator.svlDate?.toMillis();
            const swornDeclarationValidity =
              collaborator.swornDeclarationDate?.toMillis();
            const medicalExaminationValidity =
              collaborator.medicalExaminationDate?.toMillis();
            const firstDoseValidity = collaborator.firstDoseDate
              ? collaborator.firstDoseDate.toMillis()
              : null;
            const secondDoseValidity = collaborator.secondDoseDate
              ? collaborator.secondDoseDate.toMillis()
              : null;
            const thirdDoseValidity = collaborator.thirdDoseDate
              ? collaborator.thirdDoseDate.toMillis()
              : null;
            const now = Date.now();

            if (sctrValidity && sctrValidity < now) {
              collaborator.sctrStatus = 'expired';
            }

            if (svlValidity && svlValidity < now) {
              collaborator.svlStatus = 'expired';
            }

            if (swornDeclarationValidity && swornDeclarationValidity < now) {
              collaborator.swornDeclarationStatus = 'expired';
            }

            if (
              medicalExaminationValidity &&
              medicalExaminationValidity < now
            ) {
              collaborator.medicalExaminationStatus = 'expired';
            }

            if (
              !firstDoseValidity ||
              !secondDoseValidity ||
              !thirdDoseValidity
            ) {
              collaborator.doseStatus = 'not-fully-vaccinated';
            }

            if (!collaborator.vaccinationCardFile) {
              collaborator.doseStatus = 'rejected';
            }

            return collaborator;
          });
        }

        return preFilterSearch;
      })
    );

    this.seguroVL$ = combineLatest(
      this.dashboardService.getAllSvlDocuments(),
      this.searchSeguroVL.valueChanges.pipe(
        debounceTime(300),
        filter((input) => input !== null),
        startWith<any>('')
      )
    ).pipe(
      map(([collaborator, search]) => {
        const searchTerm = search.toLowerCase().trim();
        let preFilterSearch: SVL[] = [...collaborator];

        preFilterSearch = preFilterSearch.filter((data) => {
          return String(data.code).toLowerCase().includes(searchTerm);
        });

        return preFilterSearch;
      })
    );

    this.swornDeclaration$ = combineLatest(
      this.swornDeclarationService.getAllSwornDeclarationDocuments(),
      this.searchSwormDeclaration.valueChanges.pipe(
        debounceTime(300),
        filter((input) => input !== null),
        startWith<any>('')
      )
    ).pipe(
      map(([collaborator, search]) => {
        const searchTerm = search.toLowerCase().trim();
        let preFilterSearch: SwornDeclaration[] = [...collaborator];

        preFilterSearch = preFilterSearch.filter((data) => {
          return String(data.code).toLowerCase().includes(searchTerm);
        });

        return preFilterSearch;
      })
    );
  }

  public editCollaborator(element: Collaborator) {
    const a = this.dialog.open(EditCollaboratorComponent, {
      width: '90vw',
      maxWidth: '500px',
      data: element,
    });
  }

  public addCollaborator() {
    const a = this.dialog.open(RegisterCollaboratorComponent, {
      width: '100vw',
      maxWidth: 600,
      panelClass: 'border-dialog',
    });
  }

  public deleteCollaborator(element: Collaborator) {
    const a = this.dialog.open(DeleteCollaboratorComponent, {
      width: '90vw',
      maxWidth: '500px',
      disableClose: true,
      data: element,
      panelClass: 'border-dialog',
    });
  }

  public addSegVidaLey() {
    const a = this.dialog.open(AddSegVidaLeyDialogComponent, {
      width: '100vw',
      maxWidth: 600,
      panelClass: 'border-dialog',
    });
  }

  public editSegVidaLey(data: SVL) {
    const a = this.dialog.open(EditSegVidaLeyDialogComponent, {
      width: '100vw',
      maxWidth: 600,
      data: data,
      panelClass: 'border-dialog',
    });
  }

  public deleteSVL(element: SVL) {
    const a = this.dialog.open(DeleteSegVidaLeyDialogComponent, {
      width: '90vw',
      maxWidth: '500px',
      data: element,
    });
  }

  addSCTR(): void {
    this.dialog.open(AddSctrDialogComponent, {
      maxWidth: 600,
      width: '100vw',
      panelClass: 'border-dialog',
    });
  }

  editSCTR(item: SCTR): void {
    this.dialog.open(EditSctrDialogComponent, {
      maxWidth: 600,
      width: '100vw',
      data: item,
      panelClass: 'border-dialog',
    });
  }

  deleteSCTR(item: SCTR): void {
    this.dialog.open(DeleteSctrDialogComponent, {
      maxWidth: 500,
      width: '100vw',
      data: item,
      panelClass: 'border-dialog',
    });
  }

  openVizorPdf(file: UploadFile) {
    if (!file) return;

    this.dialog.open(VisorPdfComponent, {
      width: '100%',
      data: file,
      panelClass: 'border-dialog',
    });
  }

  addSwornDeclaration(): void {
    this.dialog.open(AddSwornDeclarationComponent, {
      maxWidth: 600,
      width: '100vw',
      panelClass: 'border-dialog',
    });
  }

  updateSwornDeclaration(element: SwornDeclaration): void {
    this.dialog.open(UpdateSwornDeclarationComponent, {
      maxWidth: 600,
      width: '100vw',
      panelClass: 'border-dialog',
      data: element,
    });
  }

  deleteSwornDeclaration(element: SwornDeclaration) {
    this.dialog.open(DeleteSwornDeclarationComponent, {
      maxWidth: 600,
      width: '100vw',
      panelClass: 'border-dialog',
      data: element,
    });
  }

  openModalValidateDocuments(value: string): void {
    switch (value) {
      case 'iperc':
        this.dialog.open(IpercComponent, {
          maxWidth: 600,
          width: '100vw',
          panelClass: 'border-dialog',
        });
        break;
      case 'ats':
        this.dialog.open(AtsComponent, {
          maxWidth: 600,
          width: '100vw',
          panelClass: 'border-dialog',
        });
        break;
      case 'emergency':
        this.dialog.open(EmergencyComponent, {
          maxWidth: 600,
          width: '100vw',
          panelClass: 'border-dialog',
        });
        break;
      case 'pets':
        this.dialog.open(PetsComponent, {
          maxWidth: 600,
          width: '100vw',
          panelClass: 'border-dialog',
        });
        break;
      case 'certificates':
        this.dialog.open(CertificatesComponent, {
          maxWidth: 600,
          width: '100vw',
          panelClass: 'border-dialog',
        });
        break;
      case 'checklist':
        this.dialog.open(ChecklistComponent, {
          maxWidth: 600,
          width: '100vw',
          panelClass: 'border-dialog',
        });
        break;
      case 'msds':
        this.dialog.open(MsdsComponent, {
          maxWidth: 600,
          width: '100vw',
          panelClass: 'border-dialog',
        });
        break;
      case 'equipments':
        this.dialog.open(EquipmentsComponent, {
          maxWidth: 600,
          width: '100vw',
          panelClass: 'border-dialog',
        });
        break;
    }
  }

  initValidateDocuments() {
    this.subscriptions.add(
      this.covidValidateDocumentsService.getUser().subscribe((user) => {
        this.user = user;
        this.validateDocument$ = combineLatest([
          this.ipercValidateDocumentsService
            .getAllValidateDocumentsIpercDesc()
            .pipe(
              map((data) => {
                return {
                  ipercDocuments: data,
                };
              }),
              map((docs: ValidateDocumentsModel | any) => {
                const val = [];
                for (let [
                  index,
                  ipercDocuments,
                ] of docs.ipercDocuments.entries()) {
                  val.push(
                    JSON.stringify({
                      status: ipercDocuments.status,
                      validityDate:
                        this.commonDocumentsValidateService.validityDate(
                          ipercDocuments
                        ),
                    })
                  );
                }
                return val;
              }),
              map((value) => {
                if (value.length === 0) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                }
                const existsApprovedDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateFalse
                  );
                });
                const existsPendingDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateFalse
                  );
                });
                const existsApprovedDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateTrue
                  );
                });
                const existsPendingDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateTrue
                  );
                });
                if (existsApprovedDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsApprovedTrue();
                } else if (existsPendingDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsPendingTrue();
                } else if (existsApprovedDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else if (existsPendingDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else {
                  return this.commonDocumentsValidateService.getExistsRejectTrue();
                }
              })
            ), // end pipe IPERC
          this.atsValidateDocumentsService
            .getAllValidateDocumentsAtsDesc()
            .pipe(
              map((data) => {
                return {
                  atsDocuments: data,
                };
              }),
              map((docs: ValidateDocumentsModel | any) => {
                const val = [];
                for (let [index, atsDocuments] of docs.atsDocuments.entries()) {
                  val.push(
                    JSON.stringify({
                      status: atsDocuments.status,
                      validityDate:
                        this.commonDocumentsValidateService.validityDate(
                          atsDocuments
                        ),
                    })
                  );
                }
                return val;
              }),
              map((value) => {
                if (value.length === 0) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                }
                const existsApprovedDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateFalse
                  );
                });
                const existsPendingDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateFalse
                  );
                });
                const existsApprovedDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateTrue
                  );
                });
                const existsPendingDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateTrue
                  );
                });
                if (existsApprovedDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsApprovedTrue();
                } else if (existsPendingDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsPendingTrue();
                } else if (existsApprovedDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else if (existsPendingDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else {
                  return this.commonDocumentsValidateService.getExistsRejectTrue();
                }
              })
            ), // end pipe ATS
          this.emergencyValidateDocumentsService
            .getAllValidateDocumentsEmergencyDesc()
            .pipe(
              map((data) => {
                return {
                  emergencyDocuments: data,
                };
              }),
              map((docs: ValidateDocumentsModel | any) => {
                const val = [];
                for (let [
                  index,
                  emergencyDocuments,
                ] of docs.emergencyDocuments.entries()) {
                  val.push(
                    JSON.stringify({
                      status: emergencyDocuments.status,
                      validityDate:
                        this.commonDocumentsValidateService.validityDate(
                          emergencyDocuments
                        ),
                    })
                  );
                }
                return val;
              }),
              map((value) => {
                if (value.length === 0) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                }
                const existsApprovedDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateFalse
                  );
                });
                const existsPendingDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateFalse
                  );
                });
                const existsApprovedDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateTrue
                  );
                });
                const existsPendingDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateTrue
                  );
                });
                if (existsApprovedDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsApprovedTrue();
                } else if (existsPendingDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsPendingTrue();
                } else if (existsApprovedDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else if (existsPendingDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else {
                  return this.commonDocumentsValidateService.getExistsRejectTrue();
                }
              })
            ), // end pipe Emergency Plan
          this.petsValidateDocumentsService
            .getAllValidateDocumentsPetsDesc()
            .pipe(
              map((data) => {
                return {
                  petsDocuments: data,
                };
              }),
              map((docs: ValidateDocumentsModel | any) => {
                const val = [];
                for (let [
                  index,
                  petsDocuments,
                ] of docs.petsDocuments.entries()) {
                  val.push(
                    JSON.stringify({
                      status: petsDocuments.status,
                      validityDate:
                        this.commonDocumentsValidateService.validityDate(
                          petsDocuments
                        ),
                    })
                  );
                }
                return val;
              }),
              map((value) => {
                if (value.length === 0) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                }
                const existsApprovedDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateFalse
                  );
                });
                const existsPendingDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateFalse
                  );
                });
                const existsApprovedDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateTrue
                  );
                });
                const existsPendingDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateTrue
                  );
                });
                if (existsApprovedDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsApprovedTrue();
                } else if (existsPendingDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsPendingTrue();
                } else if (existsApprovedDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else if (existsPendingDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else {
                  return this.commonDocumentsValidateService.getExistsRejectTrue();
                }
              })
            ), // end pipe PETS
          this.certificatesValidateDocumentsService
            .getAllValidateDocumentsCertificatesDesc()
            .pipe(
              map((data) => {
                return {
                  certificatesDocuments: data,
                };
              }),
              map((docs: ValidateDocumentsModel | any) => {
                const val = [];
                for (let [
                  index,
                  certificatesDocuments,
                ] of docs.certificatesDocuments.entries()) {
                  val.push(
                    JSON.stringify({
                      status: certificatesDocuments.status,
                      validityDate:
                        this.commonDocumentsValidateService.validityDate(
                          certificatesDocuments
                        ),
                    })
                  );
                }
                return val;
              }),
              map((value) => {
                if (value.length === 0) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                }
                const existsApprovedDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateFalse
                  );
                });
                const existsPendingDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateFalse
                  );
                });
                const existsApprovedDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateTrue
                  );
                });
                const existsPendingDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateTrue
                  );
                });
                if (existsApprovedDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsApprovedTrue();
                } else if (existsPendingDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsPendingTrue();
                } else if (existsApprovedDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else if (existsPendingDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else {
                  return this.commonDocumentsValidateService.getExistsRejectTrue();
                }
              })
            ), // end pipe Certificates
          this.msdsValidateDocumentsService
            .getAllValidateDocumentsMsdsDesc()
            .pipe(
              map((data) => {
                return {
                  msdsDocuments: data,
                };
              }),
              map((docs: ValidateDocumentsModel | any) => {
                const val = [];
                for (let [
                  index,
                  msdsDocuments,
                ] of docs.msdsDocuments.entries()) {
                  val.push(
                    JSON.stringify({
                      status: msdsDocuments.status,
                      validityDate:
                        this.commonDocumentsValidateService.validityDate(
                          msdsDocuments
                        ),
                    })
                  );
                }
                return val;
              }),
              map((value) => {
                if (value.length === 0) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                }
                const existsApprovedDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateFalse
                  );
                });
                const existsPendingDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateFalse
                  );
                });
                const existsApprovedDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateTrue
                  );
                });
                const existsPendingDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateTrue
                  );
                });
                if (existsApprovedDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsApprovedTrue();
                } else if (existsPendingDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsPendingTrue();
                } else if (existsApprovedDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else if (existsPendingDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else {
                  return this.commonDocumentsValidateService.getExistsRejectTrue();
                }
              })
            ), // end pipe MSDS
          this.checklistValidateDocumentsService
            .getAllValidateDocumentsChecklistDesc()
            .pipe(
              map((data) => {
                return {
                  checklistDocuments: data,
                };
              }),
              map((docs: ValidateDocumentsModel | any) => {
                const val = [];
                for (let [
                  index,
                  checklistDocuments,
                ] of docs.checklistDocuments.entries()) {
                  val.push(
                    JSON.stringify({
                      status: checklistDocuments.status,
                      validityDate:
                        this.commonDocumentsValidateService.validityDate(
                          checklistDocuments
                        ),
                    })
                  );
                }
                return val;
              }),
              map((value) => {
                if (value.length === 0) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                }
                const existsApprovedDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateFalse
                  );
                });
                const existsPendingDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateFalse
                  );
                });
                const existsApprovedDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateTrue
                  );
                });
                const existsPendingDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateTrue
                  );
                });
                if (existsApprovedDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsApprovedTrue();
                } else if (existsPendingDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsPendingTrue();
                } else if (existsApprovedDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else if (existsPendingDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else {
                  return this.commonDocumentsValidateService.getExistsRejectTrue();
                }
              })
            ), // end pipe Check List
          this.equipmentsValidateDocumentsService
            .getAllValidateDocumentsEquipmentsDesc()
            .pipe(
              map((data) => {
                return {
                  equipmentsDocuments: data,
                };
              }),
              map((docs: ValidateDocumentsModel | any) => {
                const val = [];
                for (let [
                  index,
                  equipmentsDocuments,
                ] of docs.equipmentsDocuments.entries()) {
                  val.push(
                    JSON.stringify({
                      status: equipmentsDocuments.status,
                      validityDate:
                        this.commonDocumentsValidateService.validityDate(
                          equipmentsDocuments
                        ),
                    })
                  );
                }
                return val;
              }),
              map((value) => {
                if (value.length === 0) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                }
                const existsApprovedDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateFalse
                  );
                });
                const existsPendingDateFalse = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateFalse
                  );
                });
                const existsApprovedDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationApprovedDateTrue
                  );
                });
                const existsPendingDateTrue = value.map((vl) => {
                  return (
                    vl ===
                    this.commonDocumentsValidateService.validations
                      .validationPendingDateTrue
                  );
                });
                if (existsApprovedDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsApprovedTrue();
                } else if (existsPendingDateFalse[0]) {
                  return this.commonDocumentsValidateService.getExistsPendingTrue();
                } else if (existsApprovedDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else if (existsPendingDateTrue[0]) {
                  return this.commonDocumentsValidateService.getExistsNotDocuments();
                } else {
                  return this.commonDocumentsValidateService.getExistsRejectTrue();
                }
              })
            ), // end pipe MSDS
        ]).pipe(
          map((data) => {
            return {
              ipercDocuments: data[0],
              atsDocuments: data[1],
              emergencyDocuments: data[2],
              petsDocuments: data[3],
              certificatesDocuments: data[4],
              msdsDocuments: data[5],
              checklistDocuments: data[6],
              equipmentsDocuments: data[7],
            };
          })
        ); // end combineLastest
      }) // end subscribe user
    ); // end subscription
  }

  checkDrives(collId: string, collDni: string): void {
    this.loading.next(true);
    this.subscriptions.add(
      this.dashboardService
        .queryDriveIndSymp(collId, collDni)
        .pipe(take(1))
        .subscribe((batch) => {
          if (batch) {
            batch
              .commit()
              .then(() => {
                this.snackbar.open('🚀 Consulta exitosa', 'Aceptar', {
                  duration: 6000,
                });
                this.loading.next(false);
              })
              .catch((err) => {
                console.log(err);
                this.snackbar.open('❌ Error en consulta', 'Aceptar', {
                  duration: 6000,
                });
                this.loading.next(false);
              });
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.mediaSub.unsubscribe();
  }
}
