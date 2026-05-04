import { Component, inject, signal } from '@angular/core';
import { ProductoService } from '../../core/services/productos.service';
import { CategoriaService } from '../../core/services/categorias.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './productos.html',
})
export class Productos {
  productoService = inject(ProductoService);
  categoriaService = inject(CategoriaService);

  productos = signal<any>([]);
  categorias = signal<any>([]);
  
  isOpen = false;
  idProductoSeleccionado = "";
  idCategoriaSeleccionada = "";

  // Solo los datos que el usuario llena
  productoForm = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    precio: new FormControl(0, [Validators.required, Validators.min(1)]),
    categoriaId: new FormControl('', [Validators.required])
  });

  categoriaForm = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    descripcion: new FormControl('', [Validators.required])
  });

  constructor() { this.listarTodo(); }

  listarTodo() {
    this.productoService.funListarProductos().subscribe((res: any) => this.productos.set(res));
    this.categoriaService.funListar().subscribe((res: any) => this.categorias.set(res));
  }

  guardarProducto() {
    const datos = this.productoForm.value;
    if (this.idProductoSeleccionado) {
      this.productoService.funEditarProducto(datos as any, Number(this.idProductoSeleccionado)).subscribe(() => this.resetProd());
    } else {
      this.productoService.funGuardarProducto(datos as any).subscribe(() => this.resetProd());
    }
  }

  eliminarProducto(id: number) {
    if (confirm('¿Eliminar producto?')) this.productoService.funEliminarProducto(id).subscribe(() => this.listarTodo());
  }

  mostrarProducto(datos: any) {
    this.idProductoSeleccionado = datos.id;
    this.productoForm.patchValue({
      nombre: datos.nombre,
      precio: datos.precio,
      categoriaId: datos.categoriaId
    });
    this.isOpen = true;
  }

  resetProd() { this.listarTodo(); this.productoForm.reset(); this.idProductoSeleccionado = ""; this.isOpen = false; }

  guardarCategoria() {
    const datos = this.categoriaForm.value;
    if (this.idCategoriaSeleccionada) {
      this.categoriaService.funEditar(datos as any, Number(this.idCategoriaSeleccionada)).subscribe(() => this.resetCat());
    } else {
      this.categoriaService.funGuardar(datos as any).subscribe(() => this.resetCat());
    }
  }

  eliminarCategoria(id: number) {
    if (confirm('¿Eliminar categoría?')) this.categoriaService.funEliminar(id).subscribe(() => this.listarTodo());
  }

  mostrarCategoria(cat: any) {
    this.idCategoriaSeleccionada = cat.id;
    this.categoriaForm.patchValue({
      nombre: cat.nombre,
      descripcion: cat.descripcion
    });
  }

  resetCat() { this.listarTodo(); this.categoriaForm.reset(); this.idCategoriaSeleccionada = ""; }
}