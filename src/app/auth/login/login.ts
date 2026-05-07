import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  mensajeError = signal<string | null>(null);
  loginForm = new FormGroup({
    nombreUsuario: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(30)]),
    contrasenia: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(30)])
  });

  authService = inject(AuthService);

  router = inject(Router);

  funLogin(){
    this.authService.funConectarConBackendLogin(this.loginForm.value).subscribe(
      (res: any) =>{
        console.log(res);
        localStorage.setItem("access_token", res.access_token);
        this.router.navigate(['/admin/usuarios']);
      },
      (erro) => {
        console.log(erro);
        this.mensajeError.set('Las credenciales son incorrectas');
      }
    );
  }
}
