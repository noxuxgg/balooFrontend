import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe, DatePipe } from '@angular/common';
import { PedidoService } from '../../core/services/pedidos.service';
import { AuthService } from '../../core/services/auth.service';
import { Pedido } from '../../core/interfaces/pedido';

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
  confirmarEliminarOpen = signal(false);
  advertenciaOpen = signal({ abierto: false, titulo: '', mensaje: '' });idParaEliminar: number | null = null;
  idPedidoSeleccionado = '';

  // Paginación
  paginaActual   = signal(1);
  itemsPorPagina = 5;

  pedidoForm = new FormGroup({
    clienteId:        new FormControl<number | null>(null,  [Validators.required]),
    sucursalId:       new FormControl<number | null>(null,  [Validators.required]),
    fechaPedido:      new FormControl('',  [Validators.required]),
    fechaEntrega:     new FormControl('',  [Validators.required]),
    horaEntrega:      new FormControl('',  [
      Validators.required,
      Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
    ]),
    cantidadPersonas: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    lugarEntrega:     new FormControl('',  [Validators.required, Validators.minLength(8)]),
    total:            new FormControl<number | null>(null, [Validators.required, Validators.min(0.1)]),
    adelanto:         new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    saldo:            new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    observaciones:    new FormControl(''),
    estadoEntrega:    new FormControl<number>(1, [Validators.required]),
    estadoPago:       new FormControl<number>(1, [Validators.required]),
    estado:           new FormControl<boolean>(true),
  });

  constructor() {
    this.listarTodo();
    this.authService.funGetPerfil().subscribe((perfil: any) => {
      this.usuarioActualId.set(perfil.id);
      this.usuarioActualNombre.set(perfil.nombreUsuario);
    });
    this.pedidoForm.valueChanges.subscribe(val =>{
      const tot = Number(val.total) || 0;
      const ade = Number(val.adelanto) || 0;
      const calculoSaldo = tot - ade;

      // Determinar el estado de pago automático
      let autoEstadoPago = 1; // Por Pagar
      if (tot > 0 && calculoSaldo === 0) {
        autoEstadoPago = 3; // Pagado
      } else if (ade > 0 && calculoSaldo > 0) {
        autoEstadoPago = 2; // Pago Parcial
      }

      this.pedidoForm.patchValue(
        { 
          saldo: calculoSaldo > 0 ? calculoSaldo : 0,
          estadoPago: autoEstadoPago
        },
        { emitEvent: false }
      );
    });
  }

listarTodo() {
  this.pedidoService.funListarPedido().subscribe((res: any) => {
    console.log('Pedidos:', res);
    this.pedidos.set(res);
  });
  this.pedidoService.funListarCliente().subscribe({
    next: (res: any) => {
      console.log('Clientes:', res); 
      this.clientes.set(res);
    },
    error: (err) => {console.error('Error clientes:', err); } 
  });
  this.pedidoService.funListarSucursal().subscribe({
    next: (res: any) => {
      console.log('Sucursales:', res); 
      this.sucursales.set(res);
    },
    error: (err) => {console.error('Error sucursales:', err); }
  });
}

  // --- PAGINACIÓN ---
  pedidosOrdenados=computed(() => {
    return [...this.pedidos()].sort((a,b) => {
      return new Date(a.fechaEntrega).getTime() - new Date(b.fechaEntrega).getTime();
    });
  });

  pedidosPaginados=computed(() => {
    const inicio=(this.paginaActual() - 1) * this.itemsPorPagina;
    const fin=inicio + this.itemsPorPagina;
    return this.pedidosOrdenados().slice(inicio, fin);
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
      this.advertenciaOpen.set({
        abierto: true,
        titulo: 'Campos Incompletos',
        mensaje: 'Por favor, rellena todos los campos obligatorios resaltados en rojo antes de continuar.'
      });
      return;
    }

    const v = this.pedidoForm.value;

    const datosEnvio = {
      clienteId:        Number(v.clienteId),
      usuarioId:        this.usuarioActualId(), 
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
      estadoEntrega:    Number(v.estadoEntrega ?? 1),
      estadoPago:       Number(v.estadoPago ?? 1),
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

  abrirConfirmacion(id: number) {
    this.idParaEliminar = id;
    this.confirmarEliminarOpen.set(true);
  }

  cerrarConfirmacion() {
    this.idParaEliminar = null;
    this.confirmarEliminarOpen.set(false);
  }

  eliminarPedido() {
    if (this.idParaEliminar !== null) {
    this.pedidoService.funEliminarPedido(this.idParaEliminar).subscribe(() => {
      this.listarTodo();
      this.cerrarConfirmacion();
    });
  }
}

marcarComoEntregado(pedido: Pedido) {
    const p=pedido as Record<string, any>;
    const pago=Number(p['estadoPago']);
    
    if (pago !== 3) {
      this.advertenciaOpen.set({
        abierto: true,
        titulo: 'Saldo Pendiente',
        mensaje: 'No se puede entregar el pedido porque aún no ha sido pagado por completo. Registra el pago total antes de despacharlo.'
      }); 
      return;
    }

    const datosActualizar: unknown={
      ...pedido,
      clienteId: Number(p['cliente']?.id ?? p['clienteId']),
      usuarioId: p['usuario']?.id ?? p['usuarioId'],
      sucursalId: Number(p['sucursal']?.id ?? p['sucursalId']),
      fechaPedido: this.formatDate(p['fechaPedido']),
      fechaEntrega: this.formatDate(p['fechaEntrega']),
      horaEntrega: p['horaEntrega'] ?? '',
      cantidadPersonas: Number(p['cantidadPersonas']),
      lugarEntrega: p['lugarEntrega'] ?? '',
      total: Number(p['total']),
      adelanto: Number(p['adelanto']),
      saldo: Number(p['saldo']),
      observaciones: p['observaciones'] ?? '',
      estadoEntrega: 3, 
      estadoPago: pago,
      estado: p['estado'] ?? true,
    };

    const idPedido=Number(p['id']);

    this.pedidoService.funEditarPedido(datosActualizar as any, idPedido).subscribe({
      next: () => {
        this.listarTodo();
      },
      error: (err) => {
        console.error('Error al marcar como entregado:', err);
      }
    });
  }

  mostrarPedido(datos: any) {
    this.idPedidoSeleccionado = datos['id'];
    this.pedidoForm.patchValue({
      clienteId:        Number(datos['clienteId'] ?? datos['cliente']?.['id'] ?? ''),
      sucursalId:       Number(datos['sucursalId'] ?? datos['sucursal']?.['id'] ?? ''),
      fechaPedido:      this.formatDate(datos['fechaPedido']),
      fechaEntrega:     this.formatDate(datos['fechaEntrega']),
      horaEntrega:      datos['horaEntrega'] ?? '',
      cantidadPersonas: datos['cantidadPersonas'] ?? 0,
      lugarEntrega:     datos['lugarEntrega'] ?? '',
      total:            Number(datos['total']),
      adelanto:         Number(datos['adelanto']),
      saldo:            Number(datos['saldo']),
      observaciones:    datos['observaciones'] ?? '',
      estadoEntrega:    Number(datos['estadoEntrega'] ?? 1),
      estadoPago:       Number(datos['estadoPago']),
      estado:           datos['estado'] ?? true,
    });
    this.isOpen = true;
  }

  formatDate(fecha: any): string {
    if (!fecha) return '';
    return new Date(fecha).toISOString().split('T')[0];
  }

  resetForm() {
    this.listarTodo();
    this.pedidoForm.reset({ estadoEntrega: 1, estadoPago: 1, estado: true });
    this.idPedidoSeleccionado = '';
    this.isOpen = false;
    this.paginaActual.set(1);
  }

  abrirNuevo() {
    this.idPedidoSeleccionado = '';
    this.isOpen = true;
    
    const hoy = new Date().toISOString().split('T')[0];
    
    this.pedidoForm.reset({
      fechaPedido: hoy,
      estadoEntrega: 1,
      estadoPago: 1,
      estado: true,
      clienteId: null,
      sucursalId: null,
      cantidadPersonas: null,
      lugarEntrega: '',
      total: null,
      adelanto: null,
      saldo: null,
      observaciones: '',
      horaEntrega: '',
      fechaEntrega: ''
    });
  }
}