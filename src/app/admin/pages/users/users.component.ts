import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { User } from 'src/app/auth/models/user.model';
import { UsersService } from '../../services/users.service';

import * as XLSX from 'xlsx';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  take,
} from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CreateUserComponent } from './dialogs/create-user/create-user.component';
import { DeleteUserComponent } from './dialogs/delete-user/delete-user.component';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  //#region controllers
  dniControl = new FormControl();
  rucControl = new FormControl();
  emailControl = new FormControl();
  roleControl = new FormControl();
  //#endregion

  //#region observables
  users$!: Observable<User[]>;
  //#endregion

  //#region table variables
  usersDataSource = new MatTableDataSource<User>();
  usersDisplayedColumns: string[] = [
    'location',
    'name',
    'email',
    'dni',
    'companyName',
    'companyRuc',
    'role',
    'jobTitle',
    'phone',
    'status',
    'actions',
  ];

  @ViewChild(MatSort, { static: false }) set sortContent(sort: MatSort) {
    this.usersDataSource.sort = sort;
  }
  @ViewChild('usersPaginator', { static: false }) set content(
    paginator: MatPaginator
  ) {
    this.usersDataSource.paginator = paginator;
  }
  //#endregion

  //#region other variables
  users: User[] = [];

  subscriptions = new Subscription();
  isMobile!: boolean;
  //#endregion

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog,
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

    this.users$ = combineLatest(
      this.usersService.getUsers(),
      this.dniControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.rucControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.emailControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.roleControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      )
    ).pipe(
      map(([users, dni, ruc, email, role]) => {
        let filteredUsers = [...users];

        // filter by dni
        filteredUsers = filteredUsers.filter((user) => {
          if (!dni) return true;
          return user.dni.toLowerCase().includes(dni.toLowerCase());
        });

        // filter by euc
        filteredUsers = filteredUsers.filter((user) => {
          if (!ruc) return true;
          return user.companyRuc
            ?.toString()
            .toLowerCase()
            .includes(ruc.toLowerCase());
        });

        // filter by email
        filteredUsers = filteredUsers.filter((user) => {
          if (!email) return true;
          return user.email.toLowerCase().includes(email.toLowerCase());
        });

        // filter by role
        filteredUsers = filteredUsers.filter((user) => {
          if (!role) return true;
          return user.role.toLowerCase().includes(role.toLowerCase());
        });

        this.users = filteredUsers;
        this.usersDataSource.data = filteredUsers;

        return filteredUsers;
      })
    );
  }

  downloadXlsx(users: User[]): void {
    let table_xlsx: any[] = [];

    let headersXlsx = [
      'Nombre',
      'email',
      'DNI',
      'Empresa',
      'RUC',
      'Rol',
      'Cargo',
      'Teléfono',
      'Estado',
    ];

    table_xlsx.push(headersXlsx);

    users.forEach((user) => {
      let temp1 = [];

      temp1 = [
        user.name && user.lastname ? user.name + ' ' + user.lastname : '---',
        user.email ? user.email : '---',
        user.dni ? user.dni : '---',
        user.companyName ? user.companyName : '---',
        user.companyRuc ? user.companyRuc : '---',
        user.role ? user.role : '---',
        user.jobTitle ? user.jobTitle : '---',
        user.phone ? user.phone : '---',
        user.status ? user.status : '---',
      ];

      table_xlsx.push(temp1);
    });

    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(table_xlsx);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

    /* save to file */
    const name = 'usuarios_' + new Date() + '.xlsx';
    XLSX.writeFile(wb, name);
  }

  enableUser(user: User): void {
    this.usersService
      .enableUser(user.uid)
      .pipe(take(1))
      .subscribe((batch) => {
        if (batch) {
          batch
            .commit()
            .then(() => {
              this.snackbar.open('✅ Usuario habilitado', 'Cerrar', {
                duration: 5000,
              });
            })
            .catch((error) => {
              this.snackbar.open('😞 Error al habilitar usuario', 'Cerrar', {
                duration: 5000,
              });
            });
        }
      });
  }

  disableUser(user: User): void {
    this.usersService
      .disableUser(user.uid)
      .pipe(take(1))
      .subscribe((batch) => {
        if (batch) {
          batch
            .commit()
            .then(() => {
              this.snackbar.open('✅ Usuario bloqueado', 'Cerrar', {
                duration: 5000,
              });
            })
            .catch((error) => {
              this.snackbar.open('😞 Error al bloquear usuario', 'Cerrar', {
                duration: 5000,
              });
            });
        }
      });
  }

  createUser(): void {
    this.dialog.open(CreateUserComponent);
  }

  deleteUser(user: User): void {
    this.dialog.open(DeleteUserComponent, {
      data: user,
    });
  }

  sortData(sort: Sort) {
    const data = this.users.slice();

    if (!sort.active || sort.direction === '') {
      this.usersDataSource.data = data;

      return;
    }

    this.usersDataSource.data = data.sort((a: any, b: any) => {
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
