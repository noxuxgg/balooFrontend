import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { StockService } from '../../core/services/stock.service';
import { ProductoService } from '../../core/services/productos.service';
import { CategoriaService } from '../../core/services/categorias.service';
import { SucursalService } from '../../core/services/sucursales.service';
import { CommonModule } from '@angular/common';

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

  productosStock = signal<any[]>([]);
  sucursales = signal<any[]>([]);
  productosGlobales = signal<any[]>([]); 
  categorias = signal<any[]>([]); 
  
  isOpen = signal(false); 
  confirmarEliminarOpen = signal(false); 
  errorServidor = signal<string | null>(null);
  tipoAlerta = signal<'success' | 'error'>('error');

  cambiosTemporales = signal<{ [key: number]: number }>({});
  sucursalControl = new FormControl('');
  buscadorControl = new FormControl('');
  
  terminoBusquedaActivo = signal('');
  mostrarSugerenciasPrincipal = signal(false);
  sucursalFiltradaActual = signal('');

  busquedaComboProducto = signal('');
  mostrarDropdownCombo = signal(false);

  paginaActual = signal(1);
  itemsPorPagina = 5;

  modalConfirmacion = { registro: null as any, cantidad: 0 };
  modalNuevoStock = { productoId: null as number | null, cantidadInicial: 1, stockMinimo: 5 };

  constructor() {
    this.listarTodo();
  }

  listarTodo() {
    this.stockService.funListar().subscribe(res => this.productosStock.set(res));
    this.sucursalService.funListar().subscribe((res: any) => this.sucursales.set(res));
    this.productosService.funListar().subscribe(res => this.productosGlobales.set(res));
    this.categoriasService.funListar().subscribe(res => this.categorias.set(res));
  }

  lanzarAlerta(mensaje: string, tipo: 'success' | 'error' = 'error') {
    this.errorServidor.set(mensaje);
    this.tipoAlerta.set(tipo);
    setTimeout(() => this.errorServidor.set(null), 3000);
  }

  // --- Lógica de Botones y Validaciones ---

  aplicarFiltroSucursal() {
    const valorSeleccionado = this.sucursalControl.value;
    this.sucursalFiltradaActual.set(valorSeleccionado ?? '');
    this.paginaActual.set(1);
    
    // Feedback de usuario: Mensaje de tabla actualizada
    this.lanzarAlerta("Tabla actualizada", "success");
  }

  abrirModalNuevo() {
    // Validación obligatoria: Debe haber una sucursal seleccionada en el filtro
    if (!this.sucursalFiltradaActual()) {
      this.lanzarAlerta("Primero debe escoger una sucursal obligatoriamente", "error");
      return;
    }
    // Si pasa la validación, resetear modal y abrir
    this.modalNuevoStock = { productoId: null, cantidadInicial: 1, stockMinimo: 5 };
    this.busquedaComboProducto.set('');
    this.isOpen.set(true);
  }

  // --- Filtrado y Búsqueda ---

  sugerenciasBuscadorPrincipal = computed(() => {
    const query = (this.buscadorControl.value ?? '').toLowerCase().trim();
    if (!query) return [];
    return [...new Set(this.productosStock()
      .filter(p => p.producto?.nombre?.toLowerCase().includes(query))
      .map(p => p.producto?.nombre))].slice(0, 5);
  });

  stockFiltrado = computed(() => {
    let listado = [...this.productosStock()];
    const query = this.terminoBusquedaActivo().toLowerCase().trim();
    const sucursalId = this.sucursalFiltradaActual();

    if (sucursalId) {
      listado = listado.filter(p => p.sucursalId === Number(sucursalId));
    }

    if (query) {
      listado = listado.filter(p => 
        p.producto?.nombre?.toLowerCase().includes(query)
      );
    }

    return listado.sort((a, b) => b.cantidad - a.cantidad);
  });

  stockPaginado = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    return this.stockFiltrado().slice(inicio, inicio + this.itemsPorPagina);
  });

  totalPaginas = computed(() => Math.ceil(this.stockFiltrado().length / this.itemsPorPagina) || 1);

  ejecutarBusqueda() {
    this.terminoBusquedaActivo.set(this.buscadorControl.value ?? '');
    this.paginaActual.set(1);
    this.mostrarSugerenciasPrincipal.set(false);
  }

  // --- Gestión de Stock ---

  modificarCambioTemporal(id: number, valor: number) {
    const mapa = { ...this.cambiosTemporales() };
    const registro = this.productosStock().find(p => p.id === id);
    if (!registro) return;

    const nuevaVariacion = (mapa[id] || 0) + valor;
    if (registro.cantidad + nuevaVariacion < 0) return;

    nuevaVariacion === 0 ? delete mapa[id] : mapa[id] = nuevaVariacion;
    this.cambiosTemporales.set(mapa);
  }

  solicitarConfirmacion(registro: any) {
    const cantidad = this.cambiosTemporales()[registro.id] || 0;
    this.modalConfirmacion = { registro, cantidad };
    this.confirmarEliminarOpen.set(true);
  }

  procesarGuardadoStock() {
    const { registro, cantidad } = this.modalConfirmacion;
    this.stockService.actualizarUnidades({
      productoId: registro.productoId,
      sucursalId: registro.sucursalId,
      cantidad: cantidad
    }).subscribe({
      next: () => {
        const mapa = { ...this.cambiosTemporales() };
        delete mapa[registro.id];
        this.cambiosTemporales.set(mapa);
        this.confirmarEliminarOpen.set(false);
        this.lanzarAlerta("Stock actualizado", "success");
        this.listarTodo();
      }
    });
  }

  guardarNuevoStock() {
    if (!this.modalNuevoStock.productoId) return;

    // Ajustado: enviamos "cantidad" en lugar de "cantidadInicial"
    const payload = {
      productoId: this.modalNuevoStock.productoId,
      sucursalId: Number(this.sucursalFiltradaActual()),
      cantidad: this.modalNuevoStock.cantidadInicial, // Renombrado aquí
      stockMinimo: this.modalNuevoStock.stockMinimo
    };

    this.stockService.funGuardar(payload).subscribe({
      next: () => {
        this.lanzarAlerta("Producto añadido con éxito", "success");
        this.isOpen.set(false);
        this.listarTodo();
      },
      error: (err) => {
        console.error("Error del servidor:", err);
        this.lanzarAlerta("Error al añadir producto: verifica que no esté duplicado", "error");
      }
    });
  }

  productosDisponiblesParaAsignar = computed(() => {
    const stockActual = this.productosStock();
    const todosLosProductos = this.productosGlobales();
    const sucursalId = Number(this.sucursalFiltradaActual());
    const busqueda = this.busquedaComboProducto().toLowerCase().trim();

    let disponibles = todosLosProductos.filter(p => 
      !stockActual.some(s => s.productoId === p.id && s.sucursalId === sucursalId)
    );

    if (busqueda) {
      disponibles = disponibles.filter(p => p.nombre.toLowerCase().includes(busqueda));
    }

    return disponibles;
  });
}