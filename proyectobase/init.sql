-- Ejemplos de cómo conectarse y crear tablas en postgres

-- Usar imagen oficial de postgres en dockerhub https://hub.docker.com/_/postgres

-- Clonar la imagen con el comando 'docker pull postgres'

-- Ejecutar 'docker run -p 5432:5432 -e POSTGRES_PASSWORD="postgres",POSTGRES_USER="postgres" postgres'

-- Abrir terminal desde el contenedor (o escribir en terminal del computador 'docker exec -it <nombre_contenedor> bash')

DROP TABLE IF EXISTS "Usuario";

CREATE TABLE Usuario (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(32) NOT NULL,
    contrasenia VARCHAR(32) NOT NULL,
    rol VARCHAR(32) NOT NULL,
    correo VARCHAR(54) NOT NULL,
    rut VARCHAR(10) NOT NULL
); 

DROP TABLE IF EXISTS "Rendicion";

--Crear tabla rendicion
CREATE TABLE Rendicion (
    id SERIAL PRIMARY KEY,
    fecha_rendicion DATE NOT NULL,
    rut_trabajador VARCHAR(10) NOT NULL,
    nombre_trabajador VARCHAR(255) NOT NULL, -- Corregido el espacio extra
    monto FLOAT NOT NULL,
    tipo_gasto VARCHAR(32) NOT NULL,
    estado VARCHAR(35) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_cierre TIMESTAMP NULL,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id)
); 

-- Crear tabla documentos
CREATE TABLE Documento (
    id SERIAL PRIMARY KEY,
    id_rendicion INT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    FOREIGN KEY (id_rendicion) REFERENCES rendicion(id) ON DELETE CASCADE
); 

CREATE TABLE tipo_gasto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(32) NOT NULL UNIQUE
); 

---- EJEMPLOS DE PRUEBA ----

--Insertar dato
INSERT INTO Usuario (usuario, contrasenia, rol, correo, rut)
VALUES
('admin1', 'admin1', 'ingresador', 'proexpensestest@gmail.com', '10000000-1'),
('admin2', 'admin2', 'revisor', 'proexpensestest@gmail.com', '10000000-2'),
('admin3', 'admin3', 'validador', 'proexpensestest@gmail.com', '10000000-3'),
('fun1', '1234', 'visualizador', 'proexpensestest@gmail.com', '12345678-9'),
('fun2', '1234', 'visualizador', 'proexpensestest@gmail.com', '98765432-1'),
('fun3', '1234', 'visualizador', 'proexpensestest@gmail.com', '11111111-1'); 

--Insertar dato (fecha: aaaa-mm-dd (ISO8601))
INSERT INTO Rendicion (fecha_rendicion, rut_trabajador, nombre_trabajador, monto, tipo_gasto, estado, fecha_creacion, fecha_cierre, id_usuario)
VALUES
('2024-01-01', '12345678-9','Funcionario 1', 250000, 'Alimentación', 'Rechazada', '2024-01-07 00:00:00.000', '2024-01-09 00:00:00.000', 1),
('2024-02-15', '98765432-1','Funcionario 2', 60000, 'Combustible', 'Aceptada', '2024-02-27 00:00:00.000', '2024-03-01 00:00:00.000', 1),
('2024-12-20', '11111111-1','Funcionario 3', 15000, 'Transporte', 'Pendiente', '2024-12-21 00:00:00.000', NULL, 1); 

-- Insertar documentos relacionados con la rendición 1
INSERT INTO Documento (id_rendicion, url)
VALUES
(1, 'https://example.com/documento_rendicion1_1.pdf'),
(1, 'https://example.com/documento_rendicion1_2.pdf'); 

-- Insertar documentos relacionados con la rendición 2
INSERT INTO Documento (id_rendicion, url)
VALUES
(2, 'https://example.com/documento_rendicion2_1.pdf'); 

-- Insertar documentos relacionados con la rendición 3
INSERT INTO Documento (id_rendicion, url)
VALUES
(3, 'https://example.com/documento_rendicion3_1.pdf'),
(3, 'https://example.com/documento_rendicion3_2.pdf'),
(3, 'https://example.com/documento_rendicion3_3.pdf'); 

INSERT INTO tipo_gasto(nombre)
VALUES ('Alimentación'),
('Combustible'),
('Transporte'),
('Material de oficina'),
('Otros'); 

--Mostrar todos los usuarios
SELECT * FROM usuario; 

--Mostrar todas las rendiciones
SELECT * FROM rendicion; 

--Mostrar todos los documentos
SELECT * FROM documento; 

--Mostrar todos los tipos de gastos
SELECT * FROM tipo_gasto; 
