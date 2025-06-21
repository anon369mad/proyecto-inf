import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild} from '@angular/core';
import { Rendicion } from '../rendicion.model';
import { RendicionComponent } from '../rendicion/rendicion.component';


import { RouterOutlet } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-contador',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule, RendicionComponent],
  templateUrl: './contador.component.html',
  styleUrl: './contador.component.css'
})

export class ContadorComponent implements OnInit {
  rendiciones : Rendicion[] = [];
  rendicionSeleccionada: Rendicion | null = null;
  filtroPorEstado: string = '';
  filtradas: Rendicion[] = [];

  APIURL = "http://localhost:8000/";
  constructor(private http: HttpClient) { }

  @ViewChild(RendicionComponent) rendicionComponent!: RendicionComponent;

  openRendicion(rendicion: Rendicion) {
    this.rendicionSeleccionada = rendicion;
    this.rendicionComponent.rendicion = rendicion; // Pasar la rendición seleccionada al componente hijo
    this.rendicionComponent.openByDocument();
  }

  closeRendicion() {
    this.rendicionComponent.closeRendicionByDocument();
  }

  ngOnInit(): void {
      this.getRendiciones();
  }

  getRendiciones() {
    this.http.get<any[]>(this.APIURL + "rendiciones").subscribe((data) => {
      this.rendiciones = data.map(item => ({
        id: item[0],
        fecha_rendicion: item[1],
        rut_trabajador: item[2],
        nombre_trabajador: item[3],
        monto: item[4],
        tipo_gasto: item[5],
        estado: item[6],
        id_usuario: item[7]
      }));
      this.actualizarFiltradas(); // Muestra el primer objeto transformado
    });
  }

  actualizarFiltradas(){
    this.filtradas = this.filtroPorEstado
      ? this.rendiciones.filter (rendicion => rendicion.estado == this.filtroPorEstado)
      : this.rendiciones;
  }

  CambiarEstado(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.filtroPorEstado = selectElement.value;
    this.actualizarFiltradas();
  }

  formatNumber(event: any): void {
    const input = event.target;
    const value = input.value.replace(/[^\d]/g, '');
    const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    input.value = formattedValue;
  }
}
