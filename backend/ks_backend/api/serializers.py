# serializers.py
from rest_framework import serializers
from .models import User
from .models import Workflow


# Serializador para el modelo User: expone campos básicos para consulta de usuario
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",                # ID único del usuario (autogenerado, solo lectura)
            "nickname",          # Apodo del usuario
            "email",             # Email del usuario
            "first_name",        # Nombre
            "last_name",         # Apellido
            "created_at",        # Fecha de creación (solo lectura)
            "is_active",         # ¿Está activo?
            "is_staff",          # ¿Es staff? (solo lectura aquí)
            "avatar"             # Imagen de perfil
        ]
        read_only_fields = ["id", "created_at", "is_staff"]  # Estos campos no se pueden modificar desde la API

# Serializador para la creación de usuario: restringido solo a los campos necesarios para el registro
class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["nickname", "email", "first_name", "last_name", "password"]   # No se exponen otros campos aquí

    # Sobreescribe el método create para usar la función personalizada de creación de usuario
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],               # Email del usuario
            nickname=validated_data["nickname"],         # Apodo
            password=validated_data["password"],         # Contraseña
            first_name=validated_data["first_name"],     # Nombre
            last_name=validated_data["last_name"]        # Apellido
        )
        return user

# Serializador para el modelo Workflow
class WorkflowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workflow
        fields = ['id', 'name', 'data', 'created_at']   # Exposición básica de datos de workflow

