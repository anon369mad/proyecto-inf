
# Usar una imagen base oficial de Python
FROM python:3.9

ENV PIP_DISABLE_PIP_VERSION_CHECK=1


# Establecer el directorio de trabajo
WORKDIR /API

# Copiar los archivos de requerimientos
COPY requirements.txt .

# Instalar las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente
COPY . .

RUN python -m venv venv

RUN . venv/bin/activate


# Exponer el puerto 8080
EXPOSE 8000

# Comando para ejecutar la aplicación
CMD ["uvicorn", "API.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
