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
  idUsuario = localStorage.getItem('user_id');
  miPerfil = signal<any>({});
  authService = inject(AuthService);
  router = inject(Router);
  esVendedor = signal<boolean>(false);

  constructor() {
    this.authService.funGetPerfil().subscribe({
      next: (res: any) => {
        console.log('Perfil cargado:', res);
        this.miPerfil.set(res);
        const usuarioActivo = res?.nombreUsuario || '';

        if (
          usuarioActivo === 'sucursal1Baloo' ||
          usuarioActivo === 'sucursal2Baloo' ||
          usuarioActivo === 'sucursal3Baloo' ||
          usuarioActivo === 'sucursal4Baloo'
        ) {
          this.esVendedor.set(true);
        } else {
          this.esVendedor.set(false);
        }
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
      }
    });
  }

  funSalir() {
    localStorage.removeItem("access_token");
    this.router.navigate(["/auth/login"]);
  }
}