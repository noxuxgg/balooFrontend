import { Routes } from '@angular/router';
import { Perfil } from './admin/perfil/perfil';
import { Usuarios } from './admin/usuarios/usuarios';
import { authGuardGuard } from './core/guards/auth-guard-guard';

export const routes: Routes = [
    { path: 'auth', loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule)},

    { path: 'admin/perfil', component: Perfil, canActivate: [authGuardGuard] },
    { path: 'admin/usuarios', component: Usuarios, canActivate: [authGuardGuard]  }
];
