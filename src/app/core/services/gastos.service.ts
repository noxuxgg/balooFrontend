import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Gasto } from '../interfaces/gasto';

@Injectable({
  providedIn: 'root',
})
export class GastosService {
  private readonly urlBase = environment.urlBase;
  http = inject(HttpClient);

  funListar(){
    return this.http.get(`${this.urlBase}/gastos`);
  }

  funListarUno(id: number){
    return this.http.get(`${this.urlBase}/gastos/${id}`);
  }

  funGuardar(dato: Gasto){
    return this.http.post(`${this.urlBase}/gastos`, dato);
  }

  funEditar(dato: Gasto, id: number){
    return this.http.patch(`${this.urlBase}/gastos/${id}`, dato);
  }

  funEliminar(id: number){ 
    return this.http.delete(`${this.urlBase}/gastos/${id}`);
  } 
}
