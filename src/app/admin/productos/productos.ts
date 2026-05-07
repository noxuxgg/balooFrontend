import { Component, inject, signal, computed } from '@angular/core';
import { ProductoService } from '../../core/services/productos.service';
import { CategoriaService } from '../../core/services/categorias.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe],
  templateUrl: './productos.html',
})
export class Productos {
  soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  productoService = inject(ProductoService);
  categoriaService = inject(CategoriaService);

  productos = signal<any>([]);
  categorias = signal<any>([]);
  
  isOpen = false;
  idProductoSeleccionado = "";
  idCategoriaSeleccionada = "";

  // Paginación de Productos
  paginaActualProd = signal(1);
  itemsPorPagina = 5;
  
  // Paginación de Categorías
  paginaActualCat = signal(1);
  itemsPorPaginaCat = 3;

  // --- ESTADO DEL MODAL DE ALERTA/CONFIRMACIÓN ---
  confirmModal = signal<{
    show: boolean;
    titulo: string;
    mensaje: string;
    accion: (() => void) | null;
    esAlerta: boolean; // true para solo "Aceptar", false para "Sí/No"
  }>({
    show: false,
    titulo: '',
    mensaje: '',
    accion: null,
    esAlerta: false
  });

  // Formulario Producto
  productoForm = new FormGroup({
    nombre: new FormControl('', [
      Validators.required, 
      Validators.pattern(this.soloLetras)
    ]),
    precio: new FormControl<number | null>(null, [Validators.required, Validators.min(0.1)]),
    categoriaId: new FormControl('', [Validators.required])
  });

  categoriaForm = new FormGroup({
    nombre: new FormControl('', [
      Validators.required, 
      Validators.pattern(this.soloLetras)
    ]),
    descripcion: new FormControl('') 
  });

  constructor() { this.listarTodo(); }

  listarTodo() {
    this.productoService.funListarProductos().subscribe((res: any) => this.productos.set(res));
    this.categoriaService.funListar().subscribe((res: any) => this.categorias.set(res));
  }

  // --- LÓGICA DE PAGINACIÓN FRONTEND ---
  productosPaginados = computed(() => {
    const inicio = (this.paginaActualProd() - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.productos().slice(inicio, fin);
  });

  categoriasPaginadas = computed(() => {
    const inicio = (this.paginaActualCat() - 1) * this.itemsPorPaginaCat;
    const fin = inicio + this.itemsPorPaginaCat;
    return this.categorias().slice(inicio, fin);
  });

  totalPaginasProd = computed(() => Math.ceil(this.productos().length / this.itemsPorPagina));
  totalPaginasCat = computed(() => Math.ceil(this.categorias().length / this.itemsPorPaginaCat));

  // --- REEMPLAZO DE ALERTS (ABRIR MODAL) ---
  mostrarAlerta(titulo: string, mensaje: string) {
    this.confirmModal.set({
      show: true,
      titulo,
      mensaje,
      accion: null,
      esAlerta: true
    });
  }

  mostrarConfirmacion(titulo: string, mensaje: string, accion: () => void) {
    this.confirmModal.set({
      show: true,
      titulo,
      mensaje,
      accion,
      esAlerta: false
    });
  }

  cerrarConfirmModal() {
    this.confirmModal.update(state => ({ ...state, show: false }));
  }

  ejecutarAccionConfirm() {
    const accion = this.confirmModal().accion;
    if (accion) accion();
    this.cerrarConfirmModal();
  }

  // --- MÉTODOS PRODUCTOS ---
  guardarProducto() {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      this.mostrarAlerta('Campos Incompletos', 'Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    const formValues = this.productoForm.value;
    const datosEnvio = {
      nombre: formValues.nombre ?? '',
      precio: Number(formValues.precio),
      categoriaId: Number(formValues.categoriaId) 
    };

    if (this.idProductoSeleccionado) {
      this.productoService.funEditarProducto(datosEnvio, Number(this.idProductoSeleccionado))
        .subscribe({
          next: () => this.resetProd(),
          error: (err) => console.error('Error al editar:', err)
        });
    } else {
      this.productoService.funGuardarProducto(datosEnvio)
        .subscribe({
          next: () => this.resetProd(),
          error: (err) => {
            this.mostrarAlerta('Error', 'Hubo un error al guardar el producto. Revisa la consola.');
            console.error('Error al guardar:', err);
          }
        });
    }
  }

  eliminarProducto(id: number) {
    this.mostrarConfirmacion(
      '¿Estás seguro?', 
      'Esta acción eliminará el producto permanentemente.', 
      () => {
        this.productoService.funEliminarProducto(id).subscribe(() => this.listarTodo());
      }
    );
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

  resetProd() { 
    this.listarTodo(); 
    this.productoForm.reset(); 
    this.idProductoSeleccionado = ""; 
    this.isOpen = false; 
    this.paginaActualProd.set(1);
  }

  // --- MÉTODOS CATEGORÍAS ---
  guardarCategoria() {
    if (this.categoriaForm.invalid) {
      this.categoriaForm.markAllAsTouched();
      this.mostrarAlerta('Atención', 'El nombre de la categoría es obligatorio y no debe tener números.');
      return;
    }

    const datos = this.categoriaForm.value;
    if (this.idCategoriaSeleccionada) {
      this.categoriaService.funEditar(datos as any, Number(this.idCategoriaSeleccionada)).subscribe(() => this.resetCat());
    } else {
      this.categoriaService.funGuardar(datos as any).subscribe(() => this.resetCat());
    }
  }

  eliminarCategoria(id: number) {
    this.mostrarConfirmacion(
      '¿Estás seguro?', 
      'Esta acción eliminará la categoría permanentemente.', 
      () => {
        this.categoriaService.funEliminar(id).subscribe(() => this.listarTodo());
      }
    );
  }

  mostrarCategoria(cat: any) {
    this.idCategoriaSeleccionada = cat.id;
    this.categoriaForm.patchValue({
      nombre: cat.nombre,
      descripcion: cat.descripcion
    });
  }

  resetCat() { 
    this.listarTodo(); 
    this.categoriaForm.reset(); 
    this.idCategoriaSeleccionada = ""; 
    this.paginaActualCat.set(1);
  }
}