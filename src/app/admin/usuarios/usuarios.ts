import { Component, inject, signal } from '@angular/core';
import { UsersService } from '../../core/services/users.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {
  userService = inject(UsersService);
  usuarios = signal<any>([]);
  idSeleccionado = "";

  usuarioForm = new FormGroup({
    nombreUsuario: new FormControl('', [Validators.required, Validators.minLength(30), Validators.maxLength(30)]),
    contrasenia: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(30)])
  });

  constructor() {
    this.listar();
  }

  listar() { 
    this.userService.funListar().subscribe(
      (res: any) => {
        this.usuarios.set(res)
      }
    ) 
  }

  guardarUsuario() {
    const usuarioDato = { 
      nombreUsuario: this.usuarioForm.value.nombreUsuario || '', 
      contrasenia: this.usuarioForm.value.contrasenia || '' 
    };
    this.userService.funGuardar(usuarioDato).subscribe(
      (res: any) => {
        this.listar()
      }
    )
  }

  mostrarUsuario(usuarioDato: any) {
    this.usuarioForm.patchValue({
      nombreUsuario: usuarioDato.nombreUsuario,
      contrasenia: ''
    });
    this.idSeleccionado = usuarioDato.id;
  }

  editarUsuario(usuarioDato: any) {
    if (!this.idSeleccionado) return;

    const datosActualizados = {
      nombreUsuario: this.usuarioForm.value.nombreUsuario || '',
      contrasenia: this.usuarioForm.value.contrasenia || ''
    };

    this.userService.funEditar(datosActualizados, this.idSeleccionado).subscribe(
      (res: any) => {
        this.listar();
        this.usuarioForm.reset();
        this.idSeleccionado = "";
        alert('Usuario actualizado con éxito');
      },
      (error) => {
        console.error(error);
        alert('Error al editar');
      }
    );
  }

}
