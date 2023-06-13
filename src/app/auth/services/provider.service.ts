import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Provider } from '../models/provider.model';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  provider$: Observable<Provider> = of();
  private createUserUrl: string = environment.registerUserProviderURL;

  constructor(
    public afAuth: AngularFireAuth,
    public afs: AngularFirestore,
    private http: HttpClient
  ) {}

  createUserProvider(user: User, provider: Provider, imageURL: string) {
    const data = {
      user,
      provider,
      imageURL,
    };
    return this.http.post(this.createUserUrl, data);
  }

  checkRuc(
    ruc: number
  ): Observable<firebase.default.firestore.QuerySnapshot<Provider>> {
    return this.afs
      .collection<Provider>('/db/ferreyros/providers', (ref) =>
        ref.where('companyRuc', '==', ruc)
      )
      .get();
  }
}
