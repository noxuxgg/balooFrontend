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

  // Reutiliza este para tu método de listar en vez de tener dos repetidos
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

  // CORREGIDO: Ahora usa 'urlBase' y apunta correctamente al endpoint de NestJS
  actualizarUnidades(payload: { productoId: number; sucursalId: number; cantidadModificada: number }) {
    // Asegúrate de usar la sub-ruta correcta de tu API y pasarle el payload completo en el body
    return this.http.patch(`http://localhost:3000/stock/actualizar-unidades`, payload);
  }
}