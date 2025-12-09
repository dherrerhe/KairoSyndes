# api/urls.py

from django.urls import path
from .views import (
    LoginView,
    RegisterView,
    WorkflowListCreateView,
    WorkflowDetailView,
    NodeListCreateView,
    NodeDetailView,
    EdgeListCreateView,
    EdgeDetailView,
    NodeBulkUpdateView,
    EdgeBulkUpdateView,
)


urlpatterns = [
    # Auth
    path('login/', LoginView.as_view(), name="api-login"),
    path('register/', RegisterView.as_view(), name="api-register"),
    
    # Workflows
    path('workflows/', WorkflowListCreateView.as_view(), name="workflows-list-create"),
    path('workflows/<int:pk>/', WorkflowDetailView.as_view(), name="workflow-detail"),
    
    # Nodes
    path('workflows/<int:workflow_id>/nodes/', NodeListCreateView.as_view(), name="nodes-list-create"),
    path('workflows/<int:workflow_id>/nodes/<int:node_id>/', NodeDetailView.as_view(), name="node-detail"),
    
    # Edges
    path('workflows/<int:workflow_id>/edges/', EdgeListCreateView.as_view(), name="edges-list-create"),
    path('workflows/<int:workflow_id>/edges/<int:edge_id>/', EdgeDetailView.as_view(), name="edge-detail"),

    # (Bulk Update)
    path('workflows/<int:workflow_id>/nodes/bulk-update/', NodeBulkUpdateView.as_view(), name="nodes-bulk-update"),
    path('workflows/<int:workflow_id>/edges/bulk-update/', EdgeBulkUpdateView.as_view(), name="edges-bulk-update"),
]
