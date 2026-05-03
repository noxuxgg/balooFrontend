import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing-module';
import { Login } from './login/login';
import { Registro } from './registro/registro';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    Login,
    Registro
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    ReactiveFormsModule
  ]
})
export class AuthModule { }
