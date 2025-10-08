/**
 * FlowComponent.jsx — versión corregida para persistencia y uso correcto de callbacks
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background
} from 'reactflow';
import 'reactflow/dist/style.css';

import CustomNode from './CustomNode';
import EdgeEditorPanel from './EdgeEditorPanel';
import { useLocation } from 'react-router-dom';

const nodeTypes = { custom: CustomNode };

let id = 100;
const getId = () => `${id++}`;

const initialNodes = [
  { id: '1', type: 'custom', position: { x: 250, y: 5 }, data: { name: 'Nodo A', time: '2h', inCharge: 'Usuario 1' } },
  { id: '2', type: 'custom', position: { x: 100, y: 150 }, data: { name: 'Nodo B', time: '1.5h', inCharge: 'Usuario 2' } },
  { id: '3', position: { x: 400, y: 150 }, data: { label: 'Nodo C (normal)' } }
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2', label: 'dependencia' }];

export default function FlowComponent() {
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);

  // Obtener workflowId desde querystring (si aplica)
  const location = useLocation();
  const params = location ? new URLSearchParams(location.search) : new URLSearchParams(window.location.search);
  const workflowId = params.get('workflowId');

  const [feedback, setFeedback] = useState('');

  // Cargar plantilla guardada (si existe)
  const loadTemplateFromStorage = useCallback(() => {
    if (!workflowId) return null;
    try {
      const raw = localStorage.getItem(`workflow_data_${workflowId}`);
      if (!raw) return null;
      return JSON.parse(raw); // { nodes, edges, savedAt }
    } catch (err) {
      console.warn('No se pudo cargar plantilla del workflow:', err);
      return null;
    }
  }, [workflowId]);

  const tpl = loadTemplateFromStorage();
  const nodesInit = tpl?.nodes?.length ? tpl.nodes : initialNodes;
  const edgesInit = tpl?.edges?.length ? tpl.edges : initialEdges;

  // Inicializar estados sin intentar inyectar callbacks (se inyectará después en useEffect)
  const [nodes, setNodes, onNodesChange] = useNodesState(nodesInit);
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesInit);

  // Formulario lateral
  const [newLabel, setNewLabel] = useState('Nuevo nodo');
  const [newTime, setNewTime] = useState('');
  const [newInCharge, setNewInCharge] = useState('');
  const [newType, setNewType] = useState('custom');

  // Edges selection
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  // Menu contextual
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [editingNodeData, setEditingNodeData] = useState({ name: '', time: '', inCharge: '' });

  // Dragging context menu
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // -------------------------
  // handleChangeLabel (declaro acá; usa setNodes que ya existe)
  // -------------------------
  const handleChangeLabel = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...newData, onChangeLabel: handleChangeLabel } } : n
      )
    );
  }, [setNodes]);

  // Inyectar onChangeLabel en nodos custom al montar / cuando cambien nodesInit
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.type === 'custom' ? { ...n, data: { ...n.data, onChangeLabel: handleChangeLabel } } : n
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // se ejecuta una vez al montar

  // -------------------------
  // Handlers básicos
  // -------------------------
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const createNodeCentered = useCallback(() => {
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    let position = { x: 250, y: 150 };

    // usar reactFlowInstance.current.project si está disponible
    if (bounds && reactFlowInstance.current?.project) {
      const centerClient = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
      position = reactFlowInstance.current.project({
        x: centerClient.x - bounds.left,
        y: centerClient.y - bounds.top
      });
    }

    const newNode = {
      id: getId(),
      type: newType === 'custom' ? 'custom' : undefined,
      position,
      data:
        newType === 'custom'
          ? { name: newLabel, time: newTime, inCharge: newInCharge, onChangeLabel: handleChangeLabel }
          : { label: newLabel }
    };

    setNodes((nds) => nds.concat(newNode));
  }, [newLabel, newTime, newInCharge, newType, handleChangeLabel, setNodes]);

  const onNodeClick = useCallback((event, node) => {
    event.stopPropagation();
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (rect) {
      setContextMenuPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    }
    setSelectedNode(node);
    setEditingNodeData({ name: node.data.name || '', time: node.data.time || '', inCharge: node.data.inCharge || '' });
    setIsContextMenuVisible(true);
  }, []);

  const closeContextMenu = useCallback(() => {
    setIsContextMenuVisible(false);
    setSelectedNode(null);
    setIsDragging(false);
  }, []);

  const handleDragStart = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({ x: event.clientX - rect.left - contextMenuPosition.x, y: event.clientY - rect.top - contextMenuPosition.y });
    }
  }, [contextMenuPosition]);

  const handleDragMove = useCallback((event) => {
    if (!isDragging) return;
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (rect) {
      const newX = event.clientX - rect.left - dragOffset.x;
      const newY = event.clientY - rect.top - dragOffset.y;
      const maxX = rect.width - 300;
      const maxY = rect.height - 200;
      setContextMenuPosition({ x: Math.max(0, Math.min(newX, maxX)), y: Math.max(0, Math.min(newY, maxY)) });
    }
  }, [isDragging, dragOffset]);

  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    event.preventDefault();
    setSelectedEdgeId(edge.id);
  }, []);

  const saveEdgeLabel = useCallback((edgeId, newLabel) => {
    setEdges((eds) => eds.map((e) => (e.id === edgeId ? { ...e, label: newLabel } : e)));
  }, [setEdges]);

  const deleteEdge = useCallback((edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setSelectedEdgeId(null);
  }, [setEdges]);

  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) ?? null;

  // -------------------------
  // Persistencia: guardar en localStorage (sanitizando)
  // -------------------------
  const saveWorkflowToStorage = useCallback(() => {
    if (!workflowId) {
      setFeedback('No hay workflowId definido. Abre o crea un workflow primero.');
      return;
    }
    try {
      const instanceNodes = reactFlowInstance?.current?.getNodes?.() ?? nodes;

      const nodesForSave = instanceNodes.map((n) => {
        const safeData = { ...n.data };
        if (safeData.onChangeLabel) delete safeData.onChangeLabel;
        // borrar otras props no serializables si las hubiese
        return { id: n.id, type: n.type, position: n.position, data: safeData };
      });

      const edgesForSave = edges.map((e) => {
        const { id, source, target, label, type, animated, style } = e;
        return { id, source, target, label, type, animated, style };
      });

      const payload = { nodes: nodesForSave, edges: edgesForSave, savedAt: new Date().toISOString() };
      localStorage.setItem(`workflow_data_${workflowId}`, JSON.stringify(payload));

      setFeedback('Workflow guardado correctamente.');
      setTimeout(() => setFeedback(''), 2200);
    } catch (err) {
      console.error('Error guardando workflow:', err);
      setFeedback('Error al guardar el workflow.');
    }
  }, [workflowId, nodes, edges]);

  // Actualizar nodo desde menú contextual
  const updateNodeData = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  name: editingNodeData.name,
                  time: editingNodeData.time,
                  inCharge: editingNodeData.inCharge,
                  onChangeLabel: handleChangeLabel
                }
              }
            : n
        )
      );
      closeContextMenu();
    }
  }, [selectedNode, editingNodeData, setNodes, handleChangeLabel, closeContextMenu]);

  // Listeners para cerrar y drag del contexto
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isContextMenuVisible && !event.target.closest('.node-context-menu')) {
        closeContextMenu();
      }
    };
    if (isContextMenuVisible) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isContextMenuVisible, closeContextMenu]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // -------------------------
  // onInit para capturar instancia
  // -------------------------
  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
  }, []);

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="flow-container" style={{ display: 'flex', gap: 8 }}>
      <aside className="flow-panel" style={{ width: 320, padding: 12, boxSizing: 'border-box', borderRight: '1px solid #eee', background: '#fff' }}>
        <div className="flow-panel-header" onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
          <h3 className="flow-panel-title">Crear nodo</h3>
          <span className={`flow-arrow ${isMenuExpanded ? 'expanded' : ''}`}>▼</span>
        </div>

        <div className={`flow-form-container ${isMenuExpanded ? 'expanded' : ''}`}>
          <label className="flow-form-label">
            Nombre:
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="flow-form-input" placeholder="Ingresa el nombre del nodo" />
          </label>

          <label className="flow-form-label">
            Duración:
            <input value={newTime} onChange={(e) => setNewTime(e.target.value)} className="flow-form-input" placeholder="Ingresa la duración de la tarea" />
          </label>

          <label className="flow-form-label">
            A cargo:
            <input value={newInCharge} onChange={(e) => setNewInCharge(e.target.value)} className="flow-form-input" placeholder="Ingresa la persona encargada" />
          </label>

          <label className="flow-form-label">
            Tipo:
            <select value={newType} onChange={(e) => setNewType(e.target.value)} className="flow-form-select">
              <option value="custom">Custom</option>
              <option value="default">Default</option>
            </select>
          </label>

          <button onClick={createNodeCentered} className="flow-create-button">Crear nodo (centro)</button>

          <div className="flow-instructions">Usa el botón de arriba para crear nodos en el centro del canvas.</div>

          <div style={{ marginTop: 12 }}>
            <button onClick={saveWorkflowToStorage} className="btn-primary">Guardar workflow</button>
            {feedback && <div style={{ marginTop: 8 }} className="feedback">{feedback}</div>}
          </div>
        </div>

        <hr className="flow-separator" />
        <h4 className="flow-tips-title">Tips</h4>
        <ul className="flow-tips-list">
          <li>Arrastra nodos para reposicionarlos en el canvas</li>
          <li>Conecta nodos arrastrando desde un handle a otro</li>
          <li>Selecciona una arista para editar su etiqueta o eliminarla</li>
        </ul>

        {selectedEdge ? (
          <div className="edge-editor-region">
            <h4>Editar arista</h4>
            <EdgeEditorPanel edge={selectedEdge} onSave={(newLabel) => saveEdgeLabel(selectedEdge.id, newLabel)} onDelete={() => deleteEdge(selectedEdge.id)} onClose={() => setSelectedEdgeId(null)} />
          </div>
        ) : (
          <div className="edge-editor-placeholder">Selecciona una arista en el canvas para editarla</div>
        )}
      </aside>

      <div ref={reactFlowWrapper} className="flow-canvas-container" style={{ flex: 1, position: 'relative', height: '720px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          onEdgeClick={onEdgeClick}
          fitView
          onInit={onInit}
          style={{ width: '100%', height: '100%' }}
        >
          <MiniMap nodeColor="rgb(179, 64, 64)" />
          <Controls />
          <Background gap={16} />
        </ReactFlow>

        {isContextMenuVisible && (
          <div className="node-context-menu" style={{ position: 'absolute', left: contextMenuPosition.x + 10, top: contextMenuPosition.y - 10, zIndex: 1000 }}>
            <div className={`context-menu-header ${isDragging ? 'dragging' : ''}`} onMouseDown={handleDragStart}>
              <h4>Editar Nodo</h4>
              <button className="context-menu-close" onClick={closeContextMenu}>×</button>
            </div>

            <div className="context-menu-content">
              <label className="context-menu-label">
                Nombre:
                <input type="text" value={editingNodeData.name} onChange={(e) => setEditingNodeData(prev => ({ ...prev, name: e.target.value }))} className="context-menu-input" />
              </label>

              <label className="context-menu-label">
                Tiempo:
                <input type="text" value={editingNodeData.time} onChange={(e) => setEditingNodeData(prev => ({ ...prev, time: e.target.value }))} className="context-menu-input" placeholder="ej: 2h, 30min" />
              </label>

              <label className="context-menu-label">
                Encargado:
                <input type="text" value={editingNodeData.inCharge} onChange={(e) => setEditingNodeData(prev => ({ ...prev, inCharge: e.target.value }))} className="context-menu-input" placeholder="Nombre del responsable" />
              </label>
            </div>

            <div className="context-menu-actions">
              <button className="context-menu-save" onClick={updateNodeData}>Guardar</button>
              <button className="context-menu-cancel" onClick={closeContextMenu}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Wrapper con provider
export function FlowComponentWithProvider(props) {
  return (
    <ReactFlowProvider>
      <FlowComponent {...props} />
    </ReactFlowProvider>
  );
}
