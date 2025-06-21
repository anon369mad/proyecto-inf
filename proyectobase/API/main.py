from fastapi import FastAPI, HTTPException, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List # Importar List

from .utils import getRendiciones, createRendicion, updateRendicion, deleteRendicion, \
    rechazarRendicion, aceptarRendicion, addDocumento, getDocumentos, getCredenciales, \
    getCantidadRendiciones, getMontoRendiciones, getCantidadTipoRendiciones, \
    revisar_rendiciones_pendientes, getMontoPromedioRendiciones, getAniosDisponibles, \
    getRendicionesByRut, getTiposDeGasto, getMontosPorTipoGasto, getRendicionesDetalladasPorPeriodo

from pydantic import BaseModel
from datetime import date

app = FastAPI()

class Especial(BaseModel):
    periodo: str
    estado: str
    anio: int

class Periodo(BaseModel):
    periodo : str
    anio: int

# NUEVO: Modelo para la solicitud de montos por tipo de gasto
class MontosPorTipoGastoRequest(BaseModel):
    periodo: str
    anio: int

# NUEVO: Modelo para la respuesta de montos por tipo de gasto
class MontoPorTipoGastoResponse(BaseModel):
    tipo_gasto: str
    total_monto: float

class Credenciales(BaseModel):
    usuario: str
    contrasenia: str

class RendicionCreate(BaseModel):
    fecha_rendicion: date
    rut_trabajador: str
    nombre_trabajador: str
    monto: float
    tipo_gasto: str
    estado: str
    id_usuario: int


class RendicionUpdate(BaseModel):
    fecha_rendicion: date
    rut_trabajador: str
    nombre_trabajador: str
    monto: float
    tipo_gasto: str
    estado: str
    id_usuario: int

class DocumentoCreate(BaseModel):
    url: str

@app.get("/")
def status():
    print("Mmmmmm Tato")
    return {"message": "Funcionando"}

@app.get("/rendiciones")
def read_rendiciones(rut_trabajador: Optional[str] = None):
    if rut_trabajador:
        rows = getRendicionesByRut(rut_trabajador)
    else:
        rows = getRendiciones()
    return rows

@app.post("/rendiciones")
async def create_rendicion(rendicion: RendicionCreate):
    new_id = createRendicion(
        rendicion.fecha_rendicion,
        rendicion.rut_trabajador,
        rendicion.nombre_trabajador,
        rendicion.monto,
        rendicion.tipo_gasto,
        rendicion.estado,
        rendicion.id_usuario
    )
    return {"message": f"Rendicion creada con ID {new_id}", "id": new_id}

@app.put("/rendiciones/{rendicion_id}")
def update_rendicion(rendicion_id: int, rendicion: RendicionUpdate):
    updated_rows = updateRendicion(rendicion_id, rendicion.fecha_rendicion, rendicion.rut_trabajador, rendicion.nombre_trabajador, rendicion.monto, rendicion.tipo_gasto, rendicion.estado, rendicion.id_usuario)
    if updated_rows == 0:
        raise HTTPException(status_code=404, detail=f"Rendicion con ID {rendicion_id} no encontrada")

    return {"message": f"Rendicion con ID {rendicion_id} actualizada"}

@app.delete("/rendiciones/{rendicion_id}")
def delete_rendicion(rendicion_id: int):
    deleteRendicion(rendicion_id)
    return {"message": f"Rendicion con ID {rendicion_id} eliminada"}

@app.post("/rendiciones/{rendicion_id}/rechazar")
def rechazar_rendicion(rendicion_id: int):
    rechazarRendicion(rendicion_id)
    return {"message": f"Rendicion con ID {rendicion_id} rechazada"}

@app.post("/rendiciones/{rendicion_id}/aceptar")
def aceptar_rendicion(rendicion_id: int):
    aceptarRendicion(rendicion_id)
    return {"message": f"Rendicion con ID {rendicion_id} aceptada"}

# Nuevo endpoint para asociar documentos a una rendición
@app.post("/rendiciones/{rendicion_id}/documentos")
async def add_documento(rendicion_id: int, documento: DocumentoCreate):
    try:
        # Guardar la URL del documento en la base de datos
        addDocumento(rendicion_id, documento.url)
        return {"message": f"Documento agregado a la rendición {rendicion_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al agregar documento: {str(e)}")

@app.get("/rendiciones/{rendicion_id}/documentos")
def get_rendicion_documentos(rendicion_id: int):
    documentos = getDocumentos(rendicion_id)
    if not documentos:
        raise HTTPException(status_code=404, detail="No se encontraron documentos para esta rendición")
    return documentos

#Endpoint para login
@app.post("/login")
def login(cred: Credenciales):
    resultado = getCredenciales(cred.usuario, cred.contrasenia)
    if resultado:
        return {
            "id": resultado[0],
            "usuario": resultado[1],
            "rol": resultado[2],
            "correo": resultado[3],
            "rut": resultado[4]
        }
    else:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

#Endpoint para obtener cantidad de rendiciones
@app.post("/rendiciones/cantidad")
def obtenerCantidadRendiciones(data: Periodo):
    cantidad = getCantidadRendiciones(data.periodo, data.anio)
    if cantidad is not None:
        return {
            "cantidad" : cantidad
        }
    else:
        raise HTTPException(status_code=404, detail="No existen rendiciones en este periodo o año")

#Endpoint para obtener el monto total de rendiciones
@app.post("/rendiciones/monto")
def obtenerMontoRendiciones(data: Periodo):
    monto = getMontoRendiciones(data.periodo, data.anio)
    if monto is not None:
        return {
            "monto": int(monto)
        }
    else:
        raise HTTPException(status_code=404, detail="No se encontró monto para este periodo o año")

#Endpoint para obtener el monto promedio de rendiciones
@app.post("/rendiciones/monto-promedio")
def obtenerMontoPromedioRendiciones(data: Periodo):
    monto_promedio = getMontoPromedioRendiciones(data.periodo, data.anio)
    if monto_promedio is not None:
        return {
            "monto_promedio": float(monto_promedio)
        }
    else:
        raise HTTPException(status_code=404, detail="No se encontró monto promedio para este periodo o año")

# Función para obtener la cantidad de rendiciones en base a un estado dentro de un periodo
@app.post("/rendiciones/estado/cantidad")
def ObtenerCantidadEstadoRendiciones(data: Especial):
    cantidad = getCantidadTipoRendiciones(data.periodo, data.estado, data.anio)
    if cantidad is not None:
        return {
            "cantidad" : cantidad
        }
    else:
        raise HTTPException(status_code=404, detail="No se encontraron rendiciones")

# NUEVO ENDPOINT: Para obtener montos por tipo de gasto
@app.post("/rendiciones/montos-por-tipo-gasto", response_model=List[MontoPorTipoGastoResponse])
def obtenerMontosPorTipoGasto(data: MontosPorTipoGastoRequest):
    montos_por_tipo = getMontosPorTipoGasto(data.periodo, data.anio)
    if not montos_por_tipo:
        # Puedes decidir si lanzar una HTTPException 404 o retornar una lista vacía
        # dependiendo de si "no hay datos" es un error o un resultado esperado.
        # Por ahora, se retorna una lista vacía si no hay datos.
        return [] 
    return montos_por_tipo

# Función para obtener los años de rendiciones disponibles
@app.get("/rendiciones/anios-disponibles")
def obtenerAniosDisponibles():
    anios = getAniosDisponibles()
    return {"anios": anios}

# Endpoint para obtener tipos de gasto
@app.get("/tipos-gasto")
def obtener_tipos_gasto():
    """
    Este endpoint devuelve una lista de los tipos de gastos disponibles desde la base de datos,
    incluyendo su ID y nombre.
    """
    tipos = getTiposDeGasto()
    if not tipos:
        raise HTTPException(status_code=404, detail="No se encontraron tipos de gasto en la base de datos")
    return {"tipos_gasto": tipos}

@app.get("/revisar-rendiciones")
def test_revision():
    revisar_rendiciones_pendientes()
    return {"message": "Revisión ejecutada manualmente"}

class RendicionSimplificadaResponse(BaseModel):
    estado: str
    monto: float
    tipo_gasto: str

@app.post("/rendiciones/detalles-filtrados", response_model=List[RendicionSimplificadaResponse])
def get_filtered_rendition_details(data: Periodo): # Reutilizas el modelo Periodo
    return getRendicionesDetalladasPorPeriodo(data.periodo, data.anio)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)