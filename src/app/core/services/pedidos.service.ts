import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Pedido } from '../interfaces/pedido';
import { HttpClient } from '@angular/common/http';
import { Usuario } from '../interfaces/usuario';
import { Cliente } from '../interfaces/cliente';

@Injectable({
  providedIn: 'root',
})
export class PedidoService {
  urlBase = environment.servidor;
  http = inject(HttpClient);
  funListarPedido(){
    return this.http.get<Pedido[]>(`${this.urlBase}/pedidos`);
  }
  funListarUnoPedido(id: number){
    return this.http.get<Pedido>(`${this.urlBase}/pedidos/${id}`);
  }
  funGuardarPedido(dato: Pedido){
    return this.http.post(`${this.urlBase}/pedidos`, dato);
  }
  funEditarPedido(dato: Pedido, id: number){
    return this.http.patch(`${this.urlBase}/pedidos/${id}`, dato);
  }
  funEliminarPedido(id: number){
    return this.http.delete(`${this.urlBase}/pedidos/${id}`);
  }
  funListarUsuario(){
    return this.http.get<Usuario[]>(`${this.urlBase}/usuarios`);
  }
  funListarCliente(){
    return this.http.get<Cliente[]>(`${this.urlBase}/clientes`);
  }
  funListarSucursal(){
    return this.http.get<any[]>(`${this.urlBase}/sucursales`);
  }
}
