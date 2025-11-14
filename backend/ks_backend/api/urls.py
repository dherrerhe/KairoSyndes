import django
from django.urls import path
from .views import LoginView
from .views import WorkflowCreateView
from .views import WorkflowDetailUpdateView

urlpatterns = [
   path('login/',  LoginView.as_view(), name="api-login"),
   path("workflow/", WorkflowCreateView.as_view(), name="workflow"),
    path("workflow/<int:pk>/", WorkflowDetailUpdateView.as_view(), name="workflow-detail"),
]

