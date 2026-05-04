import { Component, inject, OnInit, signal } from '@angular/core'; // Ya no necesitas OnInit
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  idUsuario = localStorage.getItem('user_id')
  miPerfil = signal<any>({});
  authService = inject(AuthService);
  router = inject(Router);

  constructor() {
    this.authService.funGetPerfil().subscribe({
      next: (res: any) => {
        console.log('Perfil cargado:', res);
        this.miPerfil.set(res);
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
      }
    });
  }

  funSalir(){
    localStorage.removeItem("access_token");
    this.router.navigate(["/auth/login"]);
  }
}