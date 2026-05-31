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

  soloLetras = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*$/;
  soloNumeros = /^[0-9]+$/;
  alfaNumericoMax2 = /^[0-9A-ZÑa-zñ]{1,2}$/;

  clienteService = inject(ClienteService);

  clientes = signal<any>([]);

  // Control de Modal e IDs
  isOpen = false;
  confirmarEliminarOpen = signal(false);
  idParaEliminar: number | null = null;
  idClienteSeleccionado = '';

  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = 5;

  // Formulario Cliente
  clienteForm = new FormGroup({
    carnet: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(10000),
      Validators.max(9999999999),
    ]),
    complemento: new FormControl('', [
      Validators.maxLength(2),
      Validators.pattern(this.alfaNumericoMax2),
    ]),
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
      carnet: Number(formValues.carnet),
      complemento: formValues.complemento ?? '',
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
          error: (err) => {
            const msg = err.error.message || "Error al editar";
            alert(msg)
          },
        });
    } else {
      this.clienteService.funGuardar(datosEnvio).subscribe({
        next: () => this.resetForm(),
        error: (err) => {
          const msg = err.error.message || "Error al guardar, revise la consola";
          alert(msg);
          console.error('Error al guardar:', err);
        },
      });
    }
  }

  abrirConfirmacion(id: number) {
    this.idParaEliminar = id;
    this.confirmarEliminarOpen.set(true);
  }

  cerrarConfirmacion() {
    this.idParaEliminar = null;
    this.confirmarEliminarOpen.set(false);
  }

  eliminarCliente() {
    if (this.idParaEliminar !== null) {
      this.clienteService.funEliminar(this.idParaEliminar).subscribe(() => {
        this.listarClientes();
        this.cerrarConfirmacion();
      });
    }
  }

  mostrarCliente(datos: any) {
    this.idClienteSeleccionado = datos.id;
    this.clienteForm.patchValue({
      carnet: datos.carnet,
      complemento: datos.complemento,
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