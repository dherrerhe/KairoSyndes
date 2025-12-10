# Este backend personalizado permite autenticación usando email y password.
# Puedes autenticar así: authenticate(request, email=email, password=password)
from django.contrib.auth.backends import ModelBackend
from api.models import User

class EmailBackend(ModelBackend):
    """
    Autentica usando email y password.
    """
    def authenticate(self, request, email=None, password=None, **kwargs):
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None


