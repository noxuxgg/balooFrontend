import { Component, inject, signal } from '@angular/core';
import { UsersService } from '../../core/services/users.service';

@Component({
  selector: 'app-usuarios',
  imports: [],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {
  userService = inject(UsersService);
  usuarios = signal<any>([]);

  constructor(){
    this.listar
  }

  listar(){
    this.userService.funListar().subscribe(
      (res: any) => {
        this.usuarios.set(res)
      }
    )
  }

}
