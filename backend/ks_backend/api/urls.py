import django
from django.urls import path
from .views import LoginView
from .views import WorkflowCreateView

urlpatterns = [
   path('login/',  LoginView.as_view(), name="api-login"),
   path("workflow/", WorkflowCreateView.as_view(), name="workflow"),
]
