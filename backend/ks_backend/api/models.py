
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from django.contrib.auth.hashers import make_password

# ===========================
# User Manager & User Model
# ===========================

class UserManager(BaseUserManager):
    """
    Manager personalizado para el modelo User.
    Gestiona la creación de usuarios regulares y superusuarios.
    """
    # Permite que este manager esté disponible durante las migraciones de BD
    use_in_migrations = True

    def create_user(self, email, nickname, password=None, **extra_fields):
        """
        Crea y guarda un usuario regular con email, nickname y contraseña.
        
        Args:
            email: Correo electrónico del usuario
            nickname: Apodo/nombre de usuario
            password: Contraseña (opcional)
            **extra_fields: Campos adicionales del modelo User
            
        Returns:
            User: Instancia del usuario creado
            
        Raises:
            ValueError: Si falta nickname o email
        """
        # Validar que el nickname no esté vacío
        if not nickname:
            raise ValueError('El usuario debe tener un nickname')
        
        # Validar que el email no esté vacío
        if not email:
            raise ValueError('El usuario debe tener un email')
        
        # Normalizar el email (convierte el dominio a minúsculas)
        email = self.normalize_email(email)
        
        # Crear la instancia del modelo User con los datos proporcionados
        user = self.model(email=email, nickname=nickname, **extra_fields)
        
        # Hashear la contraseña antes de guardarla (seguridad)
        user.set_password(password)
        
        # Guardar el usuario en la base de datos
        user.save(using=self._db)

        return user

    def create_superuser(self, email, nickname, password=None, **extra_fields):
        """
        Crea y guarda un superusuario con permisos administrativos.
        
        Args:
            email: Correo electrónico del superusuario
            nickname: Apodo/nombre del superusuario
            password: Contraseña (opcional)
            **extra_fields: Campos adicionales del modelo User
            
        Returns:
            User: Instancia del superusuario creado
        """
        # Establecer flags de permisos administrativos por defecto
        # setdefault solo asigna si la clave no existe en extra_fields
        extra_fields.setdefault('is_staff', True)      # Acceso al admin de Django
        extra_fields.setdefault('is_superuser', True)   # Todos los permisos
        
        # Reutilizar la lógica de create_user para crear el superusuario
        return self.create_user(email, nickname, password, **extra_fields)


# Modelo de usuario personalizado que extiende AbstractUser de Django
class User(AbstractUser):
    """
    Modelo de usuario personalizado para el sistema.
    Usa email como identificador principal en lugar de username.
    """
    
    # === DESACTIVACIÓN DEL CAMPO USERNAME ===
    # Establece username en None para desactivar el campo heredado de AbstractUser. Esto permite usar email como identificador único.
    username = None
    
    # === CAMPOS DE IDENTIFICACIÓN ===
    # Apodo/nombre de usuario único para mostrar en la aplicación.
    nickname = models.CharField(max_length=30, unique=True)
    
    # Nombre del usuario (máximo 30 caracteres).
    first_name = models.CharField(max_length=30)
    
    # Apellido del usuario (máximo 30 caracteres).
    last_name = models.CharField(max_length=30)
    
    # Email único que servirá como identificador de autenticación.
    email = models.EmailField(unique=True)

    # === CAMPOS DE METADATOS ===
    # Fecha y hora de creación del usuario (con zona horaria).
    # timezone.now asegura que la fecha sea timezone-aware.
    created_at = models.DateTimeField(default=timezone.now)
    
    # Indica si la cuenta está activa (permite desactivar sin eliminar).
    is_active = models.BooleanField(default=True)
    
    # Indica si el usuario puede acceder al panel de administración.
    is_staff = models.BooleanField(default=False)
    
    # Imagen de perfil del usuario (opcional).
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    # === CONFIGURACIÓN DE AUTENTICACIÓN ===
    # Define 'email' como el campo para iniciar sesión (en lugar de username).
    USERNAME_FIELD = 'email'
    
    # Campos requeridos al crear un superusuario por línea de comandos.(además de USERNAME_FIELD y password que son obligatorios por defecto).
    REQUIRED_FIELDS = ['nickname', 'first_name', 'last_name']

    # === MANAGER PERSONALIZADO ===
    # Asigna el UserManager personalizado para manejar la creación de usuarios. Este manager sabe cómo crear usuarios usando email en lugar de username.
    objects = UserManager()

    def __str__(self):
        return self.nickname

    def get_short_name(self) -> str:
        return self.nickname

    def get_full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def get_email(self) -> str:
        return self.email

    def get_is_active(self) -> bool:
        return self.is_active

    def get_is_staff(self) -> bool:
        return self.is_staff

    def get_created_at(self) -> timezone.datetime:
        return self.created_at

    # Setters
    def set_is_active(self, is_active: bool) -> None:
        self.is_active = is_active
        self.save()

    def set_is_staff(self, is_staff: bool) -> None:
        self.is_staff = is_staff
        self.save()

    def set_created_at(self, created_at: timezone.datetime) -> None:
        self.created_at = created_at
        self.save()

    def set_nickname(self, nickname: str) -> None:
        if not nickname:
            raise ValueError("El nickname no puede estar vacío.")
        if len(nickname) > 25:
            raise ValueError("El nickname no puede tener más de 25 caracteres.")
        self.nickname = nickname
        self.save()

    def set_first_name(self, first_name: str) -> None:
        self.first_name = first_name
        self.save()

    def set_last_name(self, last_name: str) -> None:
        self.last_name = last_name
        self.save()

    def set_email(self, email: str) -> None:
        if not email:
            raise ValueError("El email no puede estar vacío.")
        self.email = email
        self.save()

    def set_password(self, password: str) -> None:
        self.password = make_password(password)
        self.save()

    # Métodos de estado
    def activate(self) -> None:
        self.set_is_active(True)

    def deactivate(self) -> None:
        self.set_is_active(False)

    # Actualización de usuario
    def update_user(self, **kwargs):
        allowed_fields = ['nickname', 'first_name', 'last_name', 'email', 'password', 'is_active', 'is_staff', 'avatar']
        for field, value in kwargs.items():
            if field in allowed_fields:
                if field == 'password':
                    self.set_password(value)
                else:
                    setattr(self, field, value)
        self.save()

    def get_user_info(self) -> dict:
        return {
            'id': self.id,
            'nickname': self.nickname,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'created_at': self.created_at,
            'is_active': self.is_active,
            'is_staff': self.is_staff,
            'avatar': self.avatar.url if self.avatar else None,
        }

    def save(self, *args, **kwargs):
        """
        Guardado personalizado por si deseas extender funcionalidad antes/después.
        Llama al save de AbstractUser (superclase).
        """
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

# =================
# Workflow Model
# =================

class Workflow(models.Model):
    name = models.CharField(max_length=255, default="Untitled Workflow")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workflows', default=1)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (by {self.owner.nickname})"
    
    class Meta:
        verbose_name = "Workflow"
        verbose_name_plural = "Workflows"
        ordering = ['-created_at']

# ===================================================
# MODELOS IMPORTANTES AGREGADOS
# ===================================================

class Node(models.Model):
    """
    Nodo individual para un workflow. Representa una tarea/paso específico.
    """
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='nodes')
    node_type = models.CharField(max_length=50, default='custom')  # tipo (custom, normal, etc.)
    position = models.JSONField(default=dict)  # {'x': ..., 'y': ...}
    data = models.JSONField(default=dict)      # metadatos específicos del nodo (etiqueta, nombre, inCharge, etc.)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Node {self.id} in {self.workflow.name}"
    
    class Meta:
        verbose_name = "Nodo"
        verbose_name_plural = "Nodos"
        ordering = ['id']

class Edge(models.Model):
    """
    Conexión/relación (arista) entre dos nodos de un workflow.
    """
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='edges')
    source = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='edges_out')
    target = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='edges_in')
    label = models.CharField(max_length=100, blank=True, default="")
    data = models.JSONField(default=dict, blank=True)  # Info extra de la arista (puede estar vacío)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Edge {self.id} ({self.source_id} -> {self.target_id}) in {self.workflow.name}"

    class Meta:
        verbose_name = "Arista"
        verbose_name_plural = "Aristas"
        ordering = ['id']

# =======================================
# (Opcional) Permitir compartir workflows
# =======================================

class WorkflowShare(models.Model):
    """
    Permite compartir un workflow con otro usuario (sólo lectura o edición).
    """
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name='shares')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_workflows')
    can_edit = models.BooleanField(default=False)
    shared_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('workflow', 'user')
        verbose_name = "Compartir Workflow"
        verbose_name_plural = "Compartidos Workflows"

    def __str__(self):
        return f"{self.workflow.name} compartido con {self.user.nickname}"
