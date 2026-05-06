export interface PagoPedido {
    metodo: string;
    monto: number;
    fecha: Date;
    pedido?: {
        id: number;
    };
}
