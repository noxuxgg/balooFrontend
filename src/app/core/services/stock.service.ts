import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly urlBase = environment.urlBase;
  private http = inject(HttpClient);

  funListar() {
    return this.http.get<any[]>(`${this.urlBase}/stock`);
  }

  funGuardar(dato: any) {
    return this.http.post(`${this.urlBase}/stock`, dato);
  }

  actualizarUnidades(payload: { productoId: number; sucursalId: number; cantidad: number }) {
    return this.http.patch(`${this.urlBase}/stock/actualizar-unidades`, payload);
  }
}