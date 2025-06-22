import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-modal-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './modal-login.component.html',
  styleUrl: './modal-login.component.css'
})

export class ModalLoginComponent {
  usuario = ''
  contrasenia = ''
  mostrarModal = false;

  constructor(private router : Router, private http: HttpClient) {}

  abrirModal(){
    this.mostrarModal = true;
    console.log("Modal abierto");
  }
  cerrarModal(){
    this.mostrarModal = false;
    this.usuario = '';
    this.contrasenia = '';
  }

  iniciarSesion(){
    const credenciales = {
      usuario: this.usuario,
      contrasenia: this.contrasenia
    };

    const url = 'http://localhost:8000/login';
    console.log('Intentando iniciar sesión con:', credenciales);

    this.http.post<any>(url, credenciales).subscribe({
      next: (respuesta) => {
        console.log('Respuesta de login:', respuesta);

        if (respuesta && respuesta.id && respuesta.rol && respuesta.rut) { 
          localStorage.setItem('id_usuario', respuesta.id.toString());
          localStorage.setItem('usuario_rol', respuesta.rol);
          localStorage.setItem('userRut', respuesta.rut); // 
          console.log('ID de usuario guardado en localStorage:', respuesta.id);
          console.log('Rol de usuario guardado en localStorage:', respuesta.rol);
          console.log('RUT de usuario guardado en localStorage:', respuesta.rut); 
        } else {
          console.warn('La respuesta del login no contiene un ID de usuario, rol o RUT válido.');
          this.showMessage('Inicio de sesión exitoso, pero no se pudo obtener el ID de usuario, rol o RUT.', 'warning');
        }

        const rol = respuesta.rol;
        if (rol === 'revisor') {
          this.router.navigate(['/jefe-area']);
        } else if (rol === 'ingresador') {
          this.router.navigate(['/trabajador']);
        } else if (rol === 'visualizador') {
          this.router.navigate(['/visualizador']);
        } else if (rol === 'validador'){
          this.router.navigate(['/contador']);
        } else {
          console.warn('Rol de usuario desconocido:', rol);
          this.showMessage('Rol de usuario desconocido, redirigiendo a la página principal.', 'warning');
          this.router.navigate(['/']);
        }
        this.cerrarModal();
      },
      error: (err) => {
        console.error('Error al iniciar sesión:', err);
        this.showMessage('Credenciales incorrectas. Por favor, inténtelo de nuevo.', 'error');
      }
    });
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