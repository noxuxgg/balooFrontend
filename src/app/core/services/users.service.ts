import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  urlBase = "https://laravue2.blumbit.net/back/public/api";
  http = inject(HttpClient);

  funListar(){
    return this.http.get(`${this.urlBase}/usuarios`);
  }
}
