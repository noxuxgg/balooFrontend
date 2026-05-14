import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Producto } from '../interfaces/producto';
import { Categoria } from '../interfaces/categoria';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly urlBase = `${environment.urlBase}/productos`;
  http = inject(HttpClient);

  funListar() { 
    return this.http.get<Producto[]>(this.urlBase); 
  }

  funGuardar(dato: Producto) { 
    return this.http.post(this.urlBase, dato); 
  }
  
  funEditar(dato: Producto, id: number) { 
    return this.http.patch(`${this.urlBase}/${id}`, dato); 
  }

  funEliminar(id: number) { 
    return this.http.delete(`${this.urlBase}/${id}`); 
  }
}