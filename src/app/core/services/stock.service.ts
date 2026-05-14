import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Stock } from '../interfaces/stock';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly urlBase = environment.urlBase;
  http = inject(HttpClient);

  findAll() {
    return this.http.get<Stock[]>(`${this.urlBase}/stock`);
  }

  funGuardarStock(dato: Stock) {
    return this.http.post(`${this.urlBase}/stock`, dato);
  }

  funEditarStock(dato: Stock, id: number) {
    return this.http.patch(`${this.urlBase}/stock/${id}`, dato);
  }

  funEliminarStock(id: number) {
    return this.http.delete(`${this.urlBase}/stock/${id}`);
  }

  actualizarUnidades(payload: { productoId: number; sucursalId: number; cantidad: number }) {
    return this.http.patch(`http://localhost:3000/stock/actualizar-unidades`, payload);
  }
}