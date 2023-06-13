import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { take, map } from 'rxjs/operators';
import { User } from 'src/app/auth/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class Guard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.authService.user$.pipe(
      map((user) => {
        let childComponent = state.url.split('/')[2];
        let routeComponent = state.url.split('/')[1];

        if (!user) {
          this.router.navigate(['/auth']);
          return false;
        }

        switch (routeComponent) {
          case 'personal':
            if (user.role === 'Vigilant') {
              return true;
            } else this.router.navigate(['/auth']);
            return false;
          case 'providers':
            if (user.role === 'Provider') {
              return true;
            } else this.router.navigate(['/auth']);
            return false;
          case 'admin':
            if (user.role === 'Administrator' || user.role === 'Superuser') {
              return true;
            } else this.router.navigate(['/auth']);
            return false;
        }

        switch (childComponent) {
          case 'access-control':
            if (user.role === 'Vigilant') {
              return true;
            } else this.router.navigate(['/auth']);
            return false;
          case 'dashboard':
            if (user.role === 'Provider') {
              return true;
            } else this.router.navigate(['/auth']);
            return false;
        }

        // if(user?.role === 'Provider'){
        //  this.router.navigate(['/dashboard'])

        // }

        return true;
      })
    );
  }
}
