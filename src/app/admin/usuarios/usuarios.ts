import { Component, inject, signal } from '@angular/core';
import { UsersService } from '../../core/services/users.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesService } from '../../core/services/roles.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {
  userService = inject(UsersService);
  rolesService = inject(RolesService);
  usuarios = signal<any>([]);
  usuarioSolo = signal<any>([]);
  roles = signal<any>([]);
  rolUsuario = signal<any>([]);
  listaCompleta: any[] = [];
  idUsuarioSeleccionado = "";
  isOpen = signal(false);
  confirmarEliminarOpen = signal(false);
  private idParaEliminar: string = '';
  errorServidor = signal('');

  usuarioForm = new FormGroup({
    nombreUsuario: new FormControl('', [Validators.required, Validators.minLength(4), Validators.maxLength(30), Validators.pattern(/^\S.*$/)]),
    contrasenia: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(30), Validators.pattern(/^\S.*$/)]),
    roles: new FormControl('', Validators.required)
  });

  constructor() {
    this.listar();
    this.listarRol();
  }

  listar() {
    this.userService.funListar().subscribe(
      (res: any) => {
        this.usuarios.set(res);
      }
    )
  }

  listarUnoForm(id: string) {
    this.idUsuarioSeleccionado = id;
    this.userService.funListarUno(id).subscribe(
      (res: any) => {
        this.usuarioSolo.set(res);
        this.usuarioForm.patchValue({
          nombreUsuario: res.nombreUsuario,
          contrasenia: '',
          roles: res.roles && res.roles.length > 0 ? res.roles[0].id : ''
        });
      }
    );
    this.usuarioForm.get('contrasenia')?.setValidators([Validators.minLength(6)]);
    this.usuarioForm.get('contrasenia')?.updateValueAndValidity();
  }

  listarRol() {
    this.rolesService.funListar().subscribe(
      (res: any) => {
        this.roles.set(res);
      }
    )
  }

  guardarUsuario() {
    if (this.usuarioForm.invalid) return;
    const usuarioDato: any = {
      nombreUsuario: this.usuarioForm.value.nombreUsuario,
      ...(this.usuarioForm.value.contrasenia && { contrasenia: this.usuarioForm.value.contrasenia }),
      roleIds: [Number(this.usuarioForm.value.roles)]
    };

    if (this.idUsuarioSeleccionado) {
      this.userService.funEditar(usuarioDato, this.idUsuarioSeleccionado).subscribe({
        next: () => {
          this.finalizarOperacion();
        },
        error: (err) => {
          const texto = err.error?.message || 'Error desconocido';
          this.errorServidor.set(texto);
          setTimeout(() => this.errorServidor.set(''), 10000);
        }

      });

    } else {
      this.userService.funGuardar(usuarioDato).subscribe({
        next: () => {
          this.finalizarOperacion();
        },
        error: (err) => {
          const texto = err.error?.message || 'Error desconocido';
          this.errorServidor.set(texto);
          setTimeout(() => this.errorServidor.set(''), 10000);
        }
      });
    }
  }

  finalizarOperacion() {
    this.listar();
    this.cerrarModal();
  }

  mostrarUsuario(usuarioDato: any) {
    this.usuarioForm.patchValue({
      nombreUsuario: usuarioDato.nombreUsuario,
      contrasenia: ''
    });
    this.idUsuarioSeleccionado = usuarioDato.id;
  }

  eliminarUsuario() {
    if (this.idParaEliminar) {
      this.userService.funEliminar(this.idParaEliminar).subscribe({
        next: () => {
          this.listar();
          this.cerrarConfirmacion();
        },
        error: (err) => console.error('Error al eliminar:', err)
      });
    }
  }

  usuarioEliminar(id: string) {
    this.idParaEliminar = id;
    this.confirmarEliminarOpen.set(true);
  }

  cerrarConfirmacion() {
    this.confirmarEliminarOpen.set(false);
    this.idParaEliminar = '';
  }

  cerrarModal() {
    this.isOpen.set(false);
    this.usuarioForm.reset();
    this.idUsuarioSeleccionado = '';
    this.errorServidor.set('');
    this.usuarioForm.get('contrasenia')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm.get('contrasenia')?.updateValueAndValidity();
  }

}
