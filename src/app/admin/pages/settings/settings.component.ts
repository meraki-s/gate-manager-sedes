import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { ProviderService } from 'src/app/providers/services/providers.services';
import { ResponsibleList } from '../../models/setting.model';
import { SettingService } from '../../services/settings.services';

import * as XLSX from 'xlsx';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  panelOpenState = false;

  public entryResponsibleControl: FormControl = new FormControl(
    null,
    Validators.required
  );
  listResponsibleArray: Array<ResponsibleList> = [];

  matcher = new MyErrorStateMatcher();

  subscriptions = new Subscription();

  constructor(
    private snackbar: MatSnackBar,
    private settingService: SettingService,
    private providersService: ProviderService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.settingService.getAllListResponsible().subscribe((resp) => {
        if (resp) {
          this.listResponsibleArray = resp;
        } else {
          this.listResponsibleArray = [];
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  addOrDeleteEntryResponsible(action: string, index?: number | any): void {
    switch (action) {
      case 'add': {
        // Add an item to the local ReasonsForRejection array
        if (this.entryResponsibleControl.valid) {
          const temp: ResponsibleList = {
            id: '',
            name: this.entryResponsibleControl.value.trim(),
            createdBy: '',
          };
          // Searching for repeated values
          const equal = (currentItem: ResponsibleList) =>
            currentItem.name !== temp.name;
          if (this.listResponsibleArray.every(equal)) {
            this.listResponsibleArray.unshift(temp);
          }

          // Reset the text in the form control
          this.entryResponsibleControl.reset();
        }

        break;
      }
      case 'delete': {
        // Check if the item exists in the db
        if (this.listResponsibleArray[index].id) {
          this.loading.next(true);
          const resp = this.settingService.deleteListResponsible(
            this.listResponsibleArray[index].id
          );
          this.subscriptions.add(
            resp.subscribe((batch) => {
              if (batch) {
                batch
                  .commit()
                  .then(() => {
                    this.loading.next(false);
                    this.snackbar.open(
                      '✅ Elemento borrado correctamente',
                      'Aceptar',
                      {
                        duration: 6000,
                      }
                    );
                  })
                  .catch((error: any) => {
                    this.loading.next(false);
                    this.snackbar.open(
                      '🚨 Hubo un error al eliminar!',
                      'Aceptar',
                      {
                        duration: 6000,
                      }
                    );
                  });
              }
            })
          );
        }
        /// Delete an item from the local ReasonsForRejection array
        this.listResponsibleArray.splice(index, 1);
        break;
      }
    }
  }

  saveResponsible(): void {
    try {
      this.settingService
        .responsibleRegister(this.listResponsibleArray)
        .pipe(take(1))
        .subscribe((res) => {
          res
            .commit()
            .then(() => {
              //this.loading.next(false)
              this.snackbar.open('✅ se guardo correctamente!', 'Aceptar', {
                duration: 6000,
              });
              this.loading.next(false);
            })
            .catch((err) => {
              this.snackbar.open('🚨 Hubo un error.', 'Aceptar', {
                duration: 6000,
              });
            });
        });
    } catch (error: any) {
      console.error(error);
    }
  }

  downloadCollaborators(): void {
    this.loading.next(true);
    this.subscriptions.add(
      this.providersService.getAllCollaborators().subscribe((res) => {
        let table_xlsx: any[] = [];

        let headersXlsx = [
          'Empresa',
          'RUC',
          'Nombres',
          'Apellidos',
          'DNI',
          'Cargo',
          'Planta',
          'SCTR estado',
          'SCTR vigencia',
          'SCTR archivo',
          'SVL estado',
          'SVL vigencia',
          'SVL archivo',
          'DJ estado',
          'DJ vigencia',
          'DJ archivo',
          'E.Med. estado',
          'E.Med. vigencia',
          'E.Med. archivo',
          'Ind. estado',
          'Ind. vigencia',
          'F.Sim. estado',
          'F.Sim. vigencia',
          'LOTO estado',
          'LOTO vigencia',
          'Vac estado',
          'Vac1 vigencia',
          'Vac2 vigencia',
          'Vac3 vigencia',
          'Vac archivo',
          'Fecha creación',
          'Creado por',
        ];

        table_xlsx.push(headersXlsx);

        res.forEach((collaborator) => {
          let temp1 = [];

          temp1 = [
            collaborator.companyName ? collaborator.companyName : '---',
            collaborator.companyRuc ? collaborator.companyRuc : '---',
            collaborator.name ? collaborator.name : '---',
            collaborator.lastname ? collaborator.lastname : '---',
            collaborator.dni ? collaborator.dni : '---',
            collaborator.jobTitle ? collaborator.jobTitle : '---',
            collaborator.entryDeparture ? collaborator.entryDeparture : '---',
            collaborator.sctrStatus ? collaborator.sctrStatus : '---',
            collaborator.sctrDate
              ? new Date(collaborator.sctrDate.toMillis())
              : '---',
            collaborator.sctrFile ? collaborator.sctrFile.fileURL : '---',
            collaborator.svlStatus ? collaborator.svlStatus : '---',
            collaborator.svlDate
              ? new Date(collaborator.svlDate.toMillis())
              : '---',
            collaborator.svlFile ? collaborator.svlFile.fileURL : '---',
            collaborator.swornDeclarationStatus
              ? collaborator.swornDeclarationStatus
              : '---',
            collaborator.swornDeclarationDate
              ? new Date(collaborator.swornDeclarationDate.toMillis())
              : '---',
            collaborator.swornDeclarationFile
              ? collaborator.swornDeclarationFile.fileURL
              : '---',
            collaborator.medicalExaminationStatus
              ? collaborator.medicalExaminationStatus
              : '---',
            collaborator.medicalExaminationDate
              ? new Date(collaborator.medicalExaminationDate.toMillis())
              : '---',
            collaborator.medicalExaminationFile
              ? collaborator.medicalExaminationFile.fileURL
              : '---',
            collaborator.inductionStatus ? collaborator.inductionStatus : '---',
            collaborator.inductionDate
              ? new Date(collaborator.inductionDate.toMillis())
              : '---',
            collaborator.symptomatologyStatus
              ? collaborator.symptomatologyStatus
              : '---',
            collaborator.symptomatologyDate
              ? new Date(collaborator.symptomatologyDate.toMillis())
              : '---',
            collaborator.lotoStatus ? collaborator.lotoStatus : '---',
            collaborator.lotoDate
              ? new Date(collaborator.lotoDate.toMillis())
              : '---',
            collaborator.doseStatus ? collaborator.doseStatus : '---',
            collaborator.firstDoseDate
              ? new Date(collaborator.firstDoseDate.toMillis())
              : '---',
            collaborator.secondDoseDate
              ? new Date(collaborator.secondDoseDate.toMillis())
              : '---',
            collaborator.thirdDoseDate
              ? new Date(collaborator.thirdDoseDate.toMillis())
              : '---',
            collaborator.vaccinationCardFile
              ? collaborator.vaccinationCardFile.fileURL
              : '---',
            collaborator.createdAt
              ? new Date(collaborator.createdAt.toMillis())
              : '---',
            collaborator.createdBy ? collaborator.createdBy.displayName : '---',
          ];

          table_xlsx.push(temp1);
        });

        /* generate worksheet */
        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

        /* generate workbook and add the worksheet */
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Acceso');

        /* save to file */
        const name = 'colaboradores_' + new Date() + '.xlsx';
        XLSX.writeFile(wb, name);

        this.loading.next(false);
        this.snackbar.open('✅ se descargo correctamente!', 'Aceptar', {
          duration: 6000,
        });
      })
    );
  }
}
