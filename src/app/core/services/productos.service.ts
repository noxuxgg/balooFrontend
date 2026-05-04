import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Producto } from '../interfaces/producto'; // Asegúrate de exportar ambas de tu archivo de interfaces
import { Categoria } from '../interfaces/categoria';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  urlBase = environment.servidor;
  http = inject(HttpClient);

  funListarProductos() {
    return this.http.get<Producto[]>(`${this.urlBase}/productos`);
  }

  funGuardarProducto(dato: Producto) {
    return this.http.post(`${this.urlBase}/productos`, dato);
  }

  funEditarProducto(dato: Producto, id: number) {
    return this.http.patch(`${this.urlBase}/productos/${id}`, dato);
  }

  funEliminarProducto(id: number) {
    return this.http.delete(`${this.urlBase}/productos/${id}`);
  }

  funListarCategorias() {
    return this.http.get<Categoria[]>(`${this.urlBase}/categorias`);
  }

  funGuardarCategoria(dato: Categoria) {
    return this.http.post(`${this.urlBase}/categorias`, dato);
  }
}