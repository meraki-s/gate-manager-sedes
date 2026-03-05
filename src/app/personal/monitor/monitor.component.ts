import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { combineLatest, Observable, Subscription } from 'rxjs';
import {
  startWith,
  debounceTime,
  distinctUntilChanged,
  map,
} from 'rxjs/operators';
import { MonitorService } from 'src/app/admin/services/monitor.service';
import { Provider } from 'src/app/auth/models/provider.model';
import { User } from 'src/app/auth/models/user.model';
import { AuthService } from 'src/app/auth/services/auth.service';
import { Collaborator } from 'src/app/providers/models/register-collaborator';
import { RegisterVisit } from 'src/app/providers/models/register-visit.model';
import {
  ForceExitDialogComponent,
  ForceExitDialogData,
} from '../../admin/pages/monitor/dialogs/force-exit-dialog/force-exit-dialog.component';

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
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    // Get current user for admin name
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        if (user) {
          this.currentUser = user;
        }
      }),
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
        }),
    );

    this.providers$ = combineLatest(
      this.monitorService.getAllProviderInsidePlant(),
      this.rucControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
      ),
    ).pipe(
      map(([providers, ruc]) => {
        let filteredProviders = [...providers];

        filteredProviders = filteredProviders.filter((provider) => {
          if (!ruc) return true;
          return provider.companyRuc.toString().includes(ruc);
        });

        this.totalProviders = filteredProviders.length;

        return filteredProviders;
      }),
    );

    this.collaborators$ = combineLatest(
      this.monitorService.getAllCollaboratorsInPlant(),
      this.dniControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
      ),
    ).pipe(
      map(([collaborators, dni]) => {
        let filteredCollaborators = [...collaborators];

        filteredCollaborators = filteredCollaborators.filter((collaborator) => {
          if (!dni) return true;
          return collaborator.dni.toString().includes(dni);
        });

        return filteredCollaborators;
      }),
    );

    this.visits$ = combineLatest(
      this.monitorService.getAllVisitsInPlant(),
      this.dniControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
      ),
    ).pipe(
      map(([visits, dni]) => {
        let filteredVisits = [...visits];

        filteredVisits = filteredVisits.filter((visit) => {
          if (!dni) return true;
          return visit.dni.toString().includes(dni);
        });

        return filteredVisits;
      }),
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
      }),
    );
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

    console.log(this.currentUser.role);
    
    // Check if user is Administrator
    if (this.currentUser.role !== 'Vigilant') {
      this.snackBar.open(
        'Solo los administradores pueden forzar salidas',
        'Cerrar',
        {
          duration: 3000,
        },
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
              adminName,
            )
            .subscribe({
              next: () => {
                this.snackBar.open(
                  'Colaborador retirado exitosamente',
                  'Cerrar',
                  {
                    duration: 3000,
                  },
                );
              },
              error: (error) => {
                console.error('Error al forzar salida de colaborador:', error);
                this.snackBar.open('Error al retirar colaborador', 'Cerrar', {
                  duration: 3000,
                });
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
                  },
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
