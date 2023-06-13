import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { historyEntry } from 'src/app/providers/models/historyEntry.model';
import { AccessReportService } from '../../services/access-report.service';

import * as XLSX from 'xlsx';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';

@Component({
  selector: 'app-access-report',
  templateUrl: './access-report.component.html',
  styleUrls: ['./access-report.component.scss'],
})
export class AccessReportComponent implements OnInit {
  //#region controllers
  dateForm!: FormGroup;
  dniControl = new FormControl();
  rucControl = new FormControl();
  //#endregion

  //#region observables
  access$!: Observable<historyEntry[]>;
  //#endregion

  //#region table variables
  accessDataSource = new MatTableDataSource<historyEntry>();
  accessDisplayedColumns: string[] = [
    'name',
    'dni',
    'companyName',
    'companyRuc',
    'date',
    'entryTime',
    'departureTime',
    'status',
  ];

  @ViewChild(MatSort, { static: false }) set sortContent(sort: MatSort) {
    this.accessDataSource.sort = sort;
  }
  @ViewChild('accessPaginator', { static: false }) set content(
    paginator: MatPaginator
  ) {
    this.accessDataSource.paginator = paginator;
  }
  //#endregion

  //#region other variables
  access: historyEntry[] = [];

  subscriptions = new Subscription();
  isMobile!: boolean;
  //#endregion
  constructor(
    private accessService: AccessReportService,
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

    const view = this.getCurrentMonthOfViewDate();

    const beginDate = view.from;
    const endDate = new Date();
    endDate.setHours(23, 59, 59);

    this.dateForm = new FormGroup({
      start: new FormControl(beginDate),
      end: new FormControl(endDate),
    });

    this.access$ = combineLatest(
      this.dateForm.valueChanges.pipe(
        startWith({ start: beginDate, end: endDate }),
        filter((time) => {
          return time.start && time.end;
        }),
        switchMap((time: { start: Date; end: Date }) => {
          time.end.setHours(23, 59, 59);
          return this.accessService.getAccessHistory(time.start, time.end);
        }),
        catchError((err) => {
          console.log(err);
          return [];
        })
      ),
      this.rucControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.dniControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      )
    ).pipe(
      map(([access, ruc, dni]) => {
        let filteredAccess = [...access];

        filteredAccess = filteredAccess.filter((access) => {
          if (!ruc) return true;
          return String(access.companyRuc).includes(ruc);
        });

        filteredAccess = filteredAccess.filter((access) => {
          if (!dni) return true;
          const dniParsed =
            typeof access.dni === 'number' ? String(access.dni) : access.dni;

          return dniParsed.includes(dni);
        });

        this.access = filteredAccess;
        this.accessDataSource.data = filteredAccess;

        return filteredAccess;
      })
    );
  }

  downloadXlsx(access: historyEntry[]): void {
    let table_xlsx: any[] = [];

    let headersXlsx = [
      'Nombre',
      'DNI',
      'Empresa',
      'RUC',
      'Fecha',
      'Hora ingreso',
      'Hora salida',
      'Estado',
    ];

    table_xlsx.push(headersXlsx);

    access.forEach((access) => {
      let temp1 = [];

      temp1 = [
        access.name ? access.name + ' ' + access.lastname : '---',
        access.dni ? String(access.dni) : '---',
        access.companyName ? access.companyName : '---',
        access.companyRuc ? String(access.companyRuc) : '---',
        access.entryAt
          ? new Date(access.entryAt.toMillis()).toLocaleDateString()
          : new Date(access.departureAt!.toMillis()).toLocaleDateString(),
        access.entryAt
          ? new Date(access.entryAt.toMillis()).toLocaleTimeString()
          : '---',
        access.departureAt
          ? new Date(access.departureAt.toMillis()).toLocaleTimeString()
          : '---',
        access.status ? access.status : '---',
      ];

      table_xlsx.push(temp1);
    });

    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Acceso');

    /* save to file */
    const name = 'acceso_gate_manager_' + new Date() + '.xlsx';
    XLSX.writeFile(wb, name);
  }

  getCurrentMonthOfViewDate(): { from: Date; to: Date } {
    const date = new Date();
    const fromMonth = date.getMonth();
    const fromYear = date.getFullYear();

    const actualFromDate = new Date(fromYear, fromMonth, 1);

    const toMonth = (fromMonth + 1) % 12;
    let toYear = fromYear;

    if (fromMonth + 1 >= 12) {
      toYear++;
    }

    const toDate = new Date(toYear, toMonth, 1);

    return { from: actualFromDate, to: toDate };
  }

  sortData(sort: Sort) {
    const data = this.access.slice();

    if (!sort.active || sort.direction === '') {
      this.accessDataSource.data = data;

      return;
    }

    this.accessDataSource.data = data.sort((a: any, b: any) => {
      const isAsc = sort.direction === 'asc';

      switch (sort.active) {
        case 'user':
          return compare(a.createdBy.name, b.createdBy.name, isAsc);
        default:
          return 0;
      }
    });
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
