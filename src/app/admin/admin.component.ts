import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../auth/services/auth.service';
import { Menu } from '../shared/models/menu.interface';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  menu: Menu[] = [];

  // version$: Observable<string>;

  constructor(private authService: AuthService, private dialog: MatDialog) {
    // this.authService
    //   .getGeneralConfigDoc()
    //   .pipe(
    //     map((conf) => {
    //       if (conf?.version !== this.authService.version) {
    //         this.dialog.open(UpdateReadyComponent, {
    //           maxWidth: '350px',
    //           data: conf?.version,
    //           disableClose: true,
    //         });
    //       }
    //       return conf!.version;
    //     })
    //   )
    //   .pipe(take(1))
    //   .subscribe();
  }

  ngOnInit(): void {
    this.menu = [
      {
        routerLink: '/admin/search',
        nameNavigate: 'Buscar',
        icon: 'search',
      },
      {
        routerLink: '/admin/monitor',
        nameNavigate: 'Monitor planta',
        icon: 'monitor_heart',
      },
      {
        routerLink: '/admin/access-report',
        nameNavigate: 'Reporte de acceso',
        icon: 'analytics',
      },
      {
        routerLink: '/admin/events-history',
        nameNavigate: 'Historial eventos',
        icon: 'pending_actions',
      },
      {
        routerLink: '/admin/users',
        nameNavigate: 'Usuarios',
        icon: 'manage_accounts',
      },
      // {
      //   routerLink: '/admin/locations',
      //   nameNavigate: 'Sedes',
      //   icon: 'domain',
      // },
      {
        routerLink: '/admin/settings',
        nameNavigate: 'Configuración',
        icon: 'settings',
      },
    ];
  }
}
