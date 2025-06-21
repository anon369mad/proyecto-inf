import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    const userId = localStorage.getItem('id_usuario');
    const isLoggedIn = userId !== null && userId !== '0' && userId !== undefined && userId !== '';

    console.log('AuthGuard: Intentando activar ruta:', state.url);
    console.log('AuthGuard: Valor de id_usuario en localStorage:', userId);
    console.log('AuthGuard: ¿Usuario logueado (isLoggedIn)?', isLoggedIn);

    if (isLoggedIn) {
      return true;
    } else {
      console.warn('AuthGuard: Acceso denegado. Redirigiendo a la página de inicio.');
      this.showMessage('Acceso denegado. Por favor, inicie sesión para acceder a esta página.', 'error');
      return this.router.createUrlTree(['/']);
    }
  }

  private showMessage(message: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    const messageBox = document.createElement('div');
    messageBox.style.position = 'fixed';
    messageBox.style.top = '20px';
    messageBox.style.left = '50%';
    messageBox.style.transform = 'translateX(-50%)';
    messageBox.style.padding = '15px 20px';
    messageBox.style.borderRadius = '8px';
    messageBox.style.zIndex = '1000';
    messageBox.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    messageBox.style.textAlign = 'center';
    messageBox.style.maxWidth = '80%';
    messageBox.style.color = 'white';
    messageBox.textContent = message;

    switch (type) {
      case 'success':
        messageBox.style.backgroundColor = '#4CAF50';
        break;
      case 'error':
        messageBox.style.backgroundColor = '#f44336'; 
        break;
      case 'warning':
        messageBox.style.backgroundColor = '#ff9800'; 
        break;
      default:
        messageBox.style.backgroundColor = '#4CAF50';
    }

    document.body.appendChild(messageBox);

    setTimeout(() => {
      if (document.body.contains(messageBox)) {
        document.body.removeChild(messageBox);
      }
    }, 3000);
  }
}