import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { PagoPedido } from '../interfaces/pago-pedido';
import { Pedido } from '../interfaces/pedido';

@Injectable({
  providedIn: 'root',
})
export class PagosPedidoService {
  urlBase = environment.servidor;
  http = inject(HttpClient);
  funListarPagoPedido(){
    return this.http.get<PagoPedido[]>(`${this.urlBase}/pagos-pedido`);
  }

  funListarUnoPagoPedido(id: number){
    return this.http.get<PagoPedido>(`${this.urlBase}/pagos-pedido/${id}`);
  }

  funGuardarPagoPedido(dato: PagoPedido){
    return this.http.post(`${this.urlBase}/pagos-pedido`, dato);
  }

  funEditarPagoPedido(dato: PagoPedido, id: number){
    return this.http.patch(`${this.urlBase}/pagos-pedido/${id}`, dato);
  }

  funEliminarPagoPedido(id: number){
    return this.http.delete(`${this.urlBase}/pagos-pedido/${id}`);
  }
  funListarPedido(){
    return this.http.get<Pedido[]>(`${this.urlBase}/pedido`);
  }
}
