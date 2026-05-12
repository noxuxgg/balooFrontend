import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Venta } from '../interfaces/venta';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private readonly urlBase = environment.urlBase;
  http = inject(HttpClient);

  funListar() {
    return this.http.get<Venta[]>(`${this.urlBase}/ventas`);
  }

  funGuardar(dato: any) {
    return this.http.post(`${this.urlBase}/ventas`, dato);
  }

  funEditar(dato: any, id: number) {                              //  agregado
    return this.http.patch(`${this.urlBase}/ventas/${id}`, dato);
  }

  funEliminar(id: number) {
    return this.http.delete(`${this.urlBase}/ventas/${id}`);
  }

  funListarProductos() {
    return this.http.get<any[]>(`${this.urlBase}/productos`);
  }

  funListarSucursales() {
    return this.http.get<any[]>(`${this.urlBase}/sucursales`);
  }
}