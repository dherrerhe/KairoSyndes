// src/pages/Home.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';  
import { workflowApi } from '../api/workflowApi';
import { useFeedback, FeedbackDisplay } from '../hooks/useFeedback';

const TEMPLATES = [
  {
    id: 'tpl-empty',
    name: 'Blank (Vacío)',
    nodes: [],
    edges: []
  },
  {
    id: 'tpl-simple',
    name: 'Plantilla simple (3 nodos)',
    nodes: [
      { id: 'n1', type: 'custom', position: { x: 50, y: 20 }, data: { name: 'Inicio', time: '1h', inCharge: 'Usuario A', progress: 0 } },
      { id: 'n2', type: 'custom', position: { x: 250, y: 120 }, data: { name: 'Proceso', time: '2h', inCharge: 'Usuario B', progress: 0 } },
      { id: 'n3', position: { x: 450, y: 20 }, data: { label: 'Fin' } }
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', label: 'dependencia' },
      { id: 'e2', source: 'n2', target: 'n3', label: 'siguiente' }
    ]
  },
  {
    id: 'tpl-complex',
    name: 'Plantilla compleja (5 nodos)',
    nodes: [
      { id: 'n1', type: 'custom', position: { x: 100, y: 50 }, data: { name: 'Inicio', time: '1h', inCharge: 'A', progress: 0 } },
      { id: 'n2', type: 'custom', position: { x: 300, y: 50 }, data: { name: 'Tarea 1', time: '2h', inCharge: 'B', progress: 0 } },
      { id: 'n3', type: 'custom', position: { x: 300, y: 200 }, data: { name: 'Tarea 2', time: '3h', inCharge: 'C', progress: 0 } },
      { id: 'n4', type: 'custom', position: { x: 500, y: 125 }, data: { name: 'Revisión', time: '1h', inCharge: 'D', progress: 0 } },
      { id: 'n5', position: { x: 700, y: 125 }, data: { label: 'Fin' } }
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', label: 'inicio' },
      { id: 'e2', source: 'n1', target: 'n3', label: 'paralelo' },
      { id: 'e3', source: 'n2', target: 'n4', label: 'siguiente' },
      { id: 'e4', source: 'n3', target: 'n4', label: 'convergencia' },
      { id: 'e5', source: 'n4', target: 'n5', label: 'fin' }
    ]
  }
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { feedback, showSuccess, showError, showLoading, hideFeedback } = useFeedback();

  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [modalError, setModalError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null); // {id, name}
  const [isDeleting, setIsDeleting] = useState(false);

  const userEmail = user?.email || localStorage.getItem('user_email') || 'Usuario';

  // Cargar workflows
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await workflowApi.fetchAllWorkflows();
      setWorkflows(data);
    } catch (err) {
      console.error('Error cargando workflows:', err);
      const errorMsg = 'No se pudieron cargar los workflows';
      setError(errorMsg + '. ' + err.message);
      showError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Crear workflow
  const openNewWorkflowModal = () => {
    setName('');
    setSelectedTemplate(TEMPLATES[0].id);
    setModalError('');
    setShowModal(true);
  };

  const createWorkflow = async () => {
    if (!name.trim()) {
      setModalError('El nombre es obligatorio.');
      return;
    }

    setIsCreating(true);
    setModalError('');

    try {
      const tpl = TEMPLATES.find((t) => t.id === selectedTemplate) ?? TEMPLATES[0];

      const response = await workflowApi.createWorkflow({
        name: name.trim(),
        data: {
          nodes: tpl.nodes,
          edges: tpl.edges,
          createdAt: new Date().toISOString()
        }
      });

      const workflowId = response.workflow.id;

      setShowModal(false);
      await loadWorkflows();

      showSuccess('✓ Workflow creado correctamente');
      setTimeout(() => {
        navigate(`/workspace?workflowId=${workflowId}`);
      }, 800);

    } catch (err) {
      console.error('Error creando workflow:', err);
      const errorMsg = 'Error al crear workflow: ' + err.message;
      setModalError(errorMsg);
      showError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  // Abrir workflow
  const openWorkflow = (workflow) => {
    navigate(`/workspace?workflowId=${workflow.id}`);
  };

  // Eliminar workflow (con confirmación)
  const requestDeleteWorkflow = (workflowId, workflowName) => {
    setDeleteConfirmModal({ id: workflowId, name: workflowName });
  };

  const confirmDeleteWorkflow = async () => {
    if (!deleteConfirmModal) return;

    const { id, name } = deleteConfirmModal;
    setIsDeleting(true);

    try {
      await workflowApi.deleteWorkflow(id);
      
      await loadWorkflows();
      setDeleteConfirmModal(null);
      
      showSuccess('✓ Workflow eliminado correctamente');
    } catch (err) {
      console.error('Error eliminando workflow:', err);
      const errorMsg = 'Error al eliminar: ' + err.message;
      showError(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteWorkflow = () => {
    setDeleteConfirmModal(null);
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div>
          <h1>Mis Workflows</h1>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
            Bienvenido, {userEmail}
          </p>
        </div>
        <div>
          <button className="btn-primary" onClick={openNewWorkflowModal}>
            + Nuevo workflow
          </button>
        </div>
      </header>

      <FeedbackDisplay feedback={feedback} />

      <section className="workflows-list">
        {isLoading ? (
          <div className="loading">⏳ Cargando workflows...</div>
        ) : error ? (
          <div className="error-message">
            <p>❌ {error}</p>
            <button onClick={loadWorkflows} className="btn-secondary">
              Reintentar
            </button>
          </div>
        ) : workflows.length === 0 ? (
          <div className="empty">
            <p>📭 No tienes workflows todavía.</p>
            <p>Crea tu primer workflow para comenzar.</p>
            <button onClick={openNewWorkflowModal} className="btn-primary" style={{ marginTop: '16px' }}>
              Crear mi primer workflow
            </button>
          </div>
        ) : (
          <ul>
            {workflows.map((w) => (
              <li key={w.id} className="workflow-item">
                <div className="workflow-info">
                  <strong>📊 {w.name}</strong>
                  <div className="workflow-meta">
                    Creado el {new Date(w.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {w.data?.nodes && (
                    <div className="workflow-stats">
                      {w.data.nodes.length} nodo(s) • {w.data.edges?.length || 0} conexión(es)
                    </div>
                  )}
                </div>

                <div className="workflow-actions">
                  <button className="btn-secondary" onClick={() => openWorkflow(w)}>
                    Abrir
                  </button>
                  <button 
                    className="btn-danger" 
                    onClick={() => requestDeleteWorkflow(w.id, w.name)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal para crear workflow */}
      {showModal && (
        <div className="modal-backdrop" onMouseDown={() => !isCreating && setShowModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2>Nuevo workflow</h2>

            <label className="form-row">
              <div className="label">Nombre del workflow *</div>
              <input 
                type="text"
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Proceso de ventas"
                disabled={isCreating}
                autoFocus
              />
            </label>

            <label className="form-row">
              <div className="label">Plantilla inicial</div>
              <select 
                value={selectedTemplate} 
                onChange={(e) => setSelectedTemplate(e.target.value)}
                disabled={isCreating}
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            {modalError && <div className="form-error">❌ {modalError}</div>}

            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setShowModal(false)}
                disabled={isCreating}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={createWorkflow}
                disabled={isCreating}
              >
                {isCreating ? '⏳ Creando...' : 'Crear workflow'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {deleteConfirmModal && (
        <div className="modal-backdrop" onMouseDown={() => !isDeleting && cancelDeleteWorkflow()}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2>⚠️ Confirmar eliminación</h2>
            <p>
              ¿Estás seguro de que quieres eliminar el workflow <strong>"{deleteConfirmModal.name}"</strong>?
            </p>
            <p style={{ fontSize: '12px', color: '#666' }}>
              Esta acción no se puede deshacer.
            </p>

            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={cancelDeleteWorkflow}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button 
                className="btn-danger" 
                onClick={confirmDeleteWorkflow}
                disabled={isDeleting}
              >
                {isDeleting ? '⏳ Eliminando...' : '🗑️ Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}