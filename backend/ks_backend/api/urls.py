# api/urls.py
import django
from django.urls import path
from .views import LoginView, WorkflowListCreateView, WorkflowDetailView

urlpatterns = [
    path('login/', LoginView.as_view(), name="api-login"),
    
    # Endpoints de workflows
    path('workflows/', WorkflowListCreateView.as_view(), name="workflows-list-create"),
    path('workflows/<int:pk>/', WorkflowDetailView.as_view(), name="workflow-detail"),
]