import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  imports: [],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  miPerfil = signal<any>({});
  authService = inject(AuthService);
  router = inject(Router);
  constructor(){
    this.authService.funGetPerfil().subscribe(
      (res: any) => {
        this.miPerfil.set(res);
      }
    )
  }

  funSalir(){
    localStorage.removeItem("access_token");
    this.router.navigate(["/auth/login"]);
  }

  fechaActual: string = '';

  ngOnInit() {
    this.formatFechaHoy();
  }

  private formatFechaHoy() {
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    this.fechaActual = new Date().toLocaleDateString('es-ES', opciones);
  }
}
