import unittest
from fastapi.testclient import TestClient
from datetime import date
import psycopg2

# Importar la aplicación y la conexión base desde el paquete API
from API.main import app
from API.utils import conn as base_conn  # solo para extraer config, no usar directamente

def get_new_connection():
    # Crear nueva conexión con los mismos parámetros que base_conn
    # Ajusta los datos según tu configuración real
    return psycopg2.connect(
        dbname="proyecto_db",
        user="ayds123",
        password="ayds123",
        host="db",
        port="5432"
    )

class TestCreateRendicion(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.conn = get_new_connection()
        cls.cur = cls.conn.cursor()
        cls.created_ids = []
        # Insertar usuario de prueba
        cls.cur.execute(
            "INSERT INTO Usuario (usuario, contrasenia, rol) VALUES (%s, %s, %s) RETURNING id;",
            ('test_user', 'test_pass', 'trabajador')
        )
        cls.conn.commit()
        cls.user_id = cls.cur.fetchone()[0]

    @classmethod
    def tearDownClass(cls):
        try:
            # Eliminar todas las rendiciones asociadas al usuario (evitar FK violation)
            cls.cur.execute("DELETE FROM rendicion WHERE id_usuario = %s;", (cls.user_id,))
            # Luego eliminar usuario
            cls.cur.execute("DELETE FROM Usuario WHERE id = %s;", (cls.user_id,))
            cls.conn.commit()
        except Exception as e:
            cls.conn.rollback()
            raise e
        finally:
            cls.cur.close()
            cls.conn.close()

    def test_create_rendicion_success(self):
        payload = {
            "fecha": date.today().isoformat(),
            "trabajador": "Juan Perez",
            "area": "Finanzas",
            "monto": 150.75,
            "actividad": "Compra de insumos",
            "estado": "Pendiente",
            "id_usuario": self.user_id
        }
        response = self.client.post("/rendiciones", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("id", data)
        TestCreateRendicion.created_ids.append(data["id"])

    def test_create_rendicion_invalid_monto(self):
        payload = {
            "fecha": date.today().isoformat(),
            "trabajador": "Ana Gomez",
            "area": "Compras",
            "monto": -50.00,
            "actividad": "Reembolso",
            "estado": "Pendiente",
            "id_usuario": self.user_id
        }
        response = self.client.post("/rendiciones", json=payload)
        self.assertNotEqual(response.status_code, 200)
        self.assertIn(response.status_code, (400, 422))


class TestLogin(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.conn = get_new_connection()
        cls.cur = cls.conn.cursor()
        cls.cur.execute(
            "INSERT INTO Usuario (usuario, contrasenia, rol) VALUES (%s, %s, %s) RETURNING id;",
            ('login_user', 'login_pass', 'contador')
        )
        cls.conn.commit()
        cls.user_id = cls.cur.fetchone()[0]

    @classmethod
    def tearDownClass(cls):
        try:
            cls.cur.execute("DELETE FROM Usuario WHERE id = %s;", (cls.user_id,))
            cls.conn.commit()
        except Exception as e:
            cls.conn.rollback()
            raise e
        finally:
            cls.cur.close()
            cls.conn.close()

    def test_login_success(self):
        payload = {"usuario": "login_user", "contrasenia": "login_pass"}
        response = self.client.post("/login", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("usuario"), "login_user")
        self.assertEqual(data.get("rol"), "contador")

    def test_login_invalid_credentials(self):
        payload = {"usuario": "login_user", "contrasenia": "wrong_pass"}
        response = self.client.post("/login", json=payload)
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertIn("detail", data)


if __name__ == '__main__':
    unittest.main()