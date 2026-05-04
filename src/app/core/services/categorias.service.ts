import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Categoria } from '../interfaces/categoria';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  urlBase = environment.servidor;
  http = inject(HttpClient);

  funListar() {
    return this.http.get<Categoria[]>(`${this.urlBase}/categorias`);
  }

  funGuardar(dato: Categoria) {
    return this.http.post(`${this.urlBase}/categorias`, dato);
  }

  funEditar(dato: Categoria, id: number) {
    return this.http.patch(`${this.urlBase}/categorias/${id}`, dato);
  }

  funEliminar(id: number) {
    return this.http.delete(`${this.urlBase}/categorias/${id}`);
  }
}