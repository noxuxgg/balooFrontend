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
  // Inyección de servicios
  productoService = inject(ProductoService);
  categoriaService = inject(CategoriaService);

  // Signals para las listas
  productos = signal<any>([]);
  categorias = signal<any>([]);
  
  isOpen = false;
  idProductoSeleccionado = "";

  // Formulario de Productos (Campos de tu DB: nombre, precio, categoriaId)
  productoForm = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    precio: new FormControl(0, [Validators.required, Validators.min(1)]),
    categoriaId: new FormControl('', [Validators.required])
  });

  // Formulario de Categorías (Integrado)
  categoriaForm = new FormGroup({
    nombre: new FormControl('', [Validators.required]),
    descripcion: new FormControl('', [Validators.required])
  });

  constructor() {
    this.listarTodo();
  }

  listarTodo() {
    this.productoService.funListarProductos().subscribe((res: any) => {
      this.productos.set(res);
    });
    this.categoriaService.funListar().subscribe((res: any) => {
      this.categorias.set(res);
    });
  }

  guardarProducto() {
    const datos = {
      nombre: this.productoForm.value.nombre || '',
      precio: Number(this.productoForm.value.precio) || 0,
      categoriaId: Number(this.productoForm.value.categoriaId) || 0
    };

    if (this.idProductoSeleccionado) {
      this.productoService.funEditarProducto(datos as any, Number(this.idProductoSeleccionado)).subscribe(() => {
        this.finalizarAccionProducto();
      });
    } else {
      this.productoService.funGuardarProducto(datos as any).subscribe(() => {
        this.finalizarAccionProducto();
      });
    }
  }

  finalizarAccionProducto() {
    this.listarTodo();
    this.productoForm.reset();
    this.idProductoSeleccionado = "";
    this.isOpen = false;
  }

  guardarCategoria() {
    const datos = {
      nombre: this.categoriaForm.value.nombre || '',
      descripcion: this.categoriaForm.value.descripcion || ''
    };

    this.categoriaService.funGuardar(datos).subscribe(() => {
      this.listarTodo(); // Actualiza el select de categorías inmediatamente
      this.categoriaForm.reset();
      alert('Categoría creada con éxito');
    });
  }

  mostrarProducto(datos: any) {
    this.productoForm.patchValue({
      nombre: datos.nombre,
      precio: datos.precio,
      categoriaId: datos.categoriaId
    });
    this.idProductoSeleccionado = datos.id;
    this.isOpen = true;
  }
}