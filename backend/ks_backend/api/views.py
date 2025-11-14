# api/views.py
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from api.models import User
from rest_framework.views import APIView
from rest_framework import status
from .models import Workflow
from .serializers import WorkflowSerializer


# Vista para login de usuario.
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Obtiene el email y la contraseña desde el cuerpo de la petición
        email = request.data.get("email")
        password = request.data.get("password")

        # Autentica el usuario usando las credenciales dadas
        user = authenticate(request, email=email, password=password)
        if user is not None:
            # Verifica si el usuario está activo
            if user.is_active:
                # Si el usuario existe y está activo, obtiene o crea el Token para autenticación
                token, created = Token.objects.get_or_create(user=user)
                return Response({"token": token.key}, status=status.HTTP_200_OK)
            else:
                # El usuario existe pero está desactivado
                return Response({"error": "Usuario desactivado"}, status=status.HTTP_403_FORBIDDEN)
        else:
            # Credenciales incorrectas
            return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)


class WorkflowCreateView(APIView):

    def post(self, request):
        """
        Guarda un nuevo workflow proveniente del canvas de ReactFlow.
        Espera un JSON con 'name' y 'data'.
        """
        serializer = WorkflowSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Workflow guardado correctamente.", "workflow": serializer.data},
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """
        Lista todos los workflows guardados.
        """
        workflows = Workflow.objects.all()
        serializer = WorkflowSerializer(workflows, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

