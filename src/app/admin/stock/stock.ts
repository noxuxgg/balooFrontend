import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
// Servicios del ecosistema Baloo
import { StockService } from '../../core/services/stock.service';
import { ProductoService } from '../../core/services/productos.service';
import { CategoriaService } from '../../core/services/categorias.service';
import { SucursalService } from '../../core/services/sucursales.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './stock.html',
})
export class Stock {
  private stockService = inject(StockService);
  private sucursalService = inject(SucursalService);
  private productosService = inject(ProductoService);
  private categoriasService = inject(CategoriaService);

  // Señales de Datos
  productosStock = signal<any[]>([]);
  sucursales = signal<any[]>([]);
  productosGlobales = signal<any[]>([]); 
  categorias = signal<any[]>([]); 
  
  // Controles y Estados
  sucursalControl = new FormControl('');
  buscadorControl = new FormControl('');
  busquedaComboProducto = signal('');
  
  isOpen = signal(false); 
  confirmarEliminarOpen = signal(false); 
  mostrarSugerenciasPrincipal = signal(false);
  mostrarDropdownCombo = signal(false);

  // Paginación y Filtros
  paginaActual = signal(1);
  itemsPorPagina = 5;
  terminoBusquedaActivo = signal('');
  sucursalFiltradaActual = signal('');
  cambiosTemporales = signal<{ [key: number]: number }>({});

  // Modales
  modalConfirmacion = { registro: null as any, cantidad: 0 };
  modalNuevoStock = { productoId: null as number | null, cantidadInicial: 1, stockMinimo: 5 };

  // Alertas
  errorServidor = signal<string | null>(null);
  tipoAlerta = signal<'success' | 'error'>('error');

  constructor() {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    this.stockService.funListar().subscribe((res: any) => this.productosStock.set(res));
    this.sucursalService.funListar().subscribe((res: any) => this.sucursales.set(res));
    this.productosService.funListar().subscribe((res: any) => this.productosGlobales.set(res));
    this.categoriasService.funListar().subscribe((res: any) => this.categorias.set(res));
  }

  // --- LÓGICA COMPUTADA (CORREGIDA) ---

  // Esta función resuelve el error TS2339
  productosDisponiblesParaAsignar = computed(() => {
    const busqueda = this.busquedaComboProducto().toLowerCase().trim();
    const yaEnStock = this.productosStock()
      .filter(s => s.sucursalId === Number(this.sucursalFiltradaActual()))
      .map(s => s.productoId);

    return this.productosGlobales().filter(p => 
      !yaEnStock.includes(p.id) && 
      p.nombre.toLowerCase().includes(busqueda)
    );
  });

  stockFiltrado = computed(() => {
    let lista = this.productosStock();
    if (this.sucursalFiltradaActual()) {
      lista = lista.filter(p => p.sucursalId === Number(this.sucursalFiltradaActual()));
    }
    const busqueda = this.terminoBusquedaActivo().toLowerCase();
    if (busqueda) {
      lista = lista.filter(p => p.producto?.nombre?.toLowerCase().includes(busqueda));
    }
    return lista;
  });

  stockPaginado = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    return this.stockFiltrado().slice(inicio, inicio + this.itemsPorPagina);
  });

  totalPaginas = computed(() => Math.ceil(this.stockFiltrado().length / this.itemsPorPagina));

  sugerenciasBuscadorPrincipal = computed(() => {
    const query = (this.buscadorControl.value ?? '').toLowerCase().trim();
    if (!query) return [];
    return [...new Set(this.productosStock()
      .filter(p => p.producto?.nombre?.toLowerCase().includes(query))
      .map(p => p.producto?.nombre))].slice(0, 5);
  });

  // --- MÉTODOS DE ACCIÓN ---
  aplicarFiltroSucursal() {
    this.sucursalFiltradaActual.set(this.sucursalControl.value ?? '');
    this.paginaActual.set(1);
  }

  modificarCambioTemporal(id: number, valor: number) {
    const actual = this.cambiosTemporales()[id] || 0;
    const registro = this.productosStock().find(p => p.id === id);
    if (registro && registro.cantidad + actual + valor >= 0) {
      this.cambiosTemporales.set({ ...this.cambiosTemporales(), [id]: actual + valor });
    }
  }

  solicitarConfirmacion(registro: any) {
    this.modalConfirmacion = { registro, cantidad: this.cambiosTemporales()[registro.id] };
    this.confirmarEliminarOpen.set(true);
  }

  procesarGuardadoStock() {
    const { registro, cantidad } = this.modalConfirmacion;
    this.stockService.actualizarUnidades({
      productoId: registro.productoId,
      sucursalId: registro.sucursalId,
      cantidad
    }).subscribe(() => {
      this.confirmarEliminarOpen.set(false);
      const nuevosCambios = { ...this.cambiosTemporales() };
      delete nuevosCambios[registro.id];
      this.cambiosTemporales.set(nuevosCambios);
      this.cargarDatosIniciales();
    });
  }

  guardarNuevoStock() {
    if (!this.modalNuevoStock.productoId) return;
    const payload = { ...this.modalNuevoStock, sucursalId: Number(this.sucursalFiltradaActual()) };
    this.stockService.funGuardar(payload).subscribe(() => {
      this.isOpen.set(false);
      this.cargarDatosIniciales();
    });
  }
}