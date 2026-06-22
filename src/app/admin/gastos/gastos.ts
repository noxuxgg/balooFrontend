import { Component, inject, signal } from '@angular/core';
import { GastosService } from '../../core/services/gastos.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SucursalService } from '../../core/services/sucursales.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './gastos.html',
  styleUrl: './gastos.scss',
})
export class Gastos {
  gastosService = inject(GastosService);
  sucursalService = inject(SucursalService);
  authService = inject(AuthService);

  gastos = signal<any>([]);
  gastoSolo = signal<any>([]);
  sucursales = signal<any>([]);
  isOpen = signal(false);
  confirmarEliminarOpen = signal(false);
  
  idGastoSeleccionado: number | null = null;
  private idParaEliminar: number | null = null;
  errorServidor = signal('');

  gastoForm = new FormGroup({
    usuarioId: new FormControl({ value: '', disabled: true }), 
    nombreUsuario: new FormControl({ value: '', disabled: true }),
    monto: new FormControl('', [Validators.required, Validators.min(0.01)]),
    motivo: new FormControl('', [Validators.required, Validators.pattern(/^\S.*$/)]),
    persona_recibe: new FormControl('', [Validators.required, Validators.pattern(/^\S.*$/)]),
    sucursal_id: new FormControl(null)
  });

  constructor() {
    this.listar();
    this.listarSucursal();
    this.cargarUsuarioDeSesion();
  }

  cargarUsuarioDeSesion() {
    this.authService.funGetPerfil().subscribe({
      next: (perfil: any) => {
        const idReal = perfil?.id || perfil?._id || '';
        const nombreReal = perfil?.nombreUsuario || perfil?.username || 'Usuario Activo';

        this.gastoForm.patchValue({
          usuarioId: idReal,
          nombreUsuario: nombreReal
        });
      },
      error: (err) => {
        console.error('Error al capturar el perfil:', err);
        this.errorServidor.set('No se pudo precargar el usuario de la sesión.');
      }
    });
  }

  listar() {
    this.gastosService.funListar().subscribe(
      (res: any) => {
        this.gastos.set(res);
      }
    )
  }

  listarSucursal() {
    this.sucursalService.funListar().subscribe(
      (res: any) => {
        this.sucursales.set(res);
        if (res && res.length > 0) {
          this.gastoForm.patchValue({
            sucursal_id: res[0].id
          });
        }
      }
    )
  }

  listarUnoForm(id: number) {
    this.idGastoSeleccionado = id;
    this.gastosService.funListarUno(id).subscribe(
      (res: any) => {
        this.gastoSolo.set(res);
        this.gastoForm.patchValue({
          monto: res.monto,
          motivo: res.motivo,
          persona_recibe: res.personaRecibe, 
          sucursal_id: res.sucursalId || res.sucursal_id || null
        });
      }
    );
  }

  guardarGasto() {
    if (this.gastoForm.invalid) return;

    const idUsuarioCapturado = this.gastoForm.getRawValue().usuarioId;

    if (!idUsuarioCapturado) {
      this.errorServidor.set('Error: El formulario no ha capturado ningún ID de usuario.');
      return;
    }

    const fechaAutomatica = new Date().toISOString();

    const gastoDato: any = {
      fecha: fechaAutomatica,
      monto: Number(this.gastoForm.value.monto),
      motivo: this.gastoForm.value.motivo,
      personaRecibe: this.gastoForm.value.persona_recibe,
      usuarioId: String(idUsuarioCapturado),
      sucursalId: Number(this.gastoForm.value.sucursal_id)
    };

    console.log('JSON Definitivo enviado al Servidor:', gastoDato);

    if (this.idGastoSeleccionado) {
      this.gastosService.funEditar(gastoDato, this.idGastoSeleccionado).subscribe({
        next: () => this.finalizarOperacion(),
        error: (err) => this.manejarError(err)
      });
    } else {
      this.gastosService.funGuardar(gastoDato).subscribe({
        next: () => this.finalizarOperacion(),
        error: (err) => this.manejarError(err)
      });
    }
  }

  private manejarError(err: any) {
    this.errorServidor.set(err.error?.message || 'Error desconocido');
    setTimeout(() => this.errorServidor.set(''), 10000);
  }

  finalizarOperacion() {
    this.listar();
    this.cerrarModal();
  }

  eliminarGasto() {
    if (this.idParaEliminar !== null) {
      this.gastosService.funEliminar(this.idParaEliminar).subscribe({
        next: () => {
          this.listar();
          this.cerrarConfirmacion();
        },
        error: (err) => console.error('Error al eliminar:', err)
      });
    }
  }

  gastoEliminar(id: number) {
    this.idParaEliminar = id;
    this.confirmarEliminarOpen.set(true);
  }

  cerrarConfirmacion() {
    this.confirmarEliminarOpen.set(false);
    this.idParaEliminar = null;
  }

  cerrarModal() {
    this.isOpen.set(false);
    
    const idActual = this.gastoForm.getRawValue().usuarioId;
    const nombreActual = this.gastoForm.getRawValue().nombreUsuario;
    const primerasucursal = this.sucursales().length > 0 ? this.sucursales()[0].id : null;

    this.gastoForm.reset({
      usuarioId: idActual,
      nombreUsuario: nombreActual,
      monto: '',
      motivo: '',
      persona_recibe: '',
      sucursal_id: primerasucursal
    });
    this.idGastoSeleccionado = null;
    this.errorServidor.set('');
  }
}