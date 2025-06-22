import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Rendicion } from '../rendicion.model';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rendicion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rendicion.component.html',
  styleUrl: './rendicion.component.css'
})
export class RendicionComponent {

  APIURL = "http://localhost:8000/rendiciones";

  constructor(private http: HttpClient) {}

  @Input() rendicion: Rendicion | null = null;
  @Output() cerrar = new EventEmitter<void>();
  @ViewChild('rendicionModal') rendicionModal!: ElementRef;

  documentos: { id: number, url: string }[] = [];

  openByDocument() {
    if (this.rendicion?.id) {
      console.log('Abriendo modal para rendición:', this.rendicion.id);
      this.obtenerDocumentos(this.rendicion.id);
    }
    if (this.rendicionModal) {
      this.rendicionModal.nativeElement.classList.remove('hidden');
      this.rendicionModal.nativeElement.classList.add('flex'); // Mostrar modal
    }
  }

  closeRendicionByDocument() {
    if (this.rendicionModal) {
      this.rendicionModal.nativeElement.classList.add('hidden');
      this.rendicionModal.nativeElement.classList.remove('flex'); // Ocultar modal
    }
  }

  rechazarRendicion(rendicionId: number): void {
    if (rendicionId == null) {
      console.error('El ID de la rendición no es válido');
      return;
    }
    const url = `${this.APIURL}/${rendicionId}/rechazar`;
    const body = { estado: 'Rechazada' };
    this.http.post(url, body).subscribe(
      (response) => {
        console.log('Rendición rechazada:', response);
        this.cerrarOverlay(); 
        window.location.reload();
      },
      (error) => {
        console.error('Error al rechazar la rendición:', error);
      }
    );
  }

  aceptarRendicion(rendicionId: number): void {
    if (rendicionId == null) {
      console.error('El ID de la rendición no es válido');
      return;
    }
    const url = `${this.APIURL}/${rendicionId}/aceptar`;
    const body = { estado: 'Aceptada' };
    this.http.post(url, body).subscribe(
      (response) => {
        console.log('Rendición aceptada:', response);
        this.cerrarOverlay(); 
        window.location.reload();
      },
      (error) => {
        console.error('Error al aceptar la rendición:', error);
      }
    );
  }

  obtenerDocumentos(rendicionId: number): void {
    const url = `${this.APIURL}/${rendicionId}/documentos`;
    this.http.get<[number, string][]>(url).subscribe(
      (data) => {
        this.documentos = data.map(([id, url]) => ({ id, url }));
      },
      (error) => {
        console.error('Error al obtener documentos:', error);
      }
    );
  }

  cerrarOverlay() {
    this.cerrar.emit();
  }
}