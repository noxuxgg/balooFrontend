import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { DetalleTorta } from '../interfaces/detalle-torta';
import { Pedido } from '../interfaces/pedido';
@Injectable({
  providedIn: 'root',
})
export class DetalleTortaService {
  urlBase = environment.servidor;
  http = inject(HttpClient);
  funListarDetalleTorta(){
    return this.http.get<DetalleTorta[]>(`${this.urlBase}/detalle-torta`);
  }

  funListarUnoDetalleTorta(id: number){
    return this.http.get<DetalleTorta>(`${this.urlBase}/detalle-torta/${id}`);
  }
  
  funGuardarDetalleTorta(dato: DetalleTorta){
    return this.http.post(`${this.urlBase}/detalle-torta`, dato);
  }

  funEditarDetalleTorta(dato: DetalleTorta, id: number){
    return this.http.patch(`${this.urlBase}/detalle-torta/${id}`, dato);
  }

  funEliminarDetalleTorta(id: number){
    return this.http.delete(`${this.urlBase}/detalle-torta/${id}`);
  }
  funListarPedido(){
    return this.http.get<Pedido[]>(`${this.urlBase}/pedido`);
  }
}
