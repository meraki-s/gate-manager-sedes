import { Component, OnInit } from '@angular/core';
import { Menu } from '../shared/models/menu.interface';

@Component({
  selector: 'app-providers',
  templateUrl: './providers.component.html',
  styleUrls: ['./providers.component.scss'],
})
export class ProvidersComponent implements OnInit {
  menu: Menu[] = [];

  constructor() {}

  ngOnInit(): void {
    this.menu = [
      {
        routerLink: '/providers/dashboard',
        nameNavigate: 'Dashboard proveedor',
        icon: 'supervised_user_circle',
      },
      {
        routerLink: '/providers/register-visit',
        nameNavigate: 'Registrar visita',
        icon: 'how_to_reg',
      },
      {
        routerLink: '/providers/history',
        nameNavigate: 'Historial',
        icon: 'history',
      },
      {
        routerLink: '/providers/profile',
        nameNavigate: 'Perfil',
        icon: 'account_circle',
      },
    ];
  }
}
