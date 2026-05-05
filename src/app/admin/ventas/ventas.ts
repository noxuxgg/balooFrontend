import { Component, inject, signal, computed } from '@angular/core';
import { VentasService } from '../../core/services/ventas.service';
import { AuthService } from '../../core/services/auth.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe, DatePipe, DecimalPipe],
  templateUrl: './ventas.html',
})
export class Ventas {

  ventasService = inject(VentasService);
  authService = inject(AuthService);

  ventas = signal<any[]>([]);
  productos = signal<any[]>([]);
  sucursales = signal<any[]>([]);
  usuarioActualId = signal<string>('');    // guarda el uuid del usuario
  usuarioActualNombre = signal<string>('');   // agregar

  isOpen = false;
  idVentaSeleccionada = '';

  detalles = signal<any[]>([]);
  pagos = signal<any[]>([]);

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
    // 👈 cargar perfil para obtener uuid automático
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

  // 👈 precio automático al elegir producto
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
      nombreProducto: producto?.nombre ?? ''   // 👈 solo para mostrar en UI
    }]);
    this.detalleForm.reset();
  }

  quitarDetalle(index: number) {
    this.detalles.update(d => d.filter((_, i) => i !== index));
  }

  agregarPago() {
    if (this.pagoForm.invalid) {
      this.pagoForm.markAllAsTouched();
      return;
    }
    const val = this.pagoForm.value;
    this.pagos.update(p => [...p, {
      metodo: val.metodo,
      monto: Number(val.monto)
    }]);
    this.pagoForm.reset({ metodo: 'efectivo' });
  }

  quitarPago(index: number) {
    this.pagos.update(p => p.filter((_, i) => i !== index));
  }

  guardarVenta() {
    if (this.ventaForm.invalid) {
      this.ventaForm.markAllAsTouched();
      alert('Completa todos los campos requeridos.');
      return;
    }
    if (this.detalles().length === 0) {
      alert('Agrega al menos un producto.');
      return;
    }
    if (this.pagos().length === 0) {
      alert('Agrega al menos un pago.');
      return;
    }

    const datos: any = {
      usuarioId: this.usuarioActualId(),
      sucursalId: Number(this.ventaForm.value.sucursalId ?? 0),
      detalles: this.detalles().map(({ nombreProducto, ...resto }) => resto), // 👈 quita nombreProducto
      pagos: this.pagos()
    };

    console.log('Enviando venta:', datos);

    this.ventasService.funGuardar(datos).subscribe({
      next: () => this.reset(),
      error: (err) => {
        alert('Error al guardar. Revisa la consola.');
        console.error(err);
      }
    });
  }

  eliminarVenta(id: number) {
    if (confirm('¿Eliminar venta?'))
      this.ventasService.funEliminar(id).subscribe(() => this.listarTodo());
  }

  reset() {
    this.listarTodo();
    this.ventaForm.reset();
    this.detalleForm.reset();
    this.pagoForm.reset({ metodo: 'efectivo' });
    this.detalles.set([]);
    this.pagos.set([]);
    this.isOpen = false;
    this.paginaActual.set(1);
  }
}