import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { StockService } from '../../core/services/stock.service';
import { Sucursales } from '../../core/services/sucursales.service';
import { ProductoService } from '../../core/services/productos.service';
import { CategoriaService } from '../../core/services/categorias.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './stock.html',
})
export class Stock {
  private stockService = inject(StockService);
  private sucursalService = inject(Sucursales);
  private productosService = inject(ProductoService);
  private categoriasService = inject(CategoriaService);

  // Signals de Datos Dinámicos
  productosStock = signal<any[]>([]);
  sucursales = signal<any[]>([]);
  productosGlobales = signal<any[]>([]); 
  categorias = signal<any[]>([]); 
  
  // Guardado de variaciones numéricas temporales { [idStock]: +5 o -3 }
  cambiosTemporales = signal<{ [key: number]: number }>({});

  // Controles de Filtrado Principal
  sucursalControl = new FormControl('');
  buscadorControl = new FormControl('');
  
  // Almacena el término confirmado tras pulsar "Buscar"
  terminoBusquedaActivo = signal<string>('');
  mostrarSugerenciasPrincipal = signal<boolean>(false);
  sucursalFiltradaActual = signal<string>('');

  // Control de búsqueda interna para el Combo-Box del Modal
  busquedaComboProducto = signal<string>('');
  productoSeleccionadoNombre = signal<string>('');
  mostrarDropdownCombo = signal<boolean>(false);

  // Control de Alertas Embebidas
  mensajeAlerta = signal<string | null>(null);
  tipoAlerta = signal<'success' | 'error'>('error');

  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = 5;

  // Estado del Modal de Confirmación (Ajuste de Stock)
  modalConfirmacion = {
    visible: false,
    registro: null as any,
    cantidad: 0 as number | null
  };

  // Estado del Modal Nuevo (Añadir Producto a Sucursal)
  modalNuevoStock = {
    visible: false,
    productoId: null as number | null,
    cantidadInicial: 1,
    stockMinimo: 5
  };

  constructor() {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    this.stockService.findAll().subscribe((res: any) => {
      this.productosStock.set(res);
    });
    
    this.sucursalService.funListar().subscribe((res: any) => {
      this.sucursales.set(res);
    });

    this.productosService.funListarProductos().subscribe((res: any) => {
      this.productosGlobales.set(res);
    });

    this.categoriasService.funListar().subscribe((res: any) => {
      this.categorias.set(res);
    });
  }

  obtenerNombreCategoria(categoriaId: number | undefined): string {
    if (!categoriaId) return 'Sin categoría';
    const cat = this.categorias().find(c => c.id === categoriaId);
    return cat ? cat.nombre : 'Sin categoría';
  }

  lanzarAlerta(mensaje: string, tipo: 'success' | 'error' = 'error') {
    this.mensajeAlerta.set(mensaje);
    this.tipoAlerta.set(tipo);
    setTimeout(() => this.mensajeAlerta.set(null), 4000);
  }

  // --- SUGERENCIAS EN TIEMPO REAL PARA EL BUSCADOR PRINCIPAL ---
  sugerenciasBuscadorPrincipal = computed(() => {
    const query = (this.buscadorControl.value ?? '').toLowerCase().trim();
    if (!query) return [];
    
    // Retorna coincidencias basadas en los productos del stock actual
    return this.productosStock()
      .filter(p => p.producto?.nombre?.toLowerCase().includes(query))
      .map(p => p.producto?.nombre)
      .filter((value, index, self) => self.indexOf(value) === index) // Remover duplicados
      .slice(0, 5); // Limitar a 5 sugerencias
  });

  // --- EJECUTAR BÚSQUEDA EXPLICITA (AL PULSAR EL BOTÓN) ---
  ejecutarBusquedaPrincipal() {
    const query = (this.buscadorControl.value ?? '').toLowerCase().trim();
    this.terminoBusquedaActivo.set(query);
    this.mostrarSugerenciasPrincipal.set(false);
    this.paginaActual.set(1);

    if (query) {
      // 1. Verificar si el producto existe globalmente
      const existeGlobalmente = this.productosGlobales().some(p => p.nombre?.toLowerCase().includes(query));
      
      // 2. Verificar si existe en el stock filtrado de la sucursal actual
      const sucursalId = this.sucursalFiltradaActual();
      let listadoSucursal = this.productosStock();
      if (sucursalId) {
        listadoSucursal = listadoSucursal.filter(p => p.sucursalId === Number(sucursalId));
      }
      
      const registroEnStock = listadoSucursal.find(p => p.producto?.nombre?.toLowerCase().includes(query));

      if (!existeGlobalmente) {
        this.lanzarAlerta(`El producto "${this.buscadorControl.value}" no existe en el catálogo general.`, 'error');
      } else if (!registroEnStock) {
        this.lanzarAlerta(`El producto existe pero no está asignado a la sucursal seleccionada.`, 'error');
      } else if (registroEnStock.cantidad === 0) {
        this.lanzarAlerta(`Advertencia: El producto "${registroEnStock.producto?.nombre}" no tiene unidades disponibles (Stock 0).`, 'error');
      }
    }
  }

  seleccionarSugerenciaPrincipal(nombre: string) {
    this.buscadorControl.setValue(nombre);
    this.ejecutarBusquedaPrincipal();
  }

  limpiarBuscadorPrincipal() {
    this.buscadorControl.setValue('');
    this.terminoBusquedaActivo.set('');
    this.mostrarSugerenciasPrincipal.set(false);
    this.paginaActual.set(1);
  }

  // --- LÓGICA DEL COMBO-BOX DEL MODAL ---
  productosDisponiblesParaAsignar = computed(() => {
    const sucursalId = Number(this.sucursalFiltradaActual());
    if (!sucursalId) return [];

    const idsExistentes = this.productosStock()
      .filter(s => s.sucursalId === sucursalId)
      .map(s => s.productoId);

    let disponibles = this.productosGlobales().filter(p => !idsExistentes.includes(p.id));

    const criterio = this.busquedaComboProducto().toLowerCase().trim();
    if (criterio) {
      disponibles = disponibles.filter(p => p.nombre?.toLowerCase().includes(criterio));
    }

    return disponibles;
  });

  seleccionarProductoCombo(producto: any) {
    this.modalNuevoStock.productoId = producto.id;
    this.productoSeleccionadoNombre.set(`${producto.nombre} - ${producto.precio} Bs`);
    this.mostrarDropdownCombo.set(false);
    this.busquedaComboProducto.set(producto.nombre); 
  }

  // --- FILTRADO, ORDENACIÓN Y ORDEN DE PRIORIDAD EN LA TABLA ---
  stockFiltrado = computed(() => {
    let listado = [...this.productosStock()];
    const query = this.terminoBusquedaActivo();
    const sucursalId = this.sucursalFiltradaActual();

    if (sucursalId) {
      listado = listado.filter(p => p.sucursalId === Number(sucursalId));
    }

    // Clasificación y Ordenación Avanzada
    return listado.sort((a, b) => {
      const nombreA = (a.producto?.nombre ?? '').toLowerCase();
      const nombreB = (b.producto?.nombre ?? '').toLowerCase();

      if (query) {
        const coincideA = nombreA.includes(query);
        const coincideB = nombreB.includes(query);

        // Si uno coincide con la búsqueda y el otro no, va primero el coincidente (Pin to top)
        if (coincideA && !coincideB) return -1;
        if (!coincideA && coincideB) return 1;
      }

      // Ordenación secundaria por defecto (Stock cero al final, mayores cantidades arriba)
      if (a.cantidad === 0 && b.cantidad > 0) return 1; 
      if (a.cantidad > 0 && b.cantidad === 0) return -1; 
      return b.cantidad - a.cantidad; 
    });
  });

  // --- PAGINACIÓN ---
  stockPaginado = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.stockFiltrado().slice(inicio, fin);
  });

  totalPaginas = computed(() => Math.ceil(this.stockFiltrado().length / this.itemsPorPagina));

  // --- GESTIÓN DE MODALES NUEVOS ---
  abrirModalNuevoStock() {
    if (!this.sucursalFiltradaActual()) {
      this.lanzarAlerta("Por favor, selecciona y aplica una sucursal primero antes de añadir productos.");
      return;
    }
    this.modalNuevoStock.visible = true;
    this.productoSeleccionadoNombre.set('');
    this.busquedaComboProducto.set('');
    this.mostrarDropdownCombo.set(false);
  }

  cerrarModalNuevoStock() {
    this.modalNuevoStock = { visible: false, productoId: null, cantidadInicial: 1, stockMinimo: 5 };
    this.productoSeleccionadoNombre.set('');
    this.busquedaComboProducto.set('');
  }

  guardarNuevoStock() {
    if (!this.modalNuevoStock.productoId) {
      this.lanzarAlerta("Debes seleccionar un producto válido usando el buscador del combo.");
      return;
    }

    const payload = {
      productoId: Number(this.modalNuevoStock.productoId),
      sucursalId: Number(this.sucursalFiltradaActual()),
      cantidad: Number(this.modalNuevoStock.cantidadInicial),
      stockMinimo: Number(this.modalNuevoStock.stockMinimo)
    };

    this.stockService.funGuardarStock(payload).subscribe({
      next: () => {
        this.lanzarAlerta("Producto asignado correctamente al inventario.", "success");
        this.cerrarModalNuevoStock();
        this.cargarDatosIniciales();
      },
      error: () => {
        this.lanzarAlerta("Ocurrió un error al intentar guardar el registro.");
      }
    });
  }

  // --- GESTIÓN DE CANTIDADES EXISTENTES ---
  modificarCambioTemporal(id: number, valor: number) {
    const mapaActual = { ...this.cambiosTemporales() };
    const variacionActual = mapaActual[id] || 0;
    
    const registro = this.productosStock().find(p => p.id === id);
    if (!registro) return;

    const nuevaVariacion = variacionActual + valor;
    if (registro.cantidad + nuevaVariacion < 0) return;

    if (nuevaVariacion === 0) {
      delete mapaActual[id]; 
    } else {
      mapaActual[id] = nuevaVariacion;
    }

    this.cambiosTemporales.set(mapaActual);
  }

  aplicarFiltroSucursal() {
    this.sucursalFiltradaActual.set(this.sucursalControl.value ?? '');
    this.paginaActual.set(1); 
  }

  solicitarConfirmacion(registro: any) {
    const cantidad = this.cambiosTemporales()[registro.id] || 0;
    if (cantidad === 0) return;

    this.modalConfirmacion = {
      visible: true,
      registro: registro,
      cantidad: cantidad
    };
  }

  cerrarModal() {
    this.modalConfirmacion = { visible: false, registro: null, cantidad: 0 };
  }

  procesarGuardadoStock() {
    const { registro, cantidad } = this.modalConfirmacion;
    if (!registro || !cantidad) return;

    const payload = {
      productoId: Number(registro.productoId),
      sucursalId: Number(registro.sucursalId),
      cantidadModificada: Number(cantidad)
    };

    this.stockService.actualizarUnidades(payload).subscribe({
      next: () => {
        const mapaActual = { ...this.cambiosTemporales() };
        delete mapaActual[registro.id];
        this.cambiosTemporales.set(mapaActual);
        this.cerrarModal();
        this.lanzarAlerta("El stock se actualizó exitosamente.", "success");
        this.cargarDatosIniciales(); 
      },
      error: () => {
        this.cerrarModal();
        this.lanzarAlerta("Error al procesar la actualización del stock.");
      }
    });
  }

  obtenerValorAbsoluto(valor: number | null): number {
    return valor ? Math.abs(valor) : 0;
  }
}