# api/views.py
from rest_framework.permissions import AllowAny, IsAuthenticated
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
        email = request.data.get("email")
        password = request.data.get("password")

        user = authenticate(request, email=email, password=password)
        if user is not None:
            if user.is_active:
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    "token": token.key,
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "nickname": user.nickname,
                        "full_name": user.get_full_name()
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Usuario desactivado"}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)


class WorkflowListCreateView(APIView):
    """
    GET: Lista todos los workflows
    POST: Crea un nuevo workflow
    """
    # permission_classes = [IsAuthenticated]  # Descomenta cuando tengas auth

    def get(self, request):
        """Lista todos los workflows"""
        workflows = Workflow.objects.all().order_by('-created_at')
        serializer = WorkflowSerializer(workflows, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Crea un nuevo workflow"""
        serializer = WorkflowSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Workflow creado correctamente.", "workflow": serializer.data},
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkflowDetailView(APIView):
    """
    GET: Obtiene un workflow específico
    PATCH: Actualiza un workflow
    DELETE: Elimina un workflow
    """
    # permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Obtiene un workflow por ID"""
        try:
            workflow = Workflow.objects.get(pk=pk)
            serializer = WorkflowSerializer(workflow)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Workflow.DoesNotExist:
            return Response(
                {"error": "Workflow no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, pk):
        """Actualiza un workflow parcialmente"""
        try:
            workflow = Workflow.objects.get(pk=pk)
            serializer = WorkflowSerializer(workflow, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {"message": "Workflow actualizado.", "workflow": serializer.data},
                    status=status.HTTP_200_OK
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Workflow.DoesNotExist:
            return Response(
                {"error": "Workflow no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, pk):
        """Elimina un workflow"""
        try:
            workflow = Workflow.objects.get(pk=pk)
            workflow.delete()
            return Response(
                {"message": "Workflow eliminado correctamente"},
                status=status.HTTP_204_NO_CONTENT
            )
        except Workflow.DoesNotExist:
            return Response(
                {"error": "Workflow no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )