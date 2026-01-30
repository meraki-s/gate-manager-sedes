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

    // let fecha = this.convertirFecha('1-abr-2026');

    // console.log(fecha);

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

  // convertirFecha(fechaString: string) {
  //   // Separa el día, mes y año de la cadena
  //   var partesFecha = fechaString.split('-');

  //   // Obtiene el día, el mes y el año
  //   var dia = parseInt(partesFecha[0], 10);
  //   var mes = partesFecha[1]; // El mes ya está en formato de texto
  //   var año = parseInt(partesFecha[2], 10);

  //   // Mapea el mes a su número correspondiente (0 para enero, 1 para febrero, etc.)
  //   var meses: { [key: string]: number } = {
  //     ene: 0,
  //     feb: 1,
  //     mar: 2,
  //     abr: 3,
  //     may: 4,
  //     jun: 5,
  //     jul: 6,
  //     ago: 7,
  //     sep: 8,
  //     oct: 9,
  //     nov: 10,
  //     dic: 11,
  //   };

  //   // Convierte el mes de texto a número usando el objeto de meses
  //   var numeroMes = meses[mes.substring(0, 3).toLowerCase()]; // Obtener las primeras tres letras del mes

  //   // Construye el objeto de fecha utilizando las partes extraídas
  //   var fecha = new Date(año, numeroMes, dia);

  //   return fecha;
  // }
}
