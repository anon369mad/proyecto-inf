import { Component, OnInit } from '@angular/core';
import { Rendicion } from '../rendicion.model';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalJefeAreaComponent } from '../modal-jefe-area/modal-jefe-area.component';
import { forkJoin } from 'rxjs'; // Importar forkJoin para peticiones paralelas

// Definir la interfaz para los tipos de gasto
interface TipoGasto {
  id: number;
  nombre: string;
}

// Definir la interfaz para los montos por tipo de gasto (del backend)
interface MontoPorTipoGasto {
  tipo_gasto: string; // El nombre del tipo de gasto
  total_monto: number;
}

// Interfaz para una rendición simplificada para los cálculos
interface RendicionSimplificada {
  estado: string;
  monto: number;
  tipo_gasto: string; // Añadir tipo_gasto aquí
}


@Component({
  selector: 'app-jefe-area',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule, ReactiveFormsModule, HttpClientModule, ModalJefeAreaComponent, CurrencyPipe],
  templateUrl: './jefe-area.component.html',
  styleUrl: './jefe-area.component.css'
})
export class JefeAreaComponent implements OnInit {
  APIURL = "http://localhost:8000/";
  constructor(private http: HttpClient, private router: Router) { }

  totalRendiciones = 0;
  aceptadas = 0;
  pendientes = 0;
  rechazadas = 0;
  montoTotal: number = 0;
  montoPromedio: number = 0;
  
  montosPorTipoGasto: MontoPorTipoGasto[] = []; // Para mostrar el desglose por tipo de gasto
  tiposDeGasto: TipoGasto[] = []; // Para poblar el selector de tipos de gasto

  periodoSeleccionado: string = '';
  anioSeleccionado: number | null = null;
  mesSeleccionado: number | null = null;
  tipoGastoSeleccionado: string | null = null; // Nombre del tipo de gasto seleccionado ('Viaje', 'Alimentos', etc.)

  anosDisponibles: number[] = [];
  meses = [
    { value: 1, name: 'Enero' }, { value: 2, name: 'Febrero' }, { value: 3, name: 'Marzo' },
    { value: 4, name: 'Abril' }, { value: 5, name: 'Mayo' }, { value: 6, name: 'Junio' },
    { value: 7, name: 'Julio' }, { value: 8, name: 'Agosto' }, { value: 9, name: 'Septiembre' },
    { value: 10, name: 'Octubre' }, { value: 11, name: 'Noviembre' }, { value: 12, name: 'Diciembre' }
  ];

  ngOnInit(): void {
    this.cargarAnosDisponibles();
    this.cargarTiposDeGasto(); 
  }

  cargarAnosDisponibles(): void {
    this.http.get<any>(`${this.APIURL}rendiciones/anios-disponibles`).subscribe({
      next: (response) => {
        this.anosDisponibles = response.anios;
        if (this.anosDisponibles.length > 0) {
          // Seleccionar el año más reciente por defecto o el primero si no hay ninguno
          this.anioSeleccionado = this.anosDisponibles[0]; 
          this.periodoSeleccionado = 'anual'; // Establecer 'anual' como período por defecto
          this.onFiltroCambio();
        }
      },
      error: (err) => {
        console.error('Error al cargar años disponibles:', err);
      }
    });
  }

  cargarTiposDeGasto(): void {
    this.http.get<any>(`${this.APIURL}tipos-gasto`).subscribe({
      next: (response) => {
        this.tiposDeGasto = response.tipos_gasto;
      },
      error: (err) => {
        console.error('Error al cargar tipos de gasto:', err);
      }
    });
  }

  onPeriodoTipoCambio(): void {
    if (this.periodoSeleccionado !== 'mensual') {
      this.mesSeleccionado = null; 
    }
    this.onFiltroCambio();
  }

  onTipoGastoCambio(): void {
    this.onFiltroCambio();
  }

  onFiltroCambio(): void {
    if (this.anioSeleccionado === null) {
      this.resetStats();
      return;
    }

    let periodoParaBackend: string;
    if (this.periodoSeleccionado === 'mensual') {
      if (this.mesSeleccionado === null) {
        this.resetStats();
        return; 
      } else {
        periodoParaBackend = `mensual_${this.mesSeleccionado}`;
      }
    } else if (this.periodoSeleccionado === 'anual') {
      periodoParaBackend = 'anual';
    } else {
      this.resetStats(); // Si no hay período seleccionado
      return;
    }

    const payload = {
      periodo: periodoParaBackend,
      anio: this.anioSeleccionado
    };

    forkJoin({
      totalRendicionesResp: this.http.post<any>(`${this.APIURL}rendiciones/cantidad`, payload),
      montoTotalResp: this.http.post<any>(`${this.APIURL}rendiciones/monto`, payload),
      montoPromedioResp: this.http.post<any>(`${this.APIURL}rendiciones/monto-promedio`, payload),
      aceptadasResp: this.http.post<any>(`${this.APIURL}rendiciones/estado/cantidad`, { ...payload, estado: "Aceptada" }),
      rechazadasResp: this.http.post<any>(`${this.APIURL}rendiciones/estado/cantidad`, { ...payload, estado: "Rechazada" }),
      pendientesResp: this.http.post<any>(`${this.APIURL}rendiciones/estado/cantidad`, { ...payload, estado: "Pendiente" }),
      montosPorTipoResp: this.http.post<MontoPorTipoGasto[]>(`${this.APIURL}rendiciones/montos-por-tipo-gasto`, payload),
      rendicionesFiltradasDetalladas: this.http.post<RendicionSimplificada[]>(`${this.APIURL}rendiciones/detalles-filtrados`, payload)


    }).subscribe({
      next: (results) => {
        this.totalRendiciones = results.totalRendicionesResp.cantidad;
        this.montoTotal = results.montoTotalResp.monto;
        this.montoPromedio = results.montoPromedioResp.monto_promedio;
        this.aceptadas = results.aceptadasResp.cantidad;
        this.rechazadas = results.rechazadasResp.cantidad;
        this.pendientes = results.pendientesResp.cantidad;
        this.montosPorTipoGasto = results.montosPorTipoResp;

        // *** APLICAR FILTRO POR TIPO DE GASTO EN EL FRONTEND ***
        const rendicionesBase = results.rendicionesFiltradasDetalladas;
        let rendicionesFiltradasPorTipoGasto: RendicionSimplificada[] = [];

        if (this.tipoGastoSeleccionado && this.tipoGastoSeleccionado !== 'todos') {
          // Si se seleccionó un tipo de gasto específico, filtrar la lista de rendiciones
          rendicionesFiltradasPorTipoGasto = rendicionesBase.filter(
            rendicion => rendicion.tipo_gasto === this.tipoGastoSeleccionado
          );
          // También filtrar la lista de montos por tipo de gasto para la tabla inferior
          this.montosPorTipoGasto = this.montosPorTipoGasto.filter(
            gasto => gasto.tipo_gasto === this.tipoGastoSeleccionado
          );
        } else {
          // Si no se seleccionó un tipo de gasto específico (o "todos"), usar todas las rendiciones del período/año
          rendicionesFiltradasPorTipoGasto = rendicionesBase;
          // La lista montosPorTipoGasto ya contiene todos los tipos, no necesita filtrado adicional aquí.
        }

        // Recalcular las estadísticas de cantidad y montos usando las rendiciones filtradas por tipo de gasto
        this.totalRendiciones = rendicionesFiltradasPorTipoGasto.length;
        this.aceptadas = rendicionesFiltradasPorTipoGasto.filter(r => r.estado === 'Aceptada').length;
        this.rechazadas = rendicionesFiltradasPorTipoGasto.filter(r => r.estado === 'Rechazada').length;
        this.pendientes = rendicionesFiltradasPorTipoGasto.filter(r => r.estado === 'Pendiente').length;
        
        this.montoTotal = rendicionesFiltradasPorTipoGasto.reduce((sum, r) => sum + r.monto, 0);
        this.montoPromedio = this.totalRendiciones > 0 ? this.montoTotal / this.totalRendiciones : 0;

      },
      error: (err) => {
        console.error('Error al obtener estadísticas:', err);
        this.resetStats();
      }
    });
  }

  resetStats(): void {
    this.totalRendiciones = 0;
    this.montoTotal = 0;
    this.montoPromedio = 0;
    this.aceptadas = 0;
    this.rechazadas = 0;
    this.pendientes = 0;
    this.montosPorTipoGasto = [];
  }
}