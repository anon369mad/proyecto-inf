import { Routes } from '@angular/router';
import { InicioComponent } from './inicio/inicio.component';
import { TrabajadorComponent } from './trabajador/trabajador.component';
import { ContadorComponent } from './contador/contador.component';
import { JefeAreaComponent } from './jefe-area/jefe-area.component';
import { VisualizadorComponent } from './visualizador/visualizador.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
    { path: '', component: InicioComponent },
    { 
        path: 'trabajador', 
        component: TrabajadorComponent,
        canActivate: [AuthGuard]
    },
    { 
        path: 'contador', 
        component: ContadorComponent,
        canActivate: [AuthGuard]
    },
    { 
        path: 'jefe-area', 
        component: JefeAreaComponent,
        canActivate: [AuthGuard]
    },
    { 
        path: 'visualizador', 
        component: VisualizadorComponent,
        canActivate: [AuthGuard]
    },
    { path: '**', redirectTo:'' }, // Ruta comodín para cualquier otra URL no definida
];
