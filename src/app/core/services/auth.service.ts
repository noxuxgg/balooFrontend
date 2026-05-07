import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly urlBase = environment.urlBase;

  http = inject(HttpClient);

  funConectarConBackendLogin(credenciales: any){
    return this.http.post(`${this.urlBase}/auth/login`, credenciales);
  }

  funGetPerfil(){
    return this.http.get(`${this.urlBase}/auth/profile`)
  } 

}
