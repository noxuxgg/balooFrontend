export interface Pedido {
    fechaPedido: Date;
    fechaEntrega: Date;
    horaEntrega: string;
    cantidadPersonas: number;
    estado: boolean;
    estadoEntrega: number;
    estadoPago: number;
    lugarEntrega: string;
    total: number;
    adelanto: number;
    saldo: number;
    observaciones: string;
    cliente?: {
        id: number;
        nombre: string;
        apellido: string;
        telefono: string;
    };
    usuario?:{
        id: number;
        nombreUsuario: string;
    }
    sucursal?:{
        id: number;
        nombre: string;
        direccion: string;
        telefono: string;
    }
}
