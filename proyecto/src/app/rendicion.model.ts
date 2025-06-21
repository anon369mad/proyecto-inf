export interface Rendicion {
    id: number;
    fecha_rendicion: string;
    rut_trabajador: string;
    nombre_trabajador: string;
    monto: number;
    tipo_gasto: string;
    estado: string;
    id_usuario: number
  }

export interface Documento {
  id: number;
  id_rendicion: number;
  url: string
}

export interface Usuario {
  id: number;
  usuario: string;
  contrasenia: string;
  rol: string;
  correo: string
}