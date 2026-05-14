import { Component, inject, signal, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../core/services/productos.service';
import { CategoriaService } from '../../core/services/categorias.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './productos.html',
})
export class Productos implements OnInit {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);

  productos = signal<any[]>([]);
  categorias = signal<any[]>([]);
  
  isOpen = signal(false); // Modal principal
  confirmarEliminarOpen = signal(false); // Modal de advertencia
  mensajeAlerta = signal<string | null>(null);
  tipoAlerta = signal<'success' | 'error'>('success');
  idParaEliminar = signal<number | null>(null);
  tipoAEliminar = signal<'producto' | 'categoria'>('producto');

  buscadorControl = new FormControl('');
  
  nuevoProducto = { id: 0, nombre: '', precio: 0, categoriaId: 0 };
  nuevaCategoria = { id: 0, nombre: '', descripcion: '' };

  constructor() {}

  ngOnInit() {
    this.cargarTodo();
  }

  cargarTodo() {
    this.productoService.funListar().subscribe((res: any) => this.productos.set(res));
    this.categoriaService.funListar().subscribe((res: any) => this.categorias.set(res));
  }

  lanzarAlerta(msj: string, tipo: 'success' | 'error' = 'success') {
    this.mensajeAlerta.set(msj);
    this.tipoAlerta.set(tipo);
    setTimeout(() => this.mensajeAlerta.set(null), 3000);
  }

  abrirModalProducto(prod: any = null) {
    if (prod) {
      this.nuevoProducto = { ...prod, categoriaId: Number(prod.categoriaId) };
    } else {
      this.nuevoProducto = { id: 0, nombre: '', precio: 0, categoriaId: 0 };
    }
    this.isOpen.set(true);
  }

  guardarProducto() {
    const data = { 
      nombre: this.nuevoProducto.nombre,
      precio: Number(this.nuevoProducto.precio),
      categoriaId: Number(this.nuevoProducto.categoriaId)
    };
    
    const idActual = this.nuevoProducto.id;

    if (idActual && idActual !== 0) {
      this.productoService.funEditar(data, idActual).subscribe({
        next: () => { 
          this.lanzarAlerta('¡Producto actualizado con éxito!'); 
          this.finalizar(); 
        },
        error: (err) => {
          console.error('Error al editar:', err);
          this.lanzarAlerta('Error al intentar actualizar el producto', 'error');
        }
      });
    } else {
      this.productoService.funGuardar(data).subscribe({
        next: () => { 
          this.lanzarAlerta('¡Producto creado con éxito!'); 
          this.finalizar(); 
        },
        error: (err) => {
          console.error('Error al guardar:', err);
          this.lanzarAlerta('No se pudo crear el producto', 'error');
        }
      });
    }
  }

  guardarCategoria() {
    const obs = this.nuevaCategoria.id && this.nuevaCategoria.id !== 0
      ? this.categoriaService.funEditar(this.nuevaCategoria, this.nuevaCategoria.id)
      : this.categoriaService.funGuardar(this.nuevaCategoria);

    obs.subscribe({
      next: () => {
        this.lanzarAlerta('Categoría procesada');
        this.nuevaCategoria = { id: 0, nombre: '', descripcion: '' };
        this.cargarTodo();
      },
      error: () => this.lanzarAlerta('Error en categoría', 'error')
    });
  }

  prepararEliminacion(id: number, tipo: 'producto' | 'categoria' = 'producto') {
    this.idParaEliminar.set(id);
    this.tipoAEliminar.set(tipo);
    this.confirmarEliminarOpen.set(true);
  }

  ejecutarEliminacion() {
    const id = this.idParaEliminar();
    const tipo = this.tipoAEliminar();

    if (id) {
      if (tipo === 'producto') {
        this.productoService.funEliminar(id).subscribe({
          next: () => {
            this.lanzarAlerta('Producto eliminado');
            this.finalizarEliminacion();
          },
          error: () => this.lanzarAlerta('Error al eliminar producto', 'error')
        });
      } else {
        this.categoriaService.funEliminar(id).subscribe({
          next: () => {
            this.lanzarAlerta('Categoría eliminada');
            this.finalizarEliminacion();
          },
          error: () => this.lanzarAlerta('Error al eliminar categoría', 'error')
        });
      }
    }
  }

  private finalizarEliminacion() {
    this.cargarTodo();
    this.confirmarEliminarOpen.set(false);
    this.idParaEliminar.set(null);
  }

  esFormularioValido(): boolean {
    return (
      this.nuevoProducto.nombre.length >= 3 && 
      this.nuevoProducto.precio > 0 && 
      this.nuevoProducto.categoriaId !== 0
    );
  }

  private finalizar() {
    this.cargarTodo();
    this.isOpen.set(false);
  }
}