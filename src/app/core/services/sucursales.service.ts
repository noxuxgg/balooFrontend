import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Sucursales {
  urlBase = environment.servidor;
  http = inject(HttpClient);

  funListar(){
    return this.http.get(`${this.urlBase}/sucursales`);
  }

  funListarUno(id: string){
    return this.http.get(`${this.urlBase}/sucursales/${id}`);
  }

  funGuardar(dato: Sucursales){
    return this.http.post(`${this.urlBase}/sucursales`, dato);
  }

  funEditar(dato: Sucursales, id: string){
    return this.http.patch(`${this.urlBase}/sucursales/${id}`, dato);
  }

  funEliminar(id: string){
    return this.http.delete(`${this.urlBase}/sucursales/${id}`);
  } 
}
