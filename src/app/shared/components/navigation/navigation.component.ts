import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators';
import { Menu } from '../../models/menu.interface';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/services/auth.service';
import { User } from 'src/app/auth/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { UpdateReadyComponent } from '../update-ready/update-ready.component';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit, OnDestroy {
  @Input() menu: Menu[] = [];
  selectItem: string | undefined;
  selectItemDefault: string | undefined;

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );
  subscriptions = new Subscription();
  user: User | null | undefined = null;
  version!: string;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    public authService: AuthService,
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

    encapsulation: ViewEncapsulation.None;
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.user$.subscribe((user) => {
        this.user = user;
      })
    );

    this.menu.forEach((val, index, array) => {
      this.selectItemDefault = array[0]['nameNavigate'];
      this.selectItem = this.selectItemDefault;
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
