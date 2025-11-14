# api/views.py - INICIO DEL ARCHIVO

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from api.models import User, Workflow, Node, Edge
from rest_framework.views import APIView
from rest_framework import status
from .serializers import WorkflowSerializer, NodeSerializer, EdgeSerializer

# ============================================
# Vista de Login
# ============================================

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


# ============================================
# Vistas de Workflows
# ============================================

class WorkflowListCreateView(APIView):
    """
    GET: Lista todos los workflows
    POST: Crea un nuevo workflow
    """
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

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


# ============================================
# Vistas para NODES
# ============================================

class NodeListCreateView(APIView):
    """
    GET: Obtiene todos los nodos de un workflow
    POST: Crea un nuevo nodo en el workflow
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, workflow_id):
        """Obtiene todos los nodos de un workflow"""
        try:
            workflow = Workflow.objects.get(pk=workflow_id)
            nodes = workflow.nodes.all().order_by('id')
            serializer = NodeSerializer(nodes, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Workflow.DoesNotExist:
            return Response(
                {"error": "Workflow no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request, workflow_id):
        """Crea un nuevo nodo"""
        try:
            workflow = Workflow.objects.get(pk=workflow_id)
            
            # Agregar workflow al request data
            data = request.data.copy()
            data['workflow'] = workflow.id
            
            serializer = NodeSerializer(data=data)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Workflow.DoesNotExist:
            return Response(
                {"error": "Workflow no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )


class NodeDetailView(APIView):
    """
    GET: Obtiene un nodo específico
    PATCH: Actualiza un nodo
    DELETE: Elimina un nodo
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, workflow_id, node_id):
        """Obtiene un nodo específico"""
        try:
            node = Node.objects.get(pk=node_id, workflow_id=workflow_id)
            serializer = NodeSerializer(node)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Node.DoesNotExist:
            return Response(
                {"error": "Nodo no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, workflow_id, node_id):
        """Actualiza un nodo"""
        try:
            node = Node.objects.get(pk=node_id, workflow_id=workflow_id)
            serializer = NodeSerializer(node, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Node.DoesNotExist:
            return Response(
                {"error": "Nodo no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, workflow_id, node_id):
        """Elimina un nodo y sus edges asociados"""
        try:
            node = Node.objects.get(pk=node_id, workflow_id=workflow_id)
            node.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Node.DoesNotExist:
            return Response(
                {"error": "Nodo no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )


# ============================================
# Vistas para EDGES
# ============================================

class EdgeListCreateView(APIView):
    """
    GET: Obtiene todos los edges de un workflow
    POST: Crea un nuevo edge
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, workflow_id):
        """Obtiene todos los edges de un workflow"""
        try:
            workflow = Workflow.objects.get(pk=workflow_id)
            edges = workflow.edges.all().order_by('id')
            serializer = EdgeSerializer(edges, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Workflow.DoesNotExist:
            return Response(
                {"error": "Workflow no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request, workflow_id):
        """Crea un nuevo edge"""
        try:
            workflow = Workflow.objects.get(pk=workflow_id)
            
            data = request.data.copy()
            data['workflow'] = workflow.id
            
            serializer = EdgeSerializer(data=data)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Workflow.DoesNotExist:
            return Response(
                {"error": "Workflow no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )


class EdgeDetailView(APIView):
    """
    GET: Obtiene un edge específico
    PATCH: Actualiza un edge
    DELETE: Elimina un edge
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, workflow_id, edge_id):
        """Obtiene un edge específico"""
        try:
            edge = Edge.objects.get(pk=edge_id, workflow_id=workflow_id)
            serializer = EdgeSerializer(edge)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Edge.DoesNotExist:
            return Response(
                {"error": "Edge no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, workflow_id, edge_id):
        """Actualiza un edge"""
        try:
            edge = Edge.objects.get(pk=edge_id, workflow_id=workflow_id)
            serializer = EdgeSerializer(edge, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Edge.DoesNotExist:
            return Response(
                {"error": "Edge no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, workflow_id, edge_id):
        """Elimina un edge"""
        try:
            edge = Edge.objects.get(pk=edge_id, workflow_id=workflow_id)
            edge.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Edge.DoesNotExist:
            return Response(
                {"error": "Edge no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )