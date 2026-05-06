import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { ClienteService } from '../../core/services/clientes.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe],
  templateUrl: './clientes.html',
})
export class Clientes {

  soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  soloNumeros = /^[0-9]+$/;

  clienteService = inject(ClienteService);

  clientes = signal<any>([]);

  // Control de Modal e IDs
  isOpen = false;
  idClienteSeleccionado = '';

  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = 5;

  // Formulario Cliente
  clienteForm = new FormGroup({
    nombre: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern(this.soloLetras),
    ]),
    apellido: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern(this.soloLetras),
    ]),
    telefono: new FormControl('', [
      Validators.required,
      Validators.minLength(7),
      Validators.maxLength(8),
      Validators.pattern(this.soloNumeros),
    ]),
    estado: new FormControl<boolean>(true),
  });

  constructor() {
    this.listarClientes();
  }

  listarClientes() {
    this.clienteService.funListar().subscribe((res: any) =>
      this.clientes.set(res)
    );
  }

  // --- PAGINACIÓN ---
  clientesPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.clientes().slice(inicio, fin);
  });

  totalPaginas = computed(() =>
    Math.ceil(this.clientes().length / this.itemsPorPagina)
  );

  // --- CRUD ---
  guardarCliente() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      alert('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    const formValues = this.clienteForm.value;

    const datosEnvio = {
      nombre: formValues.nombre ?? '',
      apellido: formValues.apellido ?? '',
      telefono: formValues.telefono ?? '',
      estado: formValues.estado ?? true,
    };

    console.log('Enviando a backend:', datosEnvio);

    if (this.idClienteSeleccionado) {
      this.clienteService
        .funEditar(datosEnvio, Number(this.idClienteSeleccionado))
        .subscribe({
          next: () => this.resetForm(),
          error: (err) => console.error('Error al editar:', err),
        });
    } else {
      this.clienteService.funGuardar(datosEnvio).subscribe({
        next: () => this.resetForm(),
        error: (err) => {
          alert('Error al guardar. Revisa la consola.');
          console.error('Error al guardar:', err);
        },
      });
    }
  }

  eliminarCliente(id: number) {
    if (confirm('¿Deseas eliminar este cliente?'))
      this.clienteService.funEliminar(id).subscribe(() => this.listarClientes());
  }

  mostrarCliente(datos: any) {
    this.idClienteSeleccionado = datos.id;
    this.clienteForm.patchValue({
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono,
      estado: datos.estado,
    });
    this.isOpen = true;
  }

  resetForm() {
    this.listarClientes();
    this.clienteForm.reset({ estado: true });
    this.idClienteSeleccionado = '';
    this.isOpen = false;
    this.paginaActual.set(1);
  }

  abrirNuevo() {
    this.clienteForm.reset({ estado: true });
    this.idClienteSeleccionado = '';
    this.isOpen = true;
  }
}