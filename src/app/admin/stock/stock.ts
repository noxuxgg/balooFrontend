import { Component, inject, signal, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { StockService } from '../../core/services/stock.service';
import { Sucursales } from '../../core/services/sucursales.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './stock.html',
})
export class Stock {
  private stockService = inject(StockService);
  private sucursalService = inject(Sucursales);

  // Signals de Datos Dinámicos
  productosStock = signal<any[]>([]);
  sucursales = signal<any[]>([]);
  
  // Guardado de variaciones numéricas en pantalla por cada registro de stock { [stockId]: +5 o -3 }
  // Cambiado a 'number' para coincidir con el id numérico de tu base de datos
  cambiosTemporales = signal<{ [key: number]: number }>({});

  // Controles de Filtrado
  sucursalControl = new FormControl('');
  buscadorControl = new FormControl('');
  sucursalFiltradaActual = signal<string>('');

  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = 5;

  // Estado del Modal de Confirmación Estilizado
  modalConfirmacion = {
    visible: false,
    registro: null as any,
    cantidad: 0 as number | null
  };

  constructor() {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    // Apuntamos a los métodos de tus servicios. Asegúrate de que funListarStock() y funListarSucursales() existan en ellos.
    this.stockService.funListarStock().subscribe((res: any) => this.productosStock.set(res));
    this.sucursalService.funListarSucursales().subscribe((res: any) => this.sucursales.set(res));
  }

  // --- LÓGICA FILTRADO, ORDENACIÓN Y BÚSQUEDA ---
  stockFiltrado = computed(() => {
    let listado = [...this.productosStock()];
    const query = (this.buscadorControl.value ?? '').toLowerCase().trim();
    const sucursalId = this.sucursalFiltradaActual();

    // 1. Filtrar por sucursal seleccionada (si aplica)
    if (sucursalId) {
      listado = listado.filter(p => p.sucursalId === Number(sucursalId));
    }

    // 2. Filtrar por término de búsqueda (Accediendo a la relación p.producto.nombre)
    if (query) {
      listado = listado.filter(p => p.producto?.nombre?.toLowerCase().includes(query));
    }

    // 3. ORDENACIÓN ADRIANA: Mayor a menor cantidad, mandando las filas con cantidad 0 al fondo
    return listado.sort((a, b) => {
      if (a.cantidad === 0 && b.cantidad > 0) return 1;   // 'a' se va abajo
      if (a.cantidad > 0 && b.cantidad === 0) return -1;  // 'b' se va abajo
      return b.cantidad - a.cantidad;                     // Orden descendente por cantidad de unidades
    });
  });

  // --- PAGINACIÓN ---
  stockPaginado = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.stockFiltrado().slice(inicio, fin);
  });

  totalPaginas = computed(() => Math.ceil(this.stockFiltrado().length / this.itemsPorPagina));

  // --- MANEJO DE CAMBIOS DE STOCK EN CLIENTE ---
  modificarCambioTemporal(id: number, valor: number) {
    const mapaActual = { ...this.cambiosTemporales() };
    const variacionActual = mapaActual[id] || 0;
    
    // Buscar el registro original en base al id de la tabla Stock
    const registro = this.productosStock().find(p => p.id === id);
    if (!registro) return;

    const nuevaVariacion = variacionActual + valor;

    // Validación preventiva usando la columna real 'cantidad' de la BD
    if (registro.cantidad + nuevaVariacion < 0) return;

    if (nuevaVariacion === 0) {
      delete mapaActual[id]; // Si vuelve a cero, limpiamos la propiedad del mapa
    } else {
      mapaActual[id] = nuevaVariacion;
    }

    this.cambiosTemporales.set(mapaActual);
  }

  aplicarFiltroSucursal() {
    this.sucursalFiltradaActual.set(this.sucursalControl.value ?? '');
    this.paginaActual.set(1); // Resetear a la primera página tras filtrar
  }

  // --- MODAL DE CONFIRMACIÓN ---
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
    this.modalConfirmacion = {
      visible: false,
      registro: null,
      cantidad: 0
    };
  }

  procesarGuardadoStock() {
    const { registro, cantidad } = this.modalConfirmacion;
    if (!registro || !cantidad) return;

    // Estructuramos el payload mapeando los IDs numéricos requeridos por tu StockController
    const payload = {
      productoId: Number(registro.productoId),
      sucursalId: Number(registro.sucursalId),
      cantidadModificada: Number(cantidad)
    };

    // Llamada al método que maneja el endpoint de parches algebraicos: /stock/actualizar-unidades
    this.stockService.funActualizarUnidades(payload).subscribe({
      next: () => {
        // Limpiar el contador local de este registro de stock
        const mapaActual = { ...this.cambiosTemporales() };
        delete mapaActual[registro.id];
        this.cambiosTemporales.set(mapaActual);

        this.cerrarModal();
        this.cargarDatosIniciales(); // Recargar la tabla con los datos frescos del backend
      },
      error: (err) => {
        console.error('Error al actualizar las unidades de stock:', err);
        this.cerrarModal();
      }
    });
  }

  obtenerValorAbsoluto(valor: number | null): number {
    return valor ? Math.abs(valor) : 0;
  }
}