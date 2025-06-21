import psycopg2
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta, date
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

try:
    conn = psycopg2.connect(
        database="proyecto_db",
        user="ayds123",
        password="ayds123",
        host="db",
        port="5432"
    )
    print("Conexión exitosa a la base de datos", conn)
except Exception as e:
    print(f"Error al conectarse a la base de datos: {e}")

# Función para obtener todas las rendiciones
def getRendiciones(conn=conn):
    cur = conn.cursor()
    cur.execute("SELECT * FROM rendicion;")
    rows = cur.fetchall()
    cur.close()
    return rows

# Función para crear una nueva rendición
def createRendicion(fecha_rendicion, rut_trabajador, nombre_trabajador, monto, tipo_gasto, estado, id_usuario, conn=conn):
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO rendicion (fecha_rendicion, rut_trabajador, nombre_trabajador, monto, tipo_gasto, estado, id_usuario) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id;",
        (fecha_rendicion, rut_trabajador, nombre_trabajador, monto, tipo_gasto, estado, id_usuario)
    )
    conn.commit()
    new_id = cur.fetchone()[0]
    cur.close()
    return new_id

# Función para actualizar una rendición
def updateRendicion(id, fecha_rendicion, rut_trabajador, nombre_trabajador, monto, tipo_gasto, estado, id_usuario, conn=conn):
    cur = conn.cursor()
    cur.execute(
        "UPDATE rendicion SET fecha_rendicion = %s, rut_trabajador = %s, nombre_trabajador = %s, monto = %s, tipo_gasto = %s, estado = %s, id_usuario = %s WHERE id = %s;",
        (fecha_rendicion, rut_trabajador, nombre_trabajador, monto, tipo_gasto, estado, id_usuario, id)
    )
    updated_rows = cur.rowcount
    conn.commit()
    cur.close()
    return updated_rows


# Función para eliminar una rendición
def deleteRendicion(id, conn=conn):
    cur = conn.cursor()
    cur.execute("DELETE FROM rendicion WHERE id = %s;", (id,))
    conn.commit()
    cur.close()

# Función para marcar una rendición como rechazada
def rechazarRendicion(id, conn=conn):
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE rendicion SET estado = %s, fecha_cierre = %s WHERE id = %s;",
            ('Rechazada', datetime.now(), id)
        )
        conn.commit()
    except Exception as e:
        print(f"Error al rechazar la rendición: {e}")
        conn.rollback()
    finally:
        cur.close()

# Función para marcar una rendición como aceptada
def aceptarRendicion(id, conn=conn):
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE rendicion SET estado = %s, fecha_cierre = %s WHERE id = %s;",
            ('Aceptada', datetime.now(), id)
        )
        conn.commit()
    except Exception as e:
        print(f"Error al aceptar la rendición: {e}")
        conn.rollback()
    finally:
        cur.close()

# Función para agregar un documento asociado a una rendición
def addDocumento(id_rendicion, url, conn=conn):
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO documento (id_rendicion, url) VALUES (%s, %s);",
            (id_rendicion, url)
        )
        conn.commit()
    except Exception as e:
        print(f"Error al agregar el documento: {e}")
        conn.rollback()
    finally:
        cur.close()

# Función para obtener los documentos asociados a una rendición
def getDocumentos(id_rendicion, conn=conn):
    cur = conn.cursor()
    cur.execute(
        "SELECT id, url FROM documento WHERE id_rendicion = %s;",
        (id_rendicion,)
    )
    documentos = cur.fetchall()
    cur.close()
    return documentos

# Función para obtener el usuario y contraseña
def getCredenciales(usuario, contrasenia, conn=conn):
    cur = conn.cursor()
    cur.execute("SELECT id, usuario, rol, correo, rut FROM usuario WHERE usuario = %s AND contrasenia = %s;", (usuario, contrasenia))
    resultado = cur.fetchone()
    cur.close()
    return resultado

# Función para obtener rendiciones por RUT de trabajador
def getRendicionesByRut(rut_trabajador: str, conn=conn):
    cur = conn.cursor()
    cur.execute("SELECT * FROM rendicion WHERE rut_trabajador = %s;", (rut_trabajador,))
    rows = cur.fetchall()
    cur.close()
    return rows

# Función para transformar el periodo a una fecha de inicio y fin, considerando el año
def calcular_fechas_por_periodo(periodo: str, anio: int) -> tuple[datetime, datetime]:
    fecha_inicio = None
    fecha_fin = None

    if periodo == 'anual':
        fecha_inicio = datetime(anio, 1, 1)
        fecha_fin = datetime(anio, 12, 31, 23, 59, 59)
    elif periodo.startswith('mensual_'):
        try:
            mes = int(periodo.split('_')[1])
            if not (1 <= mes <= 12):
                raise ValueError("Mes inválido")
            
            fecha_inicio = datetime(anio, mes, 1)
            # Calcular el último día del mes
            if mes == 12:
                fecha_fin = datetime(anio, 12, 31, 23, 59, 59)
            else:
                fecha_fin = datetime(anio, mes + 1, 1) - timedelta(microseconds=1)
        except ValueError as e:
            print(f"Error al procesar periodo mensual: {e}")
            return None, None

    return fecha_inicio, fecha_fin

# Función para obtener la cantidad de rendiciones dentro de un periodo y año establecido
def getCantidadRendiciones(periodo: str, anio: int, conn=conn):
    fecha_inicio, fecha_fin = calcular_fechas_por_periodo(periodo, anio)
    if not fecha_inicio or not fecha_fin:
        return 0

    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM rendicion WHERE fecha_creacion BETWEEN %s AND %s;",
        (fecha_inicio, fecha_fin)
    )
    cantidad = cur.fetchone()[0]
    cur.close()
    return cantidad

# Función para obtener el monto total de rendiciones dentro de un periodo y año
def getMontoRendiciones(periodo: str, anio: int, conn=conn):
    fecha_inicio, fecha_fin = calcular_fechas_por_periodo(periodo, anio)
    if not fecha_inicio or not fecha_fin:
        return 0.0

    cur = conn.cursor()
    cur.execute(
        """
        SELECT SUM(monto) FROM rendicion WHERE fecha_creacion BETWEEN %s AND %s;
        """, (fecha_inicio, fecha_fin)
    )
    monto = cur.fetchone()[0]
    cur.close()
    return monto if monto is not None else 0.0

# Función para obtener el monto promedio de rendiciones dentro de un periodo y año
def getMontoPromedioRendiciones(periodo: str, anio: int, conn=conn):
    fecha_inicio, fecha_fin = calcular_fechas_por_periodo(periodo, anio)
    if not fecha_inicio or not fecha_fin:
        return 0.0

    cur = conn.cursor()
    cur.execute(
        """
        SELECT AVG(monto) FROM rendicion WHERE fecha_creacion BETWEEN %s AND %s;
        """, (fecha_inicio, fecha_fin)
    )
    monto_promedio = cur.fetchone()[0]
    cur.close()
    return monto_promedio if monto_promedio is not None else 0.0

# Funcion para obtener la cantidad de rendiciones en base a un estado dentro de un periodo
def getCantidadTipoRendiciones(periodo: str, estado: str, anio: int, conn=conn):
    fecha_inicio, fecha_fin = calcular_fechas_por_periodo(periodo, anio)
    if not fecha_inicio or not fecha_fin:
        return 0

    cur = conn.cursor()
    cur.execute(
        "SELECT COUNT(*) FROM rendicion WHERE fecha_creacion BETWEEN %s AND %s AND estado = %s;",
        (fecha_inicio, fecha_fin, estado)
    )
    cantidad = cur.fetchone()[0]
    cur.close()
    return cantidad

# Función para obtener montos por tipo de gasto para un periodo y año dados
def getMontosPorTipoGasto(periodo: str, anio: int, conn=conn):
    fecha_inicio, fecha_fin = calcular_fechas_por_periodo(periodo, anio)
    if not fecha_inicio or not fecha_fin:
        return []

    cur = conn.cursor()
    cur.execute(
        """
        SELECT tipo_gasto, SUM(monto) AS total_monto
        FROM rendicion
        WHERE fecha_creacion BETWEEN %s AND %s
        GROUP BY tipo_gasto
        ORDER BY total_monto DESC;
        """, (fecha_inicio, fecha_fin)
    )
    # Devuelve una lista de diccionarios para facilitar el manejo en el frontend
    montos_por_tipo = [{"tipo_gasto": row[0], "total_monto": row[1]} for row in cur.fetchall()]
    cur.close()
    return montos_por_tipo

def getRendicionesDetalladasPorPeriodo(periodo: str, anio: int, conn=conn):
    fecha_inicio, fecha_fin = calcular_fechas_por_periodo(periodo, anio)
    if not fecha_inicio or not fecha_fin:
        return []

    cur = conn.cursor()
    cur.execute(
        """
        SELECT estado, monto, tipo_gasto
        FROM rendicion
        WHERE fecha_creacion BETWEEN %s AND %s;
        """, (fecha_inicio, fecha_fin)
    )
    # Devuelve una lista de diccionarios, mapeando a la interfaz RendicionSimplificada en el frontend
    rendiciones = [{"estado": row[0], "monto": row[1], "tipo_gasto": row[2]} for row in cur.fetchall()]
    cur.close()
    return rendiciones

# Nueva función para obtener los años únicos de las rendiciones
def getAniosDisponibles(conn=conn):
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT EXTRACT(YEAR FROM fecha_creacion) FROM rendicion ORDER BY 1 DESC;")
    anios = [int(row[0]) for row in cur.fetchall()] # Convertir a entero
    cur.close()
    return anios

# Función para obtener usuario por el id
def getUsuarioPorId(id_usuario, conn=conn):
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, usuario, rol, correo, rut FROM usuario WHERE id = %s;", (id_usuario,))
        usuario = cursor.fetchone()
        cursor.close()
        return usuario
    except Exception as e:
        print("Error al obtener usuario por ID:", str(e))
        return None

# --- FUNCIÓN ACTUALIZADA PARA OBTENER TIPOS DE GASTO ---
def getTiposDeGasto(conn=conn):
    cur = conn.cursor()
    # Selecciona id y nombre de la tabla tipo_gasto
    cur.execute("SELECT id, nombre FROM tipo_gasto ORDER BY nombre ASC;")
    rows = cur.fetchall()
    cur.close()
    # Devuelve una lista de diccionarios, cada uno con 'id' y 'nombre'
    return [{"id": row[0], "nombre": row[1]} for row in rows]

# Función para enviar correo electrónico por rendiciones con revisión pendiente
def es_retrasada(fecha_creacion):
    hoy = datetime.now().date()
    fecha = fecha_creacion.date() if isinstance(fecha_creacion, datetime) else fecha_creacion
    dias_habiles = 0
    while fecha < hoy:
        if fecha.weekday() < 5:
            dias_habiles += 1
        if dias_habiles >= 5:
            return True
        fecha += timedelta(days=1)
    return False

def enviar_correo(destinatario, asunto, cuerpo):
    remitente = "proexpensestest@gmail.com"
    contrasena = "nhek wkhm tgpw cmkx"

    mensaje = MIMEMultipart()
    mensaje['From'] = remitente
    mensaje['To'] = destinatario
    mensaje['Subject'] = asunto
    mensaje.attach(MIMEText(cuerpo, 'plain'))

    try:
        servidor = smtplib.SMTP('smtp.gmail.com', 587)
        servidor.starttls()
        servidor.login(remitente, contrasena)
        servidor.send_message(mensaje)
        servidor.quit()
    except Exception as e:
        print("Error al enviar correo:", str(e))

def revisar_rendiciones_pendientes():
    print("Ejecutando revisión automática de rendiciones...")
    rendiciones = getRendiciones()
    for r in rendiciones:
        id, fecha_rendicion, rut, nombre, monto, tipo, estado, fecha_creacion, fecha_cierre, id_usuario = r
        if estado == "Pendiente" and es_retrasada(fecha_creacion):
            usuario = getUsuarioPorId(id_usuario)
            if usuario:
                correo = usuario[3]
                asunto = f"Rendición atrasada (ID {id})"
                cuerpo = f"""
Hola {usuario[1]},

La rendición con ID {id} sigue pendiente después de 5 días hábiles.

- Trabajador: {nombre} (RUT {rut})
- Fecha de creación: {fecha_creacion}
- Monto: ${monto:,.0f}

Por favor revisa esta rendición cuanto antes.

Sistema de Rendiciones
"""
                enviar_correo(correo, asunto, cuerpo)

# Iniciar scheduler cada 24 horas una una vez iniciado el sistema
scheduler = BackgroundScheduler()
scheduler.add_job(revisar_rendiciones_pendientes, "interval", hours=24)
scheduler.start()