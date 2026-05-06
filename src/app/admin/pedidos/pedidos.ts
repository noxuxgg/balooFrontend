import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe, DatePipe } from '@angular/common';
import { PedidoService } from '../../core/services/pedidos.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe, DatePipe],
  templateUrl: './pedidos.html',
})
export class Pedidos {

  pedidoService = inject(PedidoService);
  authService   = inject(AuthService);

  // Señales de datos
  pedidos    = signal<any[]>([]);
  clientes   = signal<any[]>([]);
  sucursales = signal<any[]>([]);

  // Usuario autenticado (igual que ventas)
  usuarioActualId     = signal<string>('');
  usuarioActualNombre = signal<string>('');

  // Control de Modal e IDs
  isOpen = false;
  idPedidoSeleccionado = '';

  // Paginación
  paginaActual   = signal(1);
  itemsPorPagina = 5;

  // Formulario Pedido — todos los selects como string (igual que ventas)
  pedidoForm = new FormGroup({
    clienteId:        new FormControl<number | null>(null,  [Validators.required]),
    sucursalId:       new FormControl<number | null>(null,  [Validators.required]),
    fechaPedido:      new FormControl('',  [Validators.required]),
    fechaEntrega:     new FormControl('',  [Validators.required]),
    horaEntrega:      new FormControl('',  [Validators.required]),
    cantidadPersonas: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    lugarEntrega:     new FormControl('',  [Validators.required, Validators.minLength(8)]),
    total:            new FormControl<number | null>(null, [Validators.required, Validators.min(0.1)]),
    adelanto:         new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    saldo:            new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    observaciones:    new FormControl(''),
    estado:           new FormControl<boolean>(true),
  });

  constructor() {
    this.listarTodo();
    // Carga el usuario autenticado automáticamente, igual que en ventas
    this.authService.funGetPerfil().subscribe((perfil: any) => {
      this.usuarioActualId.set(perfil.id);
      this.usuarioActualNombre.set(perfil.nombreUsuario);
    });
  }

listarTodo() {
  this.pedidoService.funListarPedido().subscribe((res: any) => {
    console.log('Pedidos:', res);
    this.pedidos.set(res);
  });
  this.pedidoService.funListarCliente().subscribe({
    next: (res: any) => {
      console.log('Clientes:', res);  // ← ¿llegan datos aquí?
      this.clientes.set(res);
    },
    error: (err) => console.error('Error clientes:', err)  // ← ¿hay error?
  });
  this.pedidoService.funListarSucursal().subscribe({
    next: (res: any) => {
      console.log('Sucursales:', res);  // ← ¿llegan datos aquí?
      this.sucursales.set(res);
    },
    error: (err) => console.error('Error sucursales:', err)
  });
}

  // --- PAGINACIÓN ---
  pedidosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    return this.pedidos().slice(inicio, inicio + this.itemsPorPagina);
  });

  totalPaginas = computed(() =>
    Math.ceil(this.pedidos().length / this.itemsPorPagina)
  );

  // --- HELPERS para la tabla ---
  getNombreCliente(pedido: any): string {
    if (pedido.cliente) return `${pedido.cliente.nombre} ${pedido.cliente.apellido}`;
    return pedido.clienteId ? 'Cargando...' : 'Sin cliente';
  }

  getNombreSucursal(pedido: any): string {
    if (pedido.sucursal) return pedido.sucursal.nombre;
    return pedido.sucursalId ? 'Cargando...' : 'Sin sucursal';
  }

  // --- CRUD ---
  guardarPedido() {
    if (this.pedidoForm.invalid) {
      this.pedidoForm.markAllAsTouched();
      alert('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    const v = this.pedidoForm.value;

    const datosEnvio = {
      clienteId:        Number(v.clienteId),
      usuarioId:        this.usuarioActualId(),   // viene del auth, no del form
      sucursalId:       Number(v.sucursalId),
      fechaPedido:      v.fechaPedido ?? '',
      fechaEntrega:     v.fechaEntrega ?? '',
      horaEntrega:      v.horaEntrega ?? '',
      cantidadPersonas: Number(v.cantidadPersonas),
      lugarEntrega:     v.lugarEntrega ?? '',
      total:            Number(v.total),
      adelanto:         Number(v.adelanto),
      saldo:            Number(v.saldo),
      observaciones:    v.observaciones ?? '',
      estado:           v.estado ?? true,
    };

    console.log('Enviando a backend:', datosEnvio);

    if (this.idPedidoSeleccionado) {
      this.pedidoService.funEditarPedido(datosEnvio as any, Number(this.idPedidoSeleccionado))
        .subscribe({
          next: () => this.resetForm(),
          error: (err) => console.error('Error al editar:', err),
        });
    } else {
      this.pedidoService.funGuardarPedido(datosEnvio as any)
        .subscribe({
          next: () => this.resetForm(),
          error: (err) => {
            alert('Error al guardar. Revisa la consola.');
            console.error('Error al guardar:', err);
          },
        });
    }
  }

  eliminarPedido(id: number) {
    if (confirm('¿Deseas eliminar este pedido?'))
      this.pedidoService.funEliminarPedido(id).subscribe(() => this.listarTodo());
  }

  mostrarPedido(datos: any) {
    this.idPedidoSeleccionado = datos.id;
    this.pedidoForm.patchValue({
      clienteId:        Number(datos.cliente?.id  ?? datos.clienteId  ?? ''),
      sucursalId:       Number(datos.sucursal?.id ?? datos.sucursalId ?? ''),
      fechaPedido:      this.formatDate(datos.fechaPedido),
      fechaEntrega:     this.formatDate(datos.fechaEntrega),
      horaEntrega:      datos.horaEntrega,
      cantidadPersonas: datos.cantidadPersonas,
      lugarEntrega:     datos.lugarEntrega,
      total:            datos.total,
      adelanto:         datos.adelanto,
      saldo:            datos.saldo,
      observaciones:    datos.observaciones,
      estado:           datos.estado,
    });
    this.isOpen = true;
  }

  formatDate(fecha: any): string {
    if (!fecha) return '';
    return new Date(fecha).toISOString().split('T')[0];
  }

  resetForm() {
    this.listarTodo();
    this.pedidoForm.reset({ estado: true });
    this.idPedidoSeleccionado = '';
    this.isOpen = false;
    this.paginaActual.set(1);
  }

  abrirNuevo() {
    this.pedidoForm.reset({ estado: true });
    this.idPedidoSeleccionado = '';
    this.isOpen = true;
  }
}