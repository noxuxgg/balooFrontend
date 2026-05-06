import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Cliente } from '../interfaces/cliente';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  urlBase = environment.servidor;
  http = inject(HttpClient);

  funListar(){
    return this.http.get(`${this.urlBase}/clientes`);
  }

  funListarUno(id: number){
    return this.http.get(`${this.urlBase}/clientes/${id}`);
  }

  funGuardar(dato: Cliente){
    return this.http.post(`${this.urlBase}/clientes`, dato);
  }

  funEditar(dato: Cliente, id: number){
    return this.http.patch(`${this.urlBase}/clientes/${id}`, dato);
  }

  funEliminar(id: number){
    return this.http.delete(`${this.urlBase}/clientes/${id}`);
  }
}
