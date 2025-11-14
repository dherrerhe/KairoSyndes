# serializers.py
from rest_framework import serializers
from .models import User, Workflow, Node, Edge


# Serializador para el modelo User
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "nickname",
            "email",
            "first_name",
            "last_name",
            "created_at",
            "is_active",
            "is_staff",
            "avatar"
        ]
        read_only_fields = ["id", "created_at", "is_staff"]


# Serializador para la creación de usuario
class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["nickname", "email", "first_name", "last_name", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            nickname=validated_data["nickname"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"]
        )
        return user


# Serializador para Node
class NodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Node
        fields = [
            'id',
            'workflow',
            'node_type',
            'position',
            'data',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# Serializador para Edge
class EdgeSerializer(serializers.ModelSerializer):
    # Mostrar los IDs de los nodos (no los objetos completos)
    source = serializers.PrimaryKeyRelatedField(queryset=Node.objects.all())
    target = serializers.PrimaryKeyRelatedField(queryset=Node.objects.all())
    
    class Meta:
        model = Edge
        fields = [
            'id',
            'workflow',
            'source',
            'target',
            'label',
            'data',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# Serializador para Workflow (actualizado para incluir nodes y edges)
class WorkflowSerializer(serializers.ModelSerializer):
    nodes = NodeSerializer(many=True, read_only=True)
    edges = EdgeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Workflow
        fields = ['id', 'name', 'data', 'created_at', 'nodes', 'edges']
        read_only_fields = ['id', 'created_at', 'nodes', 'edges']