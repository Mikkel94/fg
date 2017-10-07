import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { ApiService } from 'app/services/api.service';
import { IResponse, IPhoto, IFilters, ILoginRequest } from 'app/model';
import { DELTA } from 'app/config';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/skip';

@Injectable()
export class StoreService {
  // The state of the application
  private _photos$ = new BehaviorSubject<IResponse<IPhoto>>(null);
  private _filters$ = new Subject<IFilters>();
  private _loginModal$ = new BehaviorSubject<ILoginRequest>(null);
  private _refreshToken$ = new Subject<any>();
  private _photoShoppingCart$ = new BehaviorSubject<IPhoto[]>([]);
  public photoRouteActive$ = new Subject<boolean>();
  public photoModal$ = new BehaviorSubject<IPhoto>(null);

  // TODO
  private returnUrl;

  constructor(private api: ApiService, private router: Router) {
    this._filters$.subscribe(f => {
      api.getHomePagePhotos(f).subscribe(pr => this.storePhotos(pr));
    });

    this._refreshToken$.debounceTime(1000).subscribe(t => {
      api.refreshToken(t).subscribe(new_token => this.storeToken(new_token));
    });

    // get photos that are in localStorage and add to photoShoppingCart
    this._photoShoppingCart$.next(JSON.parse(localStorage.getItem('photoShoppingCart')));
    this._photoShoppingCart$.skip(1).subscribe(c => localStorage.setItem('photoShoppingCart', JSON.stringify(c)));
  }

  // Actions that can be dispatched (Must end with Action)
  setFiltersAction(filters: IFilters) {
    this._filters$.next(filters);
  }

  getMorePhotosAction(): IFilters {
    if (this._photos$.getValue() && this._photos$.getValue().next) {
      const filters = { page: this._photos$.getValue().next.split('?page=')[1] };
      if (filters) {
        this.setFiltersAction(filters);
        return filters;
      }
      return null;
    }
  }

  getSplashPhotoAction(): Observable<IPhoto> {
    return this.api.getSplashPhoto();
  }

  addPhotoToCartAction(photo: IPhoto): void {
    const cart = this.getPhotoShoppingCartValue();
    photo.addedToCart = true;
    if (cart.find(p => p.id === photo.id)) {
      return;
    }
    cart.push(photo);
    this._photoShoppingCart$.next(cart);
  }

  removePhotoFromCartAction(photo: IPhoto): void {
    photo.addedToCart = false;
    const cart = this.getPhotoShoppingCartValue();
    cart.splice(cart.indexOf(photo), 1);
    this._photoShoppingCart$.next(cart);
  }

  showLoginModalAction(returnUrl?) {
    this._loginModal$.next({ username: '', password: '' });
    this.returnUrl = returnUrl;
  }

  loginAction(data: ILoginRequest) {
    this.api.login(data).subscribe(t => {
      this.storeToken(t, data.username);
      console.log(this.returnUrl);
      if (this.returnUrl) {
        this.router.navigateByUrl(this.returnUrl);
      }
    });
  }

  logoutAction() {
    localStorage.removeItem('csrf_token');
    localStorage.removeItem('username');
  }

  getUsernameAction() {
    return localStorage.getItem('username');
  }

  refreshTokenAction() {
    this._refreshToken$.next(localStorage.getItem('csrf_token'));
    console.log('Token refreshed');
  }

  postPhotoAction(data) {
    const formData = new FormData();
    for (const key of Object.keys(data)) {
      formData.append(key, data[key]);
    }
    return this.api.postPhoto(formData);
  }

  // getters for observables of the datastreams
  get filters$() {
    return this._filters$.asObservable();
  }
  get photos$() {
    return this._photos$.asObservable();
  }

  get loginModal$(): Observable<ILoginRequest> {
    return this._loginModal$.asObservable();
  }

  get photoShoppingCart$(): Observable<IPhoto[]> {
    return this._photoShoppingCart$.asObservable();
  }

  getPhotoShoppingCartValue(): IPhoto[] {
    return this._photoShoppingCart$.getValue() || [];
  }

  // Private methods
  private storePhotos(photos: IResponse<IPhoto>) {
    const r = photos;
    if (this._photos$.getValue()) {
      // We already have photos, lets add the new photos to our list
      const oldPhotoResultList = this._photos$.getValue().results;
      r.results = oldPhotoResultList.concat(photos.results);
    }
    this._photos$.next(r);
  }

  private storeToken(t, username?) {
    localStorage.setItem('csrf_token', t.token);
    if (username) {
      localStorage.setItem('username', username);
    }
  }
}
