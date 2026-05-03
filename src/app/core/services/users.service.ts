import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';

export interface Usuario{
  nombreUsuario: string,
  contrasenia: string
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  urlBase = environment.servidor;
  http = inject(HttpClient);

  funListar(){
    return this.http.get(`${this.urlBase}/usuarios`);
  }

  funGuardar(dato: Usuario){
    return this.http.post(`${this.urlBase}/usuarios`, dato);
  }

  funEditar(dato: Usuario, id: string){
    return this.http.patch(`${this.urlBase}/usuarios/${id}`, dato)
  }
}
