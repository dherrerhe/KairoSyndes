from django.test import TestCase
from api.models import User

class UserModelTest(TestCase):
    def test_user_creation_and_methods(self):
        # Crear usuario usando el manager personalizado
        user = User.objects.create_user(
            nickname="prueba123",
            email="prueba@email.com",
            password="s3creta123"
        )

        # Verificar nickname y método get_short_name
        self.assertEqual(user.nickname, "prueba123")
        self.assertEqual(user.get_short_name(), "prueba123")

        # Actualizar nombre y apellido usando update_user
        user.update_user(first_name="Juan", last_name="Pérez")
        self.assertEqual(user.first_name, "Juan")
        self.assertEqual(user.last_name, "Pérez")

        # Verificar get_user_info
        info = user.get_user_info()
        self.assertEqual(info['nickname'], "prueba123")
        self.assertEqual(info['first_name'], "Juan")
        self.assertEqual(info['last_name'], "Pérez")

        # Cambiar contraseña usando set_password y verificar
        user.set_password("nueva_clave456")
        self.assertTrue(user.check_password("nueva_clave456"))

        # Probar deactivate y activate
        user.deactivate()
        self.assertFalse(user.is_active)
        user.activate()
        self.assertTrue(user.is_active)
