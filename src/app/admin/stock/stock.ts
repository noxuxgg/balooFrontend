import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { StockService } from '../../core/services/stock.service';
import { Sucursales } from '../../core/services/sucursales.service';
import { ProductoService } from '../../core/services/productos.service';

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

  // Signals de Datos Dinámicos
  productosStock = signal<any[]>([]);
  sucursales = signal<any[]>([]);
  productosGlobales = signal<any[]>([]); 
  
  // Guardado de variaciones numéricas temporales { [idStock]: +5 o -3 }
  cambiosTemporales = signal<{ [key: number]: number }>({});

  // Controles de Filtrado de la Tabla Principal
  sucursalControl = new FormControl('');
  buscadorControl = new FormControl('');
  sucursalFiltradaActual = signal<string>('');

  // Control de búsqueda interna para el Combo-Box del Modal
  busquedaComboProducto = signal<string>('');
  mostrarDropdownCombo = signal<boolean>(false);

  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = 5;

  // Estado del Modal de Confirmación (Tipado como 'any' para evitar errores TS2339)
  modalConfirmacion = signal<{ visible: boolean; registro: any; cantidad: number }>({
    visible: false,
    registro: null,
    cantidad: 0
  });

  // Estado del Modal Nuevo (Añadir Producto a Sucursal)
  modalNuevoStock = {
    visible: false,
    productoId: null as number | null,
    cantidadInicial: 1,
    stockMinimo: 5
  };

  constructor() {
    this.cargarDatosIniciales();
    
    // Al escribir en el buscador regresamos automáticamente a la página 1
    this.buscadorControl.valueChanges.subscribe(() => {
      this.paginaActual.set(1);
    });
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
  }

  // --- COMBO-BOX AUTOCOMPLETABLE SINTAXIS SEGURA (Evita caracteres especiales como 'ñ') ---
  productosDisponiblesParaAsignar = computed(() => {
    const sucursalId = Number(this.sucursalFiltradaActual());
    if (!sucursalId) return [];

    // IDs de productos que ya se encuentran registrados en esta sucursal
    const idsExistentes = this.productosStock()
      .filter(s => s.sucursalId === sucursalId)
      .map(s => s.productoId);

    // Filtrar del catálogo global lo que no está en la sucursal
    let disponibles = this.productosGlobales().filter(p => !idsExistentes.includes(p.id));

    // Filtrar por el texto que ingresa el usuario en el buscador del combo
    const criterio = this.busquedaComboProducto().toLowerCase().trim();
    if (criterio) {
      disponibles = disponibles.filter(p => p.nombre?.toLowerCase().includes(criterio));
    }

    return disponibles;
  });

  seleccionarProductoCombo(producto: any) {
    this.modalNuevoStock.productoId = producto.id;
    // Asignamos el nombre formateado directamente al input de búsqueda para que se mantenga escrito
    this.busquedaComboProducto.set(`${producto.nombre} - ${producto.precio} Bs`);
    this.mostrarDropdownCombo.set(false);
  }

  // --- LÓGICA FILTRADO, ORDENACIÓN Y BÚSQUEDA ---
  stockFiltrado = computed(() => {
    let listado = [...this.productosStock()];
    const query = (this.buscadorControl.value ?? '').toLowerCase().trim();
    const sucursalId = this.sucursalFiltradaActual();

    if (sucursalId) {
      listado = listado.filter(p => p.sucursalId === Number(sucursalId));
    }

    if (query) {
      listado = listado.filter(p => p.producto?.nombre?.toLowerCase().includes(query));
    }

    return listado.sort((a, b) => {
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

  // --- GESTIÓN DE MODALES ---
  abrirModalNuevoStock() {
    if (!this.sucursalFiltradaActual()) {
      alert("Selecciona una sucursal primero");
      return;
    }
    this.busquedaComboProducto.set(''); 
    this.modalNuevoStock.productoId = null;
    this.modalNuevoStock.visible = true;
  }

  cerrarModalNuevoStock() {
    this.modalNuevoStock = { visible: false, productoId: null, cantidadInicial: 1, stockMinimo: 5 };
    this.busquedaComboProducto.set('');
    this.mostrarDropdownCombo.set(false);
  }

  guardarNuevoStock() {
    if (!this.modalNuevoStock.productoId) return;

    const payload = {
      productoId: Number(this.modalNuevoStock.productoId),
      sucursalId: Number(this.sucursalFiltradaActual()),
      cantidad: Number(this.modalNuevoStock.cantidadInicial),
      stockMinimo: Number(this.modalNuevoStock.stockMinimo)
    };

    this.stockService.funGuardarStock(payload).subscribe({
      next: () => {
        this.cerrarModalNuevoStock();
        this.cargarDatosIniciales();
      }
    });
  }

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

    this.modalConfirmacion.set({
      visible: true,
      registro: registro,
      cantidad: cantidad
    });
  }

  cerrarModal() {
    this.modalConfirmacion.set({
      visible: false,
      registro: null,
      cantidad: 0
    });
  }

  procesarGuardadoStock() {
    const { registro, cantidad } = this.modalConfirmacion();
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
        this.cargarDatosIniciales(); 
      }
    });
  }
}