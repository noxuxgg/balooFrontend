import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Sucursal } from '../interfaces/sucursal';

@Injectable({
  providedIn: 'root',
})
export class SucursalService {
  private readonly urlBase = environment.urlBase;
  http = inject(HttpClient);

  funListar(){
    return this.http.get(`${this.urlBase}/sucursales`);
  }

  funListarUno(id: string){
    return this.http.get(`${this.urlBase}/sucursales/${id}`);
  }

  funGuardar(dato: Sucursal){
    return this.http.post(`${this.urlBase}/sucursales`, dato);
  }

  funEditar(dato: Sucursal, id: string){
    return this.http.patch(`${this.urlBase}/sucursales/${id}`, dato);
  }

  funEliminar(id: string){ 
    return this.http.delete(`${this.urlBase}/sucursales/${id}`);
  } 
}
