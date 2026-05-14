import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Categoria } from '../interfaces/categoria';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly urlBase = `${environment.urlBase}/categorias`;
  http = inject(HttpClient);

  funListar() { 
    return this.http.get<Categoria[]>(this.urlBase); 
  }

  funGuardar(dato: Categoria) { 
    return this.http.post(this.urlBase, dato); 
  }

  funEditar(dato: Categoria, id: number) { 
    return this.http.patch(`${this.urlBase}/${id}`, dato); 
  }

  funEliminar(id: number) { 
    return this.http.delete(`${this.urlBase}/${id}`); 
  }
}