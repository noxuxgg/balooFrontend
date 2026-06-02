import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { PagosPedidoService } from '../../core/services/pagos-pedido.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SucursalService } from '../../core/services/sucursales.service';
import { PedidoService } from '../../core/services/pedidos.service';
import { VentasService } from '../../core/services/ventas.service';
import { StockService } from '../../core/services/stock.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [ReactiveFormsModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class Reportes {
  pedidoService = inject(PedidoService);
  ventasService = inject(VentasService);
  sucursalService = inject(SucursalService);
  stockService = inject(StockService);

  private lineCanvas = viewChild<ElementRef<HTMLCanvasElement>>('lineChartCanvas');
  private barCanvas = viewChild<ElementRef<HTMLCanvasElement>>('barChartCanvas');
  private lineChartInstance?: Chart;
  private barChartInstance?: Chart;

  ventaMensual = signal<number>(0);
  ventasHoy = signal<number>(0);
  totalPedidos = signal<number>(0);
  alertasStock = signal<number>(0);
  sucursales = signal<any>([]);

  listaPedidos: any[] = [];
  listaVentas: any[] = [];
  listaStocks: any[] = [];

  filtrosForm = new FormGroup({
    sucursal: new FormControl('todas'),
    fechaInicio: new FormControl(this.obtenerPrimerDiaMes()),
    fechaFin: new FormControl(this.obtenerFechaHoy())
  });

  constructor() {
    this.cargarDatosIniciales();
    this.listarSucursales();

  }

  obtenerPrimerDiaMes(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    return `${anio}-${mes}-01`;
  }

  obtenerFechaHoy(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  listarSucursales() {
    this.sucursalService.funListar().subscribe(
      (res: any) => {
        this.sucursales.set(res)
      }
    )
  }

  cargarDatosIniciales() {
    this.pedidoService.funListarPedido().subscribe((pedidos: any) => {
      this.listaPedidos = pedidos;
      this.ventasService.funListar().subscribe((ventas: any) => {
        this.listaVentas = ventas;

        this.stockService.funListar().subscribe({
          next: (stocks: any) => {
            this.listaStocks = stocks;
            this.calcularReporte();
          },
          error: (err) => console.error('ERROR AL CARGAR STOCK:', err)
        });
      });
    });
  }

  calcularReporte() {
    const valores = this.filtrosForm.value;
    const hoyStr = valores.fechaFin ? valores.fechaFin.trim() : this.obtenerFechaHoy();

    let contadorPedidos = 0;
    let ingresosMensuales = 0;
    let ingresosHoy = 0;
    let contadorAlertas = 0;
    const sucursalFiltro = valores.sucursal;
    for (let p of this.listaPedidos) {
      let fechaP: string | null = null;

      if (p.fechaPedido) {
        const fechaTexto = String(p.fechaPedido).split('T')[0].trim();
        const d = new Date(fechaTexto.replace(/-/g, '\/'));
        if (!isNaN(d.getTime())) {
          const anio = d.getFullYear();
          const mes = String(d.getMonth() + 1).padStart(2, '0');
          const dia = String(d.getDate()).padStart(2, '0');
          fechaP = `${anio}-${mes}-${dia}`;
        }
      }

      let cumpleSucursal = sucursalFiltro === 'todas';
      if (!cumpleSucursal) {
        const idSucursalPedido = p.sucursal && typeof p.sucursal === 'object'
          ? p.sucursal.id
          : (p.sucursalId || p.sucursal);
        cumpleSucursal = Number(idSucursalPedido) === Number(sucursalFiltro);
      }

      const cumpleInicio = !valores.fechaInicio || !fechaP || fechaP >= valores.fechaInicio;
      const cumpleFin = !valores.fechaFin || !fechaP || fechaP <= valores.fechaFin;

      if (cumpleSucursal && cumpleInicio && cumpleFin) {
        contadorPedidos++;
        const totalPedido = Number(p.total) || 0;
        ingresosMensuales = ingresosMensuales + totalPedido;
      }

      if (cumpleSucursal && fechaP === hoyStr) {
        const totalPedido = Number(p.total) || 0;
        ingresosHoy = ingresosHoy + totalPedido;
      }
    }
    for (let v of this.listaVentas) {
      let fechaV: string | null = null;

      if (v.fecha) {
        const fechaTexto = String(v.fecha).split('T')[0].trim();
        const d = new Date(fechaTexto.replace(/-/g, '\/'));
        if (!isNaN(d.getTime())) {
          const anio = d.getFullYear();
          const mes = String(d.getMonth() + 1).padStart(2, '0');
          const dia = String(d.getDate()).padStart(2, '0');
          fechaV = `${anio}-${mes}-${dia}`;
        }
      }

      let cumpleSucursal = sucursalFiltro === 'todas';
      if (!cumpleSucursal) {
        const idSucursalVenta = v.sucursal && typeof v.sucursal === 'object'
          ? v.sucursal.id
          : (v.sucursalId || v.sucursal);

        if (idSucursalVenta === null || idSucursalVenta === undefined) {
          cumpleSucursal = true;
        } else {
          cumpleSucursal = Number(idSucursalVenta) === Number(sucursalFiltro);
        }
      }

      const cumpleInicio = !valores.fechaInicio || !fechaV || fechaV >= valores.fechaInicio;
      const cumpleFin = !valores.fechaFin || !fechaV || fechaV <= valores.fechaFin;

      if (cumpleSucursal && cumpleInicio && cumpleFin) {
        const totalVenta = Number(v.total) || 0;
        ingresosMensuales = ingresosMensuales + totalVenta;
      }

      if (cumpleSucursal && fechaV === hoyStr) {
        const totalVenta = Number(v.total) || 0;
        ingresosHoy = ingresosHoy + totalVenta;
      }
    }
    for (let s of this.listaStocks) {
      const idSucursalStock = s.sucursal && typeof s.sucursal === 'object'
        ? s.sucursal.id
        : (s.sucursal_id || s.sucursalId || s.sucursal);
      const cumpleSucursal = sucursalFiltro === 'todas' || Number(idSucursalStock) === Number(sucursalFiltro);
      if (cumpleSucursal) {
        const cantidad = Number(s.cantidad) || 0;
        const minimo = Number(s.stockMinimo) || 0;
        if (cantidad <= minimo) {
          contadorAlertas++;
        }
      }
    }
    this.totalPedidos.set(contadorPedidos);
    this.ventaMensual.set(ingresosMensuales);
    this.ventasHoy.set(ingresosHoy);
    this.alertasStock.set(contadorAlertas);
    this.renderizarGraficoTendencia(valores.sucursal, valores.fechaInicio, valores.fechaFin);
    this.renderizarGraficoComparativo(valores.fechaInicio, valores.fechaFin);
  }

  private renderizarGraficoTendencia(sucursalFiltro: any, inicio: any, fin: any) {
    const canvas = this.lineCanvas()?.nativeElement;
    if (!canvas) return;
    if (this.lineChartInstance) this.lineChartInstance.destroy();
    const mapaTendencia: { [fecha: string]: number } = {};

    const procesarElemento = (lista: any[], propiedadFecha: string) => {
      for (let item of lista) {
        if (!item[propiedadFecha]) continue;
        const fechaStr = String(item[propiedadFecha]).split('T')[0].trim();
        
        let cumpleSucursal = sucursalFiltro === 'todas';
        if (!cumpleSucursal) {
          const idSuc = item.sucursal && typeof item.sucursal === 'object' ? item.sucursal.id : (item.sucursalId || item.sucursal_id || item.sucursal);
          cumpleSucursal = Number(idSuc) === Number(sucursalFiltro);
        }
        const cumpleInicio = !inicio || fechaStr >= inicio;
        const cumpleFin = !fin || fechaStr <= fin;

        if (cumpleSucursal && cumpleInicio && cumpleFin) {
          const total = Number(item.total) || 0;
          mapaTendencia[fechaStr] = (mapaTendencia[fechaStr] || 0) + total;
        }
      }
    };

    procesarElemento(this.listaPedidos, 'fechaPedido');
    procesarElemento(this.listaVentas, 'fecha');
    const fechasOrdenadas = Object.keys(mapaTendencia).sort();
    const totalesOrdenados = fechasOrdenadas.map(f => mapaTendencia[f]);

    this.lineChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: fechasOrdenadas.length ? fechasOrdenadas : ['Sin datos'],
        datasets: [{
          label: 'Ingresos Totales (Bs.)',
          data: totalesOrdenados.length ? totalesOrdenados : [0],
          borderColor: '#013924',
          backgroundColor: 'rgba(1, 57, 36, 0.05)',
          tension: 0.2,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  private renderizarGraficoComparativo(inicio: any, fin: any) {
    const canvas = this.barCanvas()?.nativeElement;
    if (!canvas) return;
    if (this.barChartInstance) this.barChartInstance.destroy();
    const mapaSucursales: { [id: string]: number } = {};
    const procesarLista = (lista: any[], propiedadFecha: string) => {
      for (let item of lista) {
        if (!item[propiedadFecha]) continue;
        const fechaStr = String(item[propiedadFecha]).split('T')[0].trim();
        if ((inicio && fechaStr < inicio) || (fin && fechaStr > fin)) continue;

        const idSuc = item.sucursal && typeof item.sucursal === 'object' ? item.sucursal.id : (item.sucursalId || item.sucursal_id || item.sucursal);
        if (idSuc) {
          mapaSucursales[idSuc] = (mapaSucursales[idSuc] || 0) + (Number(item.total) || 0);
        }
      }
    };

    procesarLista(this.listaPedidos, 'fechaPedido');
    procesarLista(this.listaVentas, 'fecha');
    const nombresLabels: string[] = [];
    const valoresData: number[] = [];
    const listaSucursales = this.sucursales() || [];

    listaSucursales.forEach((suc: any) => {
      nombresLabels.push(suc.nombre);
      valoresData.push(mapaSucursales[suc.id] || 0);
    });

    this.barChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: nombresLabels.length ? nombresLabels : ['Sin sucursales'],
        datasets: [{
          label: 'Ventas de la Sucursal (Bs.)',
          data: valoresData.length ? valoresData : [0],
          backgroundColor: '#0E432F',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

}
