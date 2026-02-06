import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
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
import { AuthService } from 'src/app/auth/services/auth.service';
import { User } from 'src/app/auth/models/user.model';
import {
  ForceExitDialogComponent,
  ForceExitDialogData,
} from './dialogs/force-exit-dialog/force-exit-dialog.component';

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
  currentUser!: User;
  //#endregion

  constructor(
    private monitorService: MonitorService,
    private router: Router,
    private breakpoint: BreakpointObserver,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Get current user for admin name
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        if (user) {
          this.currentUser = user;
        }
      })
    );

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

  /**
   * Check if a person is a collaborator (vs a visit)
   */
  isCollaborator(person: Collaborator | RegisterVisit): person is Collaborator {
    return 'entryDeparture' in person;
  }

  /**
   * Force exit for a person (collaborator or visit)
   * Opens confirmation dialog and processes the forced exit
   */
  onForceExit(person: Collaborator | RegisterVisit): void {
    if (!this.currentUser) {
      this.snackBar.open('Error: Usuario no autenticado', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    // Check if user is Administrator
    if (this.currentUser.role !== 'Administrator') {
      this.snackBar.open(
        'Solo los administradores pueden forzar salidas',
        'Cerrar',
        {
          duration: 3000,
        }
      );
      return;
    }

    const dialogData: ForceExitDialogData = {
      name: person.name,
      lastname: person.lastname,
      dni: this.isCollaborator(person) ? person.dni : person.dni.toString(),
      companyName: person.companyName,
    };

    const dialogRef = this.dialog.open(ForceExitDialogComponent, {
      width: '500px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        const adminName = `${this.currentUser.name} ${this.currentUser.lastname}`;

        if (this.isCollaborator(person)) {
          // Force exit collaborator
          this.monitorService
            .forceExitCollaborator(
              person.id,
              person.providerId,
              person,
              adminName
            )
            .subscribe({
              next: () => {
                this.snackBar.open(
                  'Colaborador retirado exitosamente',
                  'Cerrar',
                  {
                    duration: 3000,
                  }
                );
              },
              error: (error) => {
                console.error('Error al forzar salida de colaborador:', error);
                this.snackBar.open(
                  'Error al retirar colaborador',
                  'Cerrar',
                  {
                    duration: 3000,
                  }
                );
              },
            });
        } else {
          // Force exit visit
          this.monitorService
            .forceExitVisit(person.id, person.providerId, person, adminName)
            .subscribe({
              next: () => {
                this.snackBar.open(
                  'Visitante retirado exitosamente',
                  'Cerrar',
                  {
                    duration: 3000,
                  }
                );
              },
              error: (error) => {
                console.error('Error al forzar salida de visitante:', error);
                this.snackBar.open('Error al retirar visitante', 'Cerrar', {
                  duration: 3000,
                });
              },
            });
        }
      }
    });
  }
}
