export interface Producto {
    nombre: string;
    precio: number;
    categoriaId: number; // Relación con la tabla categorías
}