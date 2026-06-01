import { Component, inject, signal, computed } from '@angular/core';
import { VentasService } from '../../core/services/ventas.service';
import { AuthService } from '../../core/services/auth.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe], // quitado JsonPipe que no se usa
  templateUrl: './ventas.html',
})
export class Ventas {

  ventasService = inject(VentasService);
  authService = inject(AuthService);

  ventas = signal<any[]>([]);
  productos = signal<any[]>([]);
  sucursales = signal<any[]>([]);
  usuarioActualId = signal<string>('');
  usuarioActualNombre = signal<string>('');

  isOpen = signal(false);
  confirmarEliminarOpen = signal(false);
  private idParaEliminar: number = 0;
  idVentaSeleccionada = 0;

  detalles = signal<any[]>([]);
  pagos = signal<any[]>([]);

  errorServidor = signal('');
  alertasStock = signal<string[]>([]);

  paginaActual = signal(1);
  itemsPorPagina = 5;

  ventaForm = new FormGroup({
    sucursalId: new FormControl<number | null>(null, [Validators.required]),
  });

  detalleForm = new FormGroup({
    productoId: new FormControl<number | null>(null, [Validators.required]),
    cantidad: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    precioUnitario: new FormControl<number | null>(null, [Validators.required, Validators.min(0.1)]),
  });

  pagoForm = new FormGroup({
    metodo: new FormControl('efectivo', [Validators.required]),
    monto: new FormControl<number | null>(null, [Validators.required, Validators.min(0.1)]),
  });

  constructor() {
    this.listarTodo();
    this.authService.funGetPerfil().subscribe((perfil: any) => {
      this.usuarioActualId.set(perfil.id);
      this.usuarioActualNombre.set(perfil.nombreUsuario);
    });
  }

  listarTodo() {
    this.ventasService.funListar().subscribe((res: any) => this.ventas.set(res));
    this.ventasService.funListarProductos().subscribe((res: any) => this.productos.set(res));
    this.ventasService.funListarSucursales().subscribe((res: any) => this.sucursales.set(res));
  }

  ventasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    return this.ventas().slice(inicio, inicio + this.itemsPorPagina);
  });

  totalPaginas = computed(() => Math.ceil(this.ventas().length / this.itemsPorPagina));

  totalCalculado = computed(() =>
    this.detalles().reduce((sum, d) => sum + d.cantidad * d.precioUnitario, 0)
  );

  onProductoChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value);
    const producto = this.productos().find(p => p.id === id);
    if (producto) {
      this.detalleForm.patchValue({ precioUnitario: producto.precio });
    }
  }

  agregarDetalle() {
    if (this.detalleForm.invalid) {
      this.detalleForm.markAllAsTouched();
      return;
    }
    const val = this.detalleForm.value;
    const producto = this.productos().find(p => p.id === Number(val.productoId));
    this.detalles.update(d => [...d, {
      productoId: Number(val.productoId),
      cantidad: Number(val.cantidad),
      precioUnitario: Number(val.precioUnitario),
      nombreProducto: producto?.nombre ?? ''
    }]);
    this.detalleForm.reset();
    const nuevoTotal = this.totalCalculado();
    this.pagoForm.patchValue({ monto: nuevoTotal });
  }

  quitarDetalle(index: number) {
    this.detalles.update(d => d.filter((_, i) => i !== index));
    setTimeout(() => {
      const nuevoTotal = this.totalCalculado();
      if (nuevoTotal > 0) {
        this.pagoForm.patchValue({ monto: nuevoTotal });
     
        if (this.pagos().length > 0) {
          this.pagos.update(p => p.map(pago => ({ ...pago, monto: nuevoTotal })));
        }
      } else {
        this.pagos.set([]);
        this.pagoForm.patchValue({ monto: null });
      }
    });
  }

  incrementarCantidad(index: number) {
    this.detalles.update(d => d.map((item, i) =>
      i === index ? { ...item, cantidad: item.cantidad + 1 } : item
    ));
    const nuevoTotal = this.totalCalculado();
    this.pagoForm.patchValue({ monto: nuevoTotal });
    if (this.pagos().length > 0) {
      this.pagos.update(p => p.map(pago => ({ ...pago, monto: nuevoTotal })));
    }
  }

  decrementarCantidad(index: number) {
    const detalle = this.detalles()[index];
    if (detalle.cantidad <= 1) {
      this.quitarDetalle(index);
      return;
    }
    this.detalles.update(d => d.map((item, i) =>
      i === index ? { ...item, cantidad: item.cantidad - 1 } : item
    ));
    const nuevoTotal = this.totalCalculado();
    this.pagoForm.patchValue({ monto: nuevoTotal });
    if (this.pagos().length > 0) {
      this.pagos.update(p => p.map(pago => ({ ...pago, monto: nuevoTotal })));
    }
  }

  agregarPago() {
    if (this.pagoForm.invalid) {
      this.pagoForm.markAllAsTouched();
      return;
    }
    const val = this.pagoForm.value;
    this.pagos.set([{ metodo: val.metodo, monto: Number(val.monto) }]);
   
    this.pagoForm.reset({ metodo: 'efectivo', monto: this.totalCalculado() });
  }

  onMetodoChange() {
    const nuevoTotal = this.totalCalculado();
    if (nuevoTotal > 0) {
      this.pagoForm.patchValue({ monto: nuevoTotal });
    }
  }
  quitarPago(index: number) {
    this.pagos.update(p => p.filter((_, i) => i !== index));
  }

  editarVenta(venta: any) {
    this.idVentaSeleccionada = venta.id;
    this.ventaForm.patchValue({ sucursalId: venta.sucursalId });
    this.detalles.set(
      (venta.detalles ?? []).map((d: any) => ({
        productoId: d.productoId,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        nombreProducto: d.producto?.nombre ?? ''
      }))
    );
    this.pagos.set(
      (venta.pagos ?? []).map((p: any) => ({
        metodo: p.metodo,
        monto: p.monto
      }))
    );
    this.pagoForm.patchValue({ monto: this.totalCalculado() });
    this.isOpen.set(true);
  }

  guardarVenta() {
    if (this.ventaForm.invalid) {
      this.ventaForm.markAllAsTouched();
      this.errorServidor.set('Completa todos los campos requeridos.');
      setTimeout(() => this.errorServidor.set(''), 5000);
      return;
    }
    if (this.detalles().length === 0) {
      this.errorServidor.set('Agrega al menos un producto.');
      setTimeout(() => this.errorServidor.set(''), 5000);
      return;
    }
    if (this.pagos().length === 0) {
      this.errorServidor.set('Agrega al menos un pago.');
      setTimeout(() => this.errorServidor.set(''), 5000);
      return;
    }

    const datos: any = {
      usuarioId: this.usuarioActualId(),
      sucursalId: Number(this.ventaForm.value.sucursalId ?? 0),
      detalles: this.detalles().map(({ nombreProducto, ...resto }) => resto),
      pagos: this.pagos()
    };

    if (this.idVentaSeleccionada) {
      this.ventasService.funEditar(datos, this.idVentaSeleccionada).subscribe({
        next: () => this.finalizarOperacion(),
        error: (err: any) => {  // corregido el tipo any
          const texto = err.error?.message || 'Error al actualizar la venta.';
          this.errorServidor.set(texto);
          setTimeout(() => this.errorServidor.set(''), 10000);
        }
      });
    } else {
      this.ventasService.funGuardar(datos).subscribe({
        next: (res: any) => {
          if (res.alertas && res.alertas.length > 0) {
            this.alertasStock.set(res.alertas);
            setTimeout(() => this.alertasStock.set([]), 10000);
          }
          this.finalizarOperacion();
        },
        error: (err: any) => {  // corregido el tipo any
          const texto = err.error?.message || 'Error al guardar la venta.';
          this.errorServidor.set(texto);
          this.pagos.set([]);
          setTimeout(() => this.errorServidor.set(''), 10000);
        }
      });
    }
  }

  finalizarOperacion() {
    this.listarTodo();
    this.cerrarModal();
  }

  ventaEliminar(id: number) {
    this.idParaEliminar = id;
    this.confirmarEliminarOpen.set(true);
  }

  eliminarVenta() {
    if (this.idParaEliminar) {
      this.ventasService.funEliminar(this.idParaEliminar).subscribe({
        next: () => {
          this.listarTodo();
          this.cerrarConfirmacion();
        },
        error: (err: any) => console.error('Error al eliminar:', err)
      });
    }
  }

  cerrarConfirmacion() {
    this.confirmarEliminarOpen.set(false);
    this.idParaEliminar = 0;
  }

  cerrarModal() {
    this.isOpen.set(false);
    this.ventaForm.reset();
    this.detalleForm.reset();
    this.pagoForm.reset({ metodo: 'efectivo' });
    this.detalles.set([]);
    this.pagos.set([]);
    this.idVentaSeleccionada = 0;
    this.errorServidor.set('');
  }



}