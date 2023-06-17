import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Location } from '../models/location.model';
import { Observable, switchMap, take } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private fs: AngularFirestore
  ) {}

  createLocation(
    locationName: string
  ): Observable<{ ok: boolean; msg: string }> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((fsUser) => {
        const data = {
          location: {
            name: locationName,
            createdBy: fsUser?.displayName,
            user: fsUser
          },
        };

        return this.http.post<{ ok: boolean; msg: string }>(
          environment.createLocationURL,
          data
        );
      })
    );
  }

  getLocations(): Observable<
    (Location & {
      id: string;
    })[]
  > {
    const locationsRef = this.fs.collection<Location>('locations', (ref) =>
      ref.orderBy('createdAt', 'desc')
    );
    return locationsRef.valueChanges({ idField: 'id' });
  }
}
