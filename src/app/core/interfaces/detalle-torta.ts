export interface DetalleTorta {
    sabor: string;
    color: string;
    textoTorta: string;
    decoracion: string;
    forma: string;
    pedido?: {
        id: number;
    };
}
