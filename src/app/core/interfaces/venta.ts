export interface DetalleVenta {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  producto?: { id: number; nombre: string; precio: number };
}

export interface Pago {
  metodo: string;
  monto: number;
}

export interface Venta {
  id?: number;
  fecha?: string;
  total?: number;
  usuarioId?: string;
  sucursalId?: number;
  detalles?: DetalleVenta[];
  pagos?: Pago[];
}