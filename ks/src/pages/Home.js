// src/pages/Home.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // si usas react-router 

// Ejemplo de plantillas (puedes ampliar). Estas plantillas contienen nodes/edges
const TEMPLATES = [
  {
    id: 'tpl-empty',
    name: 'Blank',
    nodes: [],
    edges: []
  },
  {
    id: 'tpl-simple',
    name: 'Plantilla simple (3 nodos)',
    nodes: [
      { id: 'n1', type: 'custom', position: { x: 50, y: 20 }, data: { name: 'Inicio', time: '1h', inCharge: 'A' } },
      { id: 'n2', type: 'custom', position: { x: 250, y: 120 }, data: { name: 'Proceso', time: '2h', inCharge: 'B' } },
      { id: 'n3', position: { x: 450, y: 20 }, data: { label: 'Fin' } }
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2', label: 'a' }, { id: 'e2', source: 'n2', target: 'n3', label: 'b' }]
  }
];

const WORKFLOWS_KEY = 'my_workflows_v1';

function generateId() {
  return 'wf-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

export default function Home() {
  const navigate = useNavigate(); // Hook para la navegación programática entre rutas
  const [workflows, setWorkflows] = useState([]); // Estado para almacenar la lista de flujos de trabajo
  const [showModal, setShowModal] = useState(false); // Estado para controlar la visibilidad del modal de creación de flujo
  const [name, setName] = useState(''); // Estado para el nombre del nuevo flujo de trabajo
  const [creator, setCreator] = useState('Usuario Demo'); // Estado para el creador del flujo de trabajo (ejemplo)
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id); // Estado para la plantilla seleccionada al crear un flujo
  const [error, setError] = useState(''); // Estado para mostrar mensajes de error en el formulario del modal

  // cargar workflows desde localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WORKFLOWS_KEY);
      if (raw) setWorkflows(JSON.parse(raw));
    } catch (err) {
      console.warn('No se pudo leer workflows:', err);
    }
  }, []);

  // persistir
  const persist = (arr) => {
    setWorkflows(arr);
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(arr));
  };

  const openNewWorkflowModal = () => {
    setName('');
    setSelectedTemplate(TEMPLATES[0].id);
    setError('');
    setShowModal(true);
  };

  const createWorkflow = () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    const id = generateId();
    const createdAt = new Date().toISOString();
    const wf = {
      id,
      name: name.trim(),
      creator,
      createdAt,
      templateId: selectedTemplate
    };

    const newArr = [wf, ...workflows];
    persist(newArr);
    setShowModal(false);

    // También guardamos la plantilla seleccionada (nodos/edges) asociada al workflow
    // guardamos bajo la clave "workflow_data_<id>"
    const tpl = TEMPLATES.find((t) => t.id === selectedTemplate) ?? TEMPLATES[0];
    localStorage.setItem(`workflow_data_${id}`, JSON.stringify({ nodes: tpl.nodes, edges: tpl.edges }));

    // navegar al workspace pasando workflowId por query
    if (navigate) {
      navigate(`/workspace?workflowId=${id}`);
    } else {
      window.location.href = `/workspace?workflowId=${id}`;
    }
  };

  const openWorkflow = (wf) => {
    if (navigate) {
      navigate(`/workspace?workflowId=${wf.id}`);
    } else {
      window.location.href = `/workspace?workflowId=${wf.id}`;
    }
  };

  const deleteWorkflow = (wfId) => {
    if (!window.confirm('¿Eliminar workflow?')) return;
    const newArr = workflows.filter((w) => w.id !== wfId);
    persist(newArr);
    localStorage.removeItem(`workflow_data_${wfId}`);
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Mis Workflows</h1>
        <div>
          <button className="btn-primary" onClick={openNewWorkflowModal}>Nuevo workflow</button>
        </div>
      </header>

      <section className="workflows-list">
        {workflows.length === 0 ? (
          <div className="empty">No tienes workflows. Crea uno nuevo.</div>
        ) : (
          <ul>
            {workflows.map((w) => (
              <li key={w.id} className="workflow-item">
                <div className="workflow-info">
                  <strong>{w.name}</strong>
                  <div className="workflow-meta">Creado por {w.creator} • {new Date(w.createdAt).toLocaleString()}</div>
                </div>

                <div className="workflow-actions">
                  <button className="btn-secondary" onClick={() => openWorkflow(w)}>Abrir</button>
                  <button className="btn-danger" onClick={() => deleteWorkflow(w.id)}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal simple para crear workflow */}
      {showModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2>Nuevo workflow</h2>

            <label className="form-row">
              <div className="label">Nombre (obligatorio)</div>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>

            <label className="form-row">
              <div className="label">Plantilla</div>
              <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>

            {error && <div className="form-error">{error}</div>}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={createWorkflow}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}