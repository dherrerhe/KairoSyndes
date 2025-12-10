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
# Vista de Registro
# ============================================

class RegisterView(APIView):
    permission_classes = [AllowAny]  # Cualquiera puede registrarse

    def post(self, request):
        """Registra un nuevo usuario"""
        # Obtener datos del request
        email = request.data.get("email")
        password = request.data.get("password")
        confirm_password = request.data.get("confirm_password")
        nickname = request.data.get("nickname")
        first_name = request.data.get("first_name", "")
        last_name = request.data.get("last_name", "")

        # ===== VALIDACIONES =====

        # 1. Validar que todos los campos obligatorios estén presentes
        if not email or not password or not confirm_password or not nickname:
            return Response(
                {"error": "Email, contraseña y nickname son obligatorios"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Validar que las contraseñas coincidan
        if password != confirm_password:
            return Response(
                {"error": "Las contraseñas no coinciden"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Validar que la contraseña tiene mínimo 6 caracteres
        if len(password) < 6:
            return Response(
                {"error": "La contraseña debe tener al menos 6 caracteres"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Validar que el email no esté registrado
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "El email ya está registrado"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5. Validar que el nickname no esté registrado
        if User.objects.filter(nickname=nickname).exists():
            return Response(
                {"error": "El nickname ya está registrado"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ===== CREAR USUARIO =====
        try:
            user = User.objects.create_user(
                email=email,
                nickname=nickname,
                password=password,
                first_name=first_name,
                last_name=last_name
            )

            return Response(
                {
                    "message": "Usuario registrado correctamente",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "nickname": user.nickname,
                        "first_name": user.first_name,
                        "last_name": user.last_name
                    }
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": f"Error al registrar usuario: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
        """Lista workflows del usuario autenticado"""
        workflows = Workflow.objects.filter(owner=request.user).order_by('-created_at')
        serializer = WorkflowSerializer(workflows, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Crea un nuevo workflow con el usuario como owner"""
        # No agregar owner al data, el serializer lo hará automáticamente
        serializer = WorkflowSerializer(
            data=request.data,
            context={'request': request} 
        )

        if serializer.is_valid():
            serializer.save()  # ← El serializer.create() asignará owner automáticamente
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
        """Actualiza un workflow (solo si es propietario)"""
        try:
            workflow = Workflow.objects.get(pk=pk, owner=request.user)
            
            # Obtener datos del request
            data = request.data.copy()
            
            # Si vienen nodos en el request, procesarlos
            nodes_data = data.pop('nodes', None)
            edges_data = data.pop('edges', None)
            
            # Actualizar campos básicos del workflow
            serializer = WorkflowSerializer(workflow, data=data, partial=True)
            
            if serializer.is_valid():
                # Guardar workflow
                workflow = serializer.save()
                
                # Guardar nodos si vienen en el request
                if nodes_data is not None:
                    for node_data in nodes_data:
                        node_id = node_data.get('id')
                        if node_id:
                            try:
                                node = Node.objects.get(id=node_id, workflow=workflow)
                                # Actualizar posición y datos
                                node.position = node_data.get('position', node.position)
                                node.data = node_data.get('data', node.data)
                                node.node_type = node_data.get('node_type', node.node_type)
                                node.save()
                            except Node.DoesNotExist:
                                # Crear nodo si no existe
                                Node.objects.create(
                                    workflow=workflow,
                                    id=node_id,
                                    position=node_data.get('position', {}),
                                    data=node_data.get('data', {}),
                                    node_type=node_data.get('node_type', 'custom')
                                )
                
                # Guardar edges si vienen en el request
                if edges_data is not None:
                    for edge_data in edges_data:
                        edge_id = edge_data.get('id')
                        if edge_id:
                            try:
                                edge = Edge.objects.get(id=edge_id, workflow=workflow)
                                edge.label = edge_data.get('label', edge.label)
                                edge.data = edge_data.get('data', edge.data)
                                edge.save()
                            except Edge.DoesNotExist:
                                # Crear edge si no existe
                                Edge.objects.create(
                                    workflow=workflow,
                                    id=edge_id,
                                    source_id=edge_data.get('source'),
                                    target_id=edge_data.get('target'),
                                    label=edge_data.get('label', ''),
                                    data=edge_data.get('data', {})
                                )
                
                # Retornar workflow actualizado con nodos y edges
                workflow_serialized = WorkflowSerializer(workflow, context={'request': request})
                return Response(
                    {"message": "Workflow actualizado.", "workflow": workflow_serialized.data},
                    status=status.HTTP_200_OK
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Workflow.DoesNotExist:
            return Response(
                {"error": "Workflow no encontrado o no tienes permiso"},
                status=status.HTTP_403_FORBIDDEN
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

    def patch(self, request, pk):
        """
        Actualiza un workflow (solo si es propietario).
        Puede actualizar nodos y edges asociados en lote.
        """
        try:
            workflow = Workflow.objects.get(pk=pk, owner=request.user)
        except Workflow.DoesNotExist:
            return Response(
                {"error": "Workflow no encontrado o no tienes permisos"},
                status=status.HTTP_404_NOT_FOUND
            )

        data = request.data.copy()
        nodes_data = data.pop('nodes', None)
        edges_data = data.pop('edges', None)

        serializer = WorkflowSerializer(workflow, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        workflow = serializer.save()

        # ACTUALIZACIÓN/CREACIÓN MASIVA DE NODOS
        node_results = []
        if nodes_data is not None:
            for node_data in nodes_data:
                node_id = node_data.get('id')
                try:
                    node = Node.objects.get(id=node_id, workflow=workflow)
                    node.position = node_data.get('position', node.position)
                    node_data_field = node_data.get('data', {})
                    # Actualizar campos individualmente por robustez
                    node_data_dict = node.data if node.data else {}
                    node.data = {
                        'name': node_data_field.get('name', node_data_dict.get('name', '')),
                        'time': node_data_field.get('time', node_data_dict.get('time', '')),
                        'inCharge': node_data_field.get('inCharge', node_data_dict.get('inCharge', '')),
                        'description': node_data_field.get('description', node_data_dict.get('description', '')),
                        # El color seleccionado en el canvas debe venir en node_data_field['color'], que tiene prioridad si existe.
                        'color': node_data_field['color'] if 'color' in node_data_field else node_data_dict.get('color', '#4CAF50'),
                        'ip': node_data_field.get('ip', node_data_dict.get('ip', '')),
                        'progress': node_data_field.get('progress', node_data_dict.get('progress', 0))
                    }
                    node.node_type = node_data.get('node_type', node.node_type)
                    node.save()
                    node_results.append({'id': node.id, 'status': 'updated'})
                except Node.DoesNotExist:
                    n = Node.objects.create(
                        workflow=workflow,
                        id=node_id,
                        position=node_data.get('position', {}),
                        data=node_data.get('data', {}),
                        node_type=node_data.get('node_type', 'custom')
                    )
                    node_results.append({'id': n.id, 'status': 'created'})

        # ACTUALIZACIÓN/CREACIÓN MASIVA DE EDGES
        edge_results = []
        if edges_data is not None:
            for edge_data in edges_data:
                edge_id = edge_data.get('id')
                try:
                    edge = Edge.objects.get(id=edge_id, workflow=workflow)
                    edge.label = edge_data.get('label', edge.label)
                    edge_data_field = edge_data.get('data', {})
                    edge.data = {
                        'edge_type': edge_data_field.get('edge_type', edge.data.get('edge_type', 'default')),
                        'animated': edge_data_field.get('animated', edge.data.get('animated', False)),
                        'style': edge_data_field.get('style', edge.data.get('style', {}))
                    }
                    # source y target pueden venir como enteros o dicts
                    source_id = (
                        edge_data.get('source')
                        if isinstance(edge_data.get('source'), int) or isinstance(edge_data.get('source'), str)
                        else edge_data.get('source', {}).get('id')
                    )
                    target_id = (
                        edge_data.get('target')
                        if isinstance(edge_data.get('target'), int) or isinstance(edge_data.get('target'), str)
                        else edge_data.get('target', {}).get('id')
                    )
                    if source_id: edge.source_id = source_id
                    if target_id: edge.target_id = target_id
                    edge.save()
                    edge_results.append({'id': edge.id, 'status': 'updated'})
                except Edge.DoesNotExist:
                    # Si faltan source o target, ignorar la creación
                    source_id = (
                        edge_data.get('source')
                        if isinstance(edge_data.get('source'), int) or isinstance(edge_data.get('source'), str)
                        else edge_data.get('source', {}).get('id')
                    )
                    target_id = (
                        edge_data.get('target')
                        if isinstance(edge_data.get('target'), int) or isinstance(edge_data.get('target'), str)
                        else edge_data.get('target', {}).get('id')
                    )
                    if source_id and target_id:
                        e = Edge.objects.create(
                            workflow=workflow,
                            id=edge_id,
                            source_id=source_id,
                            target_id=target_id,
                            label=edge_data.get('label', ''),
                            data=edge_data.get('data', {}),
                        )
                        edge_results.append({'id': e.id, 'status': 'created'})

        # Respuesta con estado y detalles de nodos/edges
        return Response({
            "message": "Workflow actualizado correctamente.",
            "workflow": WorkflowSerializer(workflow).data,
            "nodes_status": node_results,
            "edges_status": edge_results,
        }, status=status.HTTP_200_OK)

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


# ============================================
# Bulk Update de Nodos y Edges
# ============================================

class NodeBulkUpdateView(APIView):
    """Actualizar múltiples nodos a la vez (para auto-save)"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, workflow_id):
        """Actualiza múltiples nodos"""
        try:
            workflow = Workflow.objects.get(pk=workflow_id, owner=request.user)
        except Workflow.DoesNotExist:
            return Response(
                {"error": "Workflow no encontrado"},
                status=status.HTTP_403_FORBIDDEN
            )

        nodes_data = request.data.get('nodes', [])
        updated_nodes = []

        for node_data in nodes_data:
            node_id = node_data.get('id')
            try:
                node = Node.objects.get(pk=node_id, workflow=workflow)
                # Actualizar posición
                if 'position' in node_data:
                    node.position = node_data['position']
                # Actualizar datos
                if 'data' in node_data:
                    node.data = node_data['data']
                node.save()
                updated_nodes.append(NodeSerializer(node).data)
            except Node.DoesNotExist:
                continue

        return Response(
            {"message": f"{len(updated_nodes)} nodos actualizados", "nodes": updated_nodes},
            status=status.HTTP_200_OK
        )


class EdgeBulkUpdateView(APIView):
    """Actualizar múltiples edges a la vez (para auto-save)"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, workflow_id):
        """Actualiza múltiples edges"""
        try:
            workflow = Workflow.objects.get(pk=workflow_id, owner=request.user)
        except Workflow.DoesNotExist:
            return Response(
                {"error": "Workflow no encontrado"},
                status=status.HTTP_403_FORBIDDEN
            )

        edges_data = request.data.get('edges', [])
        updated_edges = []

        for edge_data in edges_data:
            edge_id = edge_data.get('id')
            try:
                edge = Edge.objects.get(pk=edge_id, workflow=workflow)
                # Actualizar label
                if 'label' in edge_data:
                    edge.label = edge_data['label']
                # Actualizar datos
                if 'data' in edge_data:
                    edge.data = edge_data['data']
                edge.save()
                updated_edges.append(EdgeSerializer(edge).data)
            except Edge.DoesNotExist:
                continue

        return Response(
            {"message": f"{len(updated_edges)} edges actualizados", "edges": updated_edges},
            status=status.HTTP_200_OK
        )            