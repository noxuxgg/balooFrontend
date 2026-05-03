import { Routes } from '@angular/router';
import { Perfil } from './admin/perfil/perfil';

export const routes: Routes = [
    { path: 'auth', loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule)},
    { path: 'admin/perfil', component: Perfil }
];
