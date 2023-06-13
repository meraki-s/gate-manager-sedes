import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { combineLatest, Observable, Subscription } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
} from 'rxjs/operators';
import { Provider } from 'src/app/auth/models/provider.model';
import { Collaborator } from 'src/app/providers/models/register-collaborator';
import { RegisterVisit } from 'src/app/providers/models/register-visit.model';
import { MonitorService } from '../../services/monitor.service';

interface GroupedDataItem {
  companyName: string;
  count: number;
  companyRuc: number;
}
@Component({
  selector: 'app-monitor',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.scss'],
})
export class MonitorComponent implements OnInit {
  //#region Controllers
  rucControl = new FormControl();
  dniControl = new FormControl();
  //#endregion

  //#region Observables
  providers$!: Observable<Provider[]>;
  collaborators$!: Observable<Collaborator[]>;
  visits$!: Observable<RegisterVisit[]>;
  peopleInPlant$!: Observable<(Collaborator & RegisterVisit)[]>;
  //#endregion

  //#region other variables
  firstTime = true;
  totalProviders: number = 0;
  totalPeople: number = 0;
  groupedProviders: GroupedDataItem[] = [];

  subscriptions = new Subscription();
  isMobile!: boolean;
  //#endregion

  constructor(
    private monitorService: MonitorService,
    private router: Router,
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

    this.providers$ = combineLatest(
      this.monitorService.getAllProviderInsidePlant(),
      this.rucControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      )
    ).pipe(
      map(([providers, ruc]) => {
        let filteredProviders: Provider[] = [...providers];

        filteredProviders = filteredProviders.filter((provider) => {
          if (!ruc) return true;
          return provider.companyRuc.toString().includes(ruc);
        });

        this.totalProviders = filteredProviders.length;

        return filteredProviders;
      })
    );

    this.collaborators$ = combineLatest(
      this.monitorService.getAllCollaboratorsInPlant(),
      this.dniControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      )
    ).pipe(
      map(([collaborators, dni]) => {
        let filteredCollaborators: Collaborator[] = [...collaborators];

        filteredCollaborators = filteredCollaborators.filter((collaborator) => {
          if (!dni) return true;
          return collaborator.dni.toString().includes(dni);
        });

        const groupedData: { [key: string]: GroupedDataItem } =
          filteredCollaborators.reduce(
            (acc: { [key: string]: GroupedDataItem }, current) => {
              if (acc[current.companyName]) {
                acc[current.companyName].count++;
              } else {
                acc[current.companyName] = {
                  companyName: current.companyName,
                  count: 1,
                  companyRuc: current.companyRuc,
                };
              }
              return acc;
            },
            {}
          );

        this.groupedProviders = Object.values(groupedData);

        return filteredCollaborators;
      })
    );

    this.visits$ = combineLatest(
      this.monitorService.getAllVisitsInPlant(),
      this.dniControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      )
    ).pipe(
      map(([visits, dni]) => {
        let filteredVisits = [...visits];

        filteredVisits = filteredVisits.filter((visit) => {
          if (!dni) return true;
          return visit.dni.toString().includes(dni);
        });

        return filteredVisits;
      })
    );

    this.peopleInPlant$ = combineLatest(this.collaborators$, this.visits$).pipe(
      map(([collaborators, visits]) => {
        let people = [...collaborators, ...visits] as (Collaborator &
          RegisterVisit)[];
        people = people.sort((a, b) => {
          return a.companyName > b.companyName ? 1 : -1;
        });

        this.totalPeople = people.length;

        return people;
      })
    );
  }

  goToProvider(provider: GroupedDataItem) {
    this.router.navigate([`admin/search`, provider.companyRuc]);
  }
}
