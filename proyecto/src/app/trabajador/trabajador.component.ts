import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Documento, Rendicion, Usuario } from '../rendicion.model';

import { RouterOutlet } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Definición de la interfaz TipoGasto (movida aquí)
export interface TipoGasto {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-trabajador',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './trabajador.component.html',
  styleUrls: ['./trabajador.component.css']
})

export class TrabajadorComponent implements OnInit {
  rendiciones: Rendicion[] = [];
  filtroPorEstado: string = '';
  filtradas: Rendicion[] = [];
  APIURL = "http://localhost:8000/"; // URL base de tu API de FastAPI

  // Propiedad para almacenar los tipos de gasto
  tiposDeGasto: TipoGasto[] = [];

  // Solo inyectamos HttpClient
  constructor(private http: HttpClient) {}

  /**
   * Formatea el valor de un input numérico agregando puntos como separadores de miles.
   * @param event El evento del input.
   */
  formatNumber(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^\d]/g, ''); // Elimina caracteres no numéricos
    const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Agrega puntos
    input.value = formattedValue;
  }

  /**
   * Envía una nueva rendición de gastos al backend, incluyendo la subida de archivos a Cloudinary
   * y la asociación de los documentos a la rendición.
   * @param formData Los datos del formulario de la rendición.
   * @param files Los archivos seleccionados para subir.
   */
  postRendiciones(formData: any, files: FileList | null) {
    if (!files || files.length === 0) {
      console.error('No se seleccionó ningún archivo');
      this.showMessage('Debe seleccionar al menos un archivo para la rendición.', 'error');
      return;
    }

    const idUsuarioString = localStorage.getItem('id_usuario');
    const idUsuario = idUsuarioString ? Number(idUsuarioString) : null;

    if (idUsuario === null || idUsuario <= 0 || isNaN(idUsuario)) {
      console.error('ID de usuario no válido. Asegúrese de que el usuario esté logueado.');
      this.showMessage('Error: ID de usuario no válido. Por favor, inicie sesión.', 'error');
      return;
    }

    // Prepara los FormData para cada archivo a subir a Cloudinary
    const formDataUploads: FormData[] = [];
    Array.from(files).forEach(file => {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', 'proexpenses_preset'); // Tu preset de Cloudinary
      formDataUpload.append('cloud_name', 'dman9cibc'); // Tu nombre de Cloudinary
      formDataUploads.push(formDataUpload);
    });

    // Sube todos los archivos a Cloudinary en paralelo
    Promise.all(
      formDataUploads.map(fd =>
        this.http.post('https://api.cloudinary.com/v1_1/dman9cibc/auto/upload', fd).toPromise()
      )
    ).then((responses: any[]) => {
      const urls = responses.map(response => response.secure_url);
      console.log('Archivos subidos a Cloudinary:', urls);

      // Convierte el monto formateado de string a número entero
      const monto = parseInt(formData.monto.toString().replace(/[^\d]/g, ''), 10);

      // Crea el objeto de la nueva rendición
      const newRendicion: Rendicion = {
        id: 0, // El ID se asignará en el backend
        fecha_rendicion: formData.fecha_rendicion,
        rut_trabajador: formData.rut_trabajador,
        nombre_trabajador: formData.nombre_trabajador,
        monto: monto,
        tipo_gasto: formData.tipo_gasto, // tipo_gasto ya viene correctamente del select
        estado: 'Pendiente', // Estado inicial
        id_usuario: idUsuario
      };

      // Envía la rendición al backend
      this.http.post(this.APIURL + 'rendiciones', newRendicion).subscribe(
        (res: any) => {
          const rendicionId = res.id;
          console.log('Rendición creada con ID:', rendicionId);

          // Una vez creada la rendición, asocia los documentos
          const documentoRequests = urls.map(url => {
            const newDocumentos: Documento = {
              id: 0, // El ID se asignará en el backend
              id_rendicion: rendicionId,
              url: url
            };
            return this.http.post(this.APIURL + 'rendiciones/' + rendicionId + '/documentos', newDocumentos).toPromise();
          });

          // Espera a que todos los documentos se asocien
          Promise.all(documentoRequests).then(() => {
            console.log('Documentos asociados a la rendición n°', rendicionId);
            this.getRendiciones(); // Actualiza la lista de rendiciones mostrada
            this.showMessage('Rendición y documentos creados con éxito.', 'success'); // Mensaje de éxito
          }).catch((docError) => {
            console.error('Error al asociar documentos:', docError);
            this.showMessage('Rendición creada, pero hubo un error al asociar los documentos.', 'warning'); // Mensaje de éxito parcial
          });
        },
        (error) => {
          console.error('Error al guardar la rendición:', error);
          this.showMessage('Error al crear la rendición: ' + (error.error?.detail || 'Error desconocido.'), 'error'); // Mensaje de error
        }
      );
    }).catch((error) => {
      console.error('Error al subir archivos a Cloudinary:', error);
      this.showMessage('Error al subir archivos: ' + (error.message || 'Error desconocido.'), 'error'); // Mensaje de error de Cloudinary
    });
  }

  /**
   * Obtiene la lista de todas las rendiciones desde el backend.
   * Mapea los datos del backend a la estructura de Rendicion y actualiza la lista filtrada.
   */
  getRendiciones() {
    this.http.get<any[]>(this.APIURL + "rendiciones").subscribe((data) => {
      // Mapea la respuesta del backend a la estructura de Rendicion
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

      this.actualizarFiltradas();
    });
  }

  /**
   * Obtiene la lista de tipos de gasto desde el backend.
   * La lógica se encuentra directamente en el componente.
   */
  getTiposDeGasto(): void {
    // Realiza la llamada HTTP GET al endpoint /tipos-gasto
    this.http.get<{ tipos_gasto: TipoGasto[] }>(`${this.APIURL}tipos-gasto`).subscribe({
      next: (response) => {
        // Almacena los tipos de gasto en la propiedad del componente
        this.tiposDeGasto = response.tipos_gasto;
        console.log('Tipos de Gasto cargados:', this.tiposDeGasto);
      },
      error: (error) => {
        console.error('Error al cargar los tipos de gasto:', error);
        this.showMessage('Error al cargar los tipos de gasto. Intente recargar la página.', 'error');
      }
    });
  }

  /**
   * Actualiza la lista de rendiciones filtradas basándose en el filtro de estado actual.
   */
  actualizarFiltradas(){
    this.filtradas = this.filtroPorEstado
      ? this.rendiciones.filter (rendicion => rendicion.estado == this.filtroPorEstado)
      : this.rendiciones;
  }

  /**
   * Maneja el cambio en el select de filtro por estado.
   * @param event El evento de cambio.
   */
  CambiarEstado(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.filtroPorEstado = selectElement.value;
    this.actualizarFiltradas();
  }

  /**
   * Lifecycle hook que se ejecuta después de que Angular inicializa el componente.
   * Aquí se cargan las rendiciones y los tipos de gasto.
   */
  ngOnInit() {
    this.getRendiciones(); // Carga las rendiciones al iniciar el componente
    this.getTiposDeGasto(); // Carga los tipos de gasto al iniciar el componente
  }

  /**
   * Muestra un mensaje temporal en la interfaz de usuario.
   * @param message El mensaje a mostrar.
   * @param type El tipo de mensaje ('success', 'error', 'warning') para el estilo.
   */
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

    // Usar textContent por seguridad para evitar inyección de HTML
    messageBox.textContent = message;

    switch (type) {
      case 'success':
        messageBox.style.backgroundColor = '#4CAF50'; // Verde
        break;
      case 'error':
        messageBox.style.backgroundColor = '#f44336'; // Rojo
        break;
      case 'warning':
        messageBox.style.backgroundColor = '#ff9800'; // Naranja
        break;
      default:
        messageBox.style.backgroundColor = '#4CAF50'; // Default a verde
    }

    document.body.appendChild(messageBox);

    // Elimina el mensaje después de 3 segundos
    setTimeout(() => {
      // Asegurarse de que el elemento todavía esté en el DOM antes de intentar eliminarlo
      if (document.body.contains(messageBox)) {
        document.body.removeChild(messageBox);
      }
    }, 3000);
  }
}
