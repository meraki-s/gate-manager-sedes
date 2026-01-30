import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { combineLatest, Observable, Subscription } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { EventActivity } from '../../models/eventActivity.model';
import { EventsService } from '../../services/events.service';

import * as XLSX from 'xlsx';

@Component({
  selector: 'app-event-history',
  templateUrl: './event-history.component.html',
  styleUrls: ['./event-history.component.scss'],
})
export class EventHistoryComponent implements OnInit {
  //#region controllers
  dateForm!: FormGroup;
  dniControl = new FormControl();
  rucControl = new FormControl();
  //#endregion

  //#region observables
  eventsActivity$!: Observable<EventActivity[]>;
  //#endregion

  //#region table variables
  eventsDataSource = new MatTableDataSource<EventActivity>();
  eventsDisplayedColumns: string[] = [
    'date',
    'createdBy',
    'collaboratorName',
    'collaboratorDNI',
    'providerName',
    'providerRUC',
    'activity',
    'description',
  ];

  @ViewChild(MatSort, { static: false }) set sortContent(sort: MatSort) {
    this.eventsDataSource.sort = sort;
  }
  @ViewChild('eventsPaginator', { static: false }) set content(
    paginator: MatPaginator
  ) {
    this.eventsDataSource.paginator = paginator;
  }
  //#endregion

  //#region other variables
  events: EventActivity[] = [];

  subscriptions = new Subscription();
  isMobile!: boolean;
  //#endregion

  constructor(
    private eventsService: EventsService,
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

    this.eventsActivity$ = combineLatest(
      this.dateForm.valueChanges.pipe(
        startWith({ start: beginDate, end: endDate }),
        filter((time) => {
          return time.start && time.end;
        }),
        switchMap((time: { start: Date; end: Date }) => {
          time.end.setHours(23, 59, 59);
          return this.eventsService.getEvents(time.start, time.end);
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
      map(([events, ruc, dni]) => {
        let filteredEvents = [...events];

        filteredEvents = filteredEvents.filter((event) => {
          if (!ruc) return true;
          return event.providerRUC === ruc;
        });

        filteredEvents = filteredEvents.filter((event) => {
          if (!dni) return true;
          return event.collaboratorDNI === dni;
        });

        this.events = filteredEvents;
        this.eventsDataSource.data = filteredEvents;

        return filteredEvents;
      })
    );
  }

  downloadXlsx(events: EventActivity[]): void {
    let table_xlsx: any[] = [];

    let headersXlsx = [
      'Fecha',
      'Creado por',
      'Nombre',
      'DNI',
      'Empresa',
      'RUC',
      'Evento',
      'Descripción',
    ];

    table_xlsx.push(headersXlsx);

    events.forEach((event) => {
      let temp1 = [];

      temp1 = [
        event.createdAt ? new Date(event.createdAt.seconds * 1000) : '---',
        event.createdBy ? event.createdBy.displayName : '---',
        event.collaboratorName ? event.collaboratorName : '---',
        event.collaboratorDNI ? event.collaboratorDNI : '---',
        event.providerName ? event.providerName : '---',
        event.providerRUC ? event.providerRUC : '---',
        event.activity ? event.activity : '---',
        event.description ? event.description : '---',
      ];

      table_xlsx.push(temp1);
    });

    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Eventos');

    /* save to file */
    const name = 'eventos_gate_manager_' + new Date() + '.xlsx';
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
    const data = this.events.slice();

    if (!sort.active || sort.direction === '') {
      this.eventsDataSource.data = data;

      return;
    }

    this.eventsDataSource.data = data.sort((a: any, b: any) => {
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
