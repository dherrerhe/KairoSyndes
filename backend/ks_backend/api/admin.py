from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

class UserAdmin(BaseUserAdmin):
    # Campos que se muestran en la lista de usuarios
    list_display = ('nickname', 'email', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active', 'is_superuser')

    # Campos que aparecen en el formulario de edición
    fieldsets = (
        (None, {'fields': ('nickname', 'email', 'password')}),
        ('Información personal', {'fields': ('first_name', 'last_name', 'avatar')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas importantes', {'fields': ('last_login', 'created_at')}),
    )

    # Campos que aparecen al crear un usuario desde admin
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('nickname', 'email', 'first_name', 'last_name', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

    search_fields = ('nickname', 'email', 'first_name', 'last_name')
    ordering = ('nickname',)
    filter_horizontal = ('groups', 'user_permissions',)

# Registrar el modelo y el admin personalizado
admin.site.register(User, UserAdmin)
