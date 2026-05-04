import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Stock } from '../interfaces/stock'; // Asegúrate de tener esta interfaz

@Injectable({
  providedIn: 'root',
})
export class StockService {
  urlBase = environment.servidor;
  http = inject(HttpClient);

  funListarStock() {
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
}