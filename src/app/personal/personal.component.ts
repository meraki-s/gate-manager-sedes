import { Component, OnInit } from '@angular/core';
import { Menu } from '../shared/models/menu.interface';

@Component({
  selector: 'app-personal',
  templateUrl: './personal.component.html',
  styleUrls: ['./personal.component.scss'],
})
export class PersonalComponent implements OnInit {
  menu: Menu[] = [];
  constructor() {}

  ngOnInit(): void {
    this.menu = [
      {
        routerLink: '/personal/access-control',
        nameNavigate: 'Control de acceso',
        icon: 'assignment_ind',
      },
      {
        routerLink: '/personal/monitor',
        nameNavigate: 'Monitor de planta',
        icon: 'monitor_heart',
      },
    ];
  }
}
