import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  Observable,
  Subscription,
  combineLatest,
  debounceTime,
  map,
  of,
  startWith,
} from 'rxjs';
import { LocationService } from '../../services/location.service';
import { Location } from '../../models/location.model';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CreateLocationComponent } from './dialogs/create-location/create-location.component';
import { MatTableDataSource } from '@angular/material/table';
import { User } from 'src/app/auth/models/user.model';

@Component({
  selector: 'app-locations',
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.scss'],
})
export class LocationsComponent implements OnInit, OnDestroy {
  locations$: Observable<(Location & { id: string })[]> = of([]);

  locationFilterControl = new FormControl();

  usersDataSource = new MatTableDataSource<User>();
  usersDisplayedColumns: string[] = [
    'name',
    'email',
    'dni',
    // 'companyName',
    // 'companyRuc',
    'role',
    'jobTitle',
    'phone',
    'status',
    'actions',
  ];

  subscriptions = new Subscription();
  isMobile = false;

  constructor(
    private locationService: LocationService,
    private breakpoint: BreakpointObserver,
    private dialog: MatDialog
  ) {
    this.locations$ = combineLatest(
      this.locationService.getLocations(),
      this.locationFilterControl.valueChanges.pipe(
        startWith(''),
        debounceTime(200)
      )
    ).pipe(
      map(([list, filter]) => {
        const filteredList = list.filter((loc) =>
          loc.name.toLowerCase().includes(filter.toLowerCase())
        );

        return filteredList;
      })
    );
  }

  ngOnInit(): void {
    // check if app is runing on mobile device adn prortrait orientation
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
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  createLocation(): void {
    this.subscriptions.add(
      this.dialog
        .open(CreateLocationComponent)
        .afterClosed()
        .subscribe((res) => {
          console.log(res);
        })
    );
  }

  editLocation(location: Location): void {
    //
  }

  // sortData(sort: Sort) {
  //   const data = this.users.slice();

  //   if (!sort.active || sort.direction === '') {
  //     this.usersDataSource.data = data;

  //     return;
  //   }

  //   this.usersDataSource.data = data.sort((a: any, b: any) => {
  //     const isAsc = sort.direction === 'asc';

  //     switch (sort.active) {
  //       case 'user':
  //         return compare(a.createdBy.name, b.createdBy.name, isAsc);
  //       default:
  //         return 0;
  //     }
  //   });
  // }
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
