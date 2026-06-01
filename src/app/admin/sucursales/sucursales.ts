import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SucursalService } from '../../core/services/sucursales.service';

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './sucursales.html',
  styleUrl: './sucursales.scss',
})
export class Sucursales {
  sucursalService = inject(SucursalService);
  sucursales = signal<any>([]);
  sucursalSolo = signal<any>([]);
  listaCompleta: any[] = [];
  idSucursalSeleccionado = "";
  mensajeError = signal('');
  isOpen = signal(false);
  confirmarEliminarOpen = signal(false);
  private idParaEliminar: string = '';
  errorServidor = signal('');

  sucursalForm = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(20), Validators.pattern(/^\S.*$/)]),
    direccion: new FormControl('', [Validators.required, Validators.minLength(10), Validators.maxLength(30), Validators.pattern(/^\S.*$/)]),
    telefono: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(8)])
  });

  constructor() {
    this.listar();
  }

  listar() {
    this.sucursalService.funListar().subscribe(
      (res: any) => {
        this.sucursales.set(res);
      }
    )
  }

  listarUnoForm(id: string) {
    this.idSucursalSeleccionado = id;
    this.sucursalService.funListarUno(id).subscribe(
      (res: any) => {
        this.sucursalSolo.set(res);
        this.sucursalForm.patchValue({
          nombre: res.nombre,
          direccion: res.direccion,
          telefono: res.telefono
        });
      }
    );
  }

  guardarSucursal() {
    if (this.sucursalForm.invalid) return;
    const usuarioDato: any = {
      nombre: this.sucursalForm.value.nombre,
      direccion: this.sucursalForm.value.direccion,
      telefono: this.sucursalForm.value.telefono
    };

    if (this.idSucursalSeleccionado) {
      this.sucursalService.funEditar(usuarioDato, this.idSucursalSeleccionado).subscribe({
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
      this.sucursalService.funGuardar(usuarioDato).subscribe({
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

  mostrarSucursal(sucursalDato: any) {
    this.sucursalForm.patchValue({
      nombre: sucursalDato.nombre,
      direccion: sucursalDato.direccion ,
      telefono: sucursalDato.telefono
    });
    this.idSucursalSeleccionado = sucursalDato.id;
  }

  eliminarSucursal() {
    if (this.idParaEliminar) {
      this.sucursalService.funEliminar(this.idParaEliminar).subscribe({
        next: () => {
          this.listar();
          this.cerrarConfirmacion();
        },
        error: (err) => console.error('Error al eliminar:', err)
      });
    }
  }

  sucursalEliminar(id: string) {
    this.idParaEliminar = id;
    this.confirmarEliminarOpen.set(true);
  }

  cerrarConfirmacion() {
    this.confirmarEliminarOpen.set(false);
    this.idParaEliminar = '';
  }

  cerrarModal() {
    this.isOpen.set(false);
    this.sucursalForm.reset();
    this.idSucursalSeleccionado = '';
    this.errorServidor.set('');
  }
}
