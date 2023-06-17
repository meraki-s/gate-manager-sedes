import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription, of } from 'rxjs';
import { filter, map, shareReplay, take } from 'rxjs/operators';
import { Menu } from '../../models/menu.interface';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from 'src/app/auth/services/auth.service';
import { User } from 'src/app/auth/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { UpdateReadyComponent } from '../update-ready/update-ready.component';
import { FormControl } from '@angular/forms';
import { LocationService } from 'src/app/admin/services/location.service';
import { Location } from 'src/app/admin/models/location.model';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit, OnDestroy {
  @Input() menu: Menu[] = [];
  selectItem: string | undefined;
  selectItemDefault: string | undefined;

  locations$: Observable<Location[]> = of([]);
  locationSelectorControl = new FormControl();

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );
  subscriptions = new Subscription();
  user: User | null | undefined = null;
  version!: string;
  pathURL: string = '';

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    public authService: AuthService,
    private loactionService: LocationService,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {
    this.authService
      .getGeneralConfigDoc()
      .pipe(
        take(1),
        map((conf) => {
          if (conf?.version !== this.authService.version) {
            this.dialog.open(UpdateReadyComponent, {
              maxWidth: '350px',
              data: conf?.version,
              disableClose: true,
            });
          }
          return conf!.version;
        })
      )
      .subscribe();

    this.version = this.authService.version;

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.pathURL = event.urlAfterRedirects;
        }
      });
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        this.user = user;
        this.locationSelectorControl.setValue(user?.currentLocation);
      })
    );

    this.setNavigationName();

    this.locations$ = this.loactionService.getLocations();

    this.subscriptions.add(
      this.locationSelectorControl.valueChanges.subscribe((value) => {
        if (value) {
          this.authService.setCurrentLocation(this.user!.uid, value);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  setNavigationName(): void {
    const exist: Menu[] = this.menu.filter((menu) => {
      return menu.routerLink === this.pathURL;
    });

    if (exist.length) {
      this.selectItem = exist[0].nameNavigate;
    }
  }

  selectMenu(menu: Menu): void {
    this.selectItem = menu.nameNavigate;
  }

  logout(): void {
    this.authService.logout().then(() => {
      this.router.navigate(['/']);
    });
  }
}
