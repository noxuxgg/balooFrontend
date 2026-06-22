import { Routes } from '@angular/router';
import { Perfil } from './admin/perfil/perfil';
import { Usuarios } from './admin/usuarios/usuarios';
import { authGuardGuard } from './core/guards/auth-guard-guard';
import { Clientes } from './admin/clientes/clientes';
import { Productos } from './admin/productos/productos';
import { Pedidos } from './admin/pedidos/pedidos';
import { Ventas } from './admin/ventas/ventas';
import { Stock } from './admin/stock/stock';
import { Reportes } from './admin/reportes/reportes';
import { Sucursales } from './admin/sucursales/sucursales';
import { AdminLayout } from './admin/admin-layout/admin-layout';
import { Gastos } from './admin/gastos/gastos';

export const routes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    { path: 'auth', redirectTo: 'auth/login', pathMatch: 'full' },
    { path: 'auth', loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule) },

    {
        path: 'admin',
        component: AdminLayout, 
        canActivate: [authGuardGuard],
        children: [
            { path: 'perfil', component: Perfil },
            { path: 'usuarios', component: Usuarios },
            { path: 'clientes', component: Clientes },
            { path: 'productos', component: Productos },
            { path: 'pedidos', component: Pedidos },
            { path: 'ventas', component: Ventas },
            { path: 'stock', component: Stock },
            { path: 'reportes', component: Reportes },
            { path: 'sucursales', component: Sucursales },
            { path: 'gastos', component: Gastos },
            { path: '', redirectTo: 'perfil', pathMatch: 'full' }
        ]
    },

    
    { path: '**', redirectTo: 'auth/login' }
];