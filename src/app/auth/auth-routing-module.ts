import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './login/login';
import { Registro } from './registro/registro';

const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'registro', component: Registro }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }