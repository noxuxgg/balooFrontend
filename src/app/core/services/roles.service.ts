import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Rol } from '../interfaces/rol';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private readonly urlBase = environment.urlBase;
  http = inject(HttpClient);

  funListar() {
    return this.http.get(`${this.urlBase}/roles`);
  }

  funListarUno(id: number) {
    return this.http.get(`${this.urlBase}/roles/${id}`);
  }

  funGuardar(dato: Rol) {
    return this.http.post(`${this.urlBase}/roles`, dato);
  }

  funEditar(dato: Rol, id: number) {
    return this.http.patch(`${this.urlBase}/roles/${id}`, dato);
  }

  funEliminar(id: number) {
    return this.http.delete(`${this.urlBase}/roles/${id}`);
  }
}
