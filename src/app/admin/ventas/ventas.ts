import { Component, inject, signal, computed } from '@angular/core';
import { VentasService } from '../../core/services/ventas.service';
import { AuthService } from '../../core/services/auth.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, DecimalPipe],
  templateUrl: './ventas.html',
})
export class Ventas {

  ventasService = inject(VentasService);
  authService = inject(AuthService);

  ventas = signal<any[]>([]);
  productos = signal<any[]>([]);
  sucursales = signal<any[]>([]);
  stock = signal<any[]>([]);
  usuarioActualId = signal<string>('');
  usuarioActualNombre = signal<string>('');
  esAdmin = signal<boolean>(true);
  sucursalBloqueadaId = signal<number | null>(null);
  sucursalBloqueadaNombre = signal<string>('');

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

  busquedaProducto = signal('');
  productoDropdownAbierto = signal(false);
  productoSeleccionadoNombre = signal('');

  reciboAbierto = signal(false);
  reciboData = signal<any>(null);

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

  sucursalSeleccionadaId = computed(() => this.ventaForm.get('sucursalId')?.value ?? null);

  constructor() {
    this.listarTodo();
    this.authService.funGetPerfil().subscribe((perfil: any) => {
      this.usuarioActualId.set(perfil.id);
      this.usuarioActualNombre.set(perfil.nombreUsuario);
      this.resolverRolYSucursal(perfil.nombreUsuario);
    });
    this.ventaForm.get('sucursalId')?.valueChanges.subscribe(() => {
      this.busquedaProducto.set('');
      this.productoSeleccionadoNombre.set('');
      this.detalleForm.reset();
    });
  }

  resolverRolYSucursal(nombreUsuario: string) {
    const match = nombreUsuario?.match(/^sucursal(\d+)Baloo$/i);
    if (match) {
      this.esAdmin.set(false);
      const numero = match[1];
      const nombreSucursal = `Sucursal#${numero}`;
      this.sucursalBloqueadaNombre.set(nombreSucursal);
      this.aplicarSucursalBloqueada();
    } else {
      this.esAdmin.set(true);
    }
  }

  aplicarSucursalBloqueada() {
    const sucursal = this.sucursales().find(s => s.nombre === this.sucursalBloqueadaNombre());
    if (sucursal) {
      this.sucursalBloqueadaId.set(sucursal.id);
      this.ventaForm.patchValue({ sucursalId: sucursal.id });
    }
  }

  listarTodo() {
    this.ventasService.funListar().subscribe((res: any) => this.ventas.set(res));
    this.ventasService.funListarProductos().subscribe((res: any) => this.productos.set(res));
    this.ventasService.funListarStock().subscribe((res: any) => this.stock.set(res));
    this.ventasService.funListarSucursales().subscribe((res: any) => {
      this.sucursales.set(res);
      if (!this.esAdmin() && this.sucursalBloqueadaNombre()) {
        this.aplicarSucursalBloqueada();
      }
    });
  }

  ventasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    return this.ventas().slice(inicio, inicio + this.itemsPorPagina);
  });

  totalPaginas = computed(() => Math.ceil(this.ventas().length / this.itemsPorPagina));

  totalCalculado = computed(() =>
    this.detalles().reduce((sum, d) => sum + d.cantidad * d.precioUnitario, 0)
  );

  productosDisponiblesPorSucursal = computed(() => {
    const sucursalId = this.sucursalSeleccionadaId();
    if (!sucursalId) return [];
    const idsConStock = new Set(
      this.stock()
        .filter(s => s.sucursalId === sucursalId || s.sucursal?.id === sucursalId)
        .map(s => s.productoId ?? s.producto?.id)
    );
    return this.productos().filter(p => idsConStock.has(p.id));
  });

  productosFiltrados = computed(() => {
    const termino = this.busquedaProducto().toLowerCase().trim();
    const base = this.productosDisponiblesPorSucursal();
    if (!termino) return base;
    return base.filter(p => p.nombre.toLowerCase().includes(termino));
  });

  onBusquedaProductoChange(event: Event) {
    const valor = (event.target as HTMLInputElement).value;
    this.busquedaProducto.set(valor);
    this.productoDropdownAbierto.set(true);
    if (!valor) {
      this.detalleForm.patchValue({ productoId: null, precioUnitario: null });
      this.productoSeleccionadoNombre.set('');
    }
  }

  abrirDropdownProducto() {
    this.productoDropdownAbierto.set(true);
  }

  cerrarDropdownProducto() {
    setTimeout(() => this.productoDropdownAbierto.set(false), 150);
  }

  seleccionarProducto(producto: any) {
    this.detalleForm.patchValue({
      productoId: producto.id,
      precioUnitario: producto.precio
    });
    this.busquedaProducto.set(producto.nombre);
    this.productoSeleccionadoNombre.set(producto.nombre);
    this.productoDropdownAbierto.set(false);
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
    this.busquedaProducto.set('');
    this.productoSeleccionadoNombre.set('');
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

  construirSnapshotRecibo() {
    const sucursalId = Number(this.ventaForm.value.sucursalId ?? 0);
    const sucursal = this.sucursales().find(s => s.id === sucursalId);
    return {
      fecha: new Date(),
      sucursalNombre: sucursal?.nombre ?? '',
      usuarioNombre: this.usuarioActualNombre(),
      detalles: this.detalles().map(d => ({ ...d })),
      pagos: this.pagos().map(p => ({ ...p })),
      total: this.totalCalculado()
    };
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

    const esCreacion = !this.idVentaSeleccionada;
    const snapshotRecibo = this.construirSnapshotRecibo();

    const datos: any = {
      usuarioId: this.usuarioActualId(),
      sucursalId: Number(this.ventaForm.value.sucursalId ?? 0),
      detalles: this.detalles().map(({ nombreProducto, ...resto }) => resto),
      pagos: this.pagos()
    };

    if (this.idVentaSeleccionada) {
      this.ventasService.funEditar(datos, this.idVentaSeleccionada).subscribe({
        next: () => this.finalizarOperacion(),
        error: (err: any) => {
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
          if (esCreacion) {
            this.reciboData.set(snapshotRecibo);
            this.reciboAbierto.set(true);
          }
        },
        error: (err: any) => {
          const texto = err.error?.message || 'Error al guardar la venta.';
          this.errorServidor.set(texto);
          this.pagos.set([]);
          setTimeout(() => this.errorServidor.set(''), 10000);
        }
      });
    }
  }

  cerrarRecibo() {
    this.reciboAbierto.set(false);
    this.reciboData.set(null);
  }

  generarPDF() {
    const data = this.reciboData();
    if (!data) return;

    const doc = new jsPDF({ unit: 'mm', format: [80, 150] });
    let y = 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BALOO', 40, y, { align: 'center' });
    y += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Recibo de venta', 40, y, { align: 'center' });
    y += 6;

    doc.text(`Sucursal: ${data.sucursalNombre}`, 5, y);
    y += 4;
    doc.text(`Atendido por: ${data.usuarioNombre}`, 5, y);
    y += 4;
    doc.text(`Fecha: ${data.fecha.toLocaleString()}`, 5, y);
    y += 6;

    doc.text('Producto', 5, y);
    doc.text('Cant.', 45, y);
    doc.text('Subtotal', 60, y);
    y += 3;
    doc.line(5, y, 75, y);
    y += 4;

    data.detalles.forEach((d: any) => {
      doc.text(d.nombreProducto, 5, y);
      doc.text(String(d.cantidad), 45, y);
      doc.text((d.cantidad * d.precioUnitario).toFixed(2), 60, y);
      y += 4;
    });

    y += 2;
    doc.line(5, y, 75, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${data.total.toFixed(2)} Bs`, 5, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    data.pagos.forEach((p: any) => {
      doc.text(`Pago (${p.metodo}): ${Number(p.monto).toFixed(2)} Bs`, 5, y);
      y += 4;
    });

    y += 4;
    doc.setFontSize(7);
    doc.text('¡Gracias por su compra!', 40, y, { align: 'center' });

    doc.save(`recibo-venta-${Date.now()}.pdf`);
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
    this.busquedaProducto.set('');
    this.productoSeleccionadoNombre.set('');
    this.idVentaSeleccionada = 0;
    this.errorServidor.set('');
    if (!this.esAdmin()) {
      this.aplicarSucursalBloqueada();
    }
  }

}