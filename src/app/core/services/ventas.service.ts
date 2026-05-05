import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Venta } from '../interfaces/venta';

@Injectable({ providedIn: 'root' })
export class VentasService {
  urlBase = environment.servidor;
  http = inject(HttpClient);

  funListar() {
    return this.http.get<Venta[]>(`${this.urlBase}/ventas`);
  }

  funGuardar(dato: Venta) {
    return this.http.post(`${this.urlBase}/ventas`, dato);
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