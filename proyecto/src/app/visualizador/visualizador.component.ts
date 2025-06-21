import { Component, OnInit } from '@angular/core';
import { Rendicion } from '../rendicion.model';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-visualizador',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './visualizador.component.html',
  styleUrl: './visualizador.component.css'
})

export class VisualizadorComponent implements OnInit {
  rendiciones: Rendicion[] = [];
  userRut: string | null = null; // Variable para almacenar el RUT del usuario

  APIURL = "http://localhost:8000/";
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.userRut = localStorage.getItem('userRut'); 
    this.getRendiciones();
  }
  
  getRendiciones() {
    let url = this.APIURL + "rendiciones";
    if (this.userRut) {
      url += `?rut_trabajador=${this.userRut}`;
    }

    this.http.get<any[]>(url).subscribe((data) => {
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
    });
  }
}