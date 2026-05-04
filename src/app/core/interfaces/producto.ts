export interface Producto {
  nombre: string;
  precio: number;
  categoriaId: number;
  categoria?: {
    id: number;
    nombre: string;
  };
}