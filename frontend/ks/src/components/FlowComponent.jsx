/**
 * FlowComponent.jsx — versión corregida para persistencia y uso correcto de callbacks
 */
// 

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlowProvider, addEdge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import FlowSidebar from './FlowSidebar';
import FlowToolbar from './FlowToolbar';
import FlowCanvas from './FlowCanvas';

import CustomNode from './CustomNode';
import EdgeEditorPanel from './EdgeEditorPanel';
import { useLocation } from 'react-router-dom';
import { getId, saveWorkflowToLocalStorage, loadWorkflowFromLocalStorage, limpiarDatosNodoParaSerializar } from './flowUtils';
const nodeTypes = { custom: CustomNode };

const initialNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 5 },
    data: { name: 'Nodo A', time: '2h', inCharge: 'Usuario 1', progress: 0, comments: [] }
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 100, y: 150 },
    data: { name: 'Nodo B', time: '1.5h', inCharge: 'Usuario 2', progress: 0, comments: [] }
  },
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
  const [editingNodeData, setEditingNodeData] = useState({ name: '', time: '', inCharge: '', description: '', ip: '', progress: 0 });

  // Comentarios
  const [commentNodeId, setCommentNodeId] = useState(null);
  const commentNode = useMemo(
    () => (commentNodeId ? nodes.find((node) => node.id === commentNodeId) ?? null : null),
    [commentNodeId, nodes]
  );

  // Función para obtener la IP real del usuario
  const getUserIP = useCallback(async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('No se pudo obtener la IP del usuario:', error);
      return 'IP no disponible';
    }
  }, []);

  useEffect(() => {
    if (commentNodeId && !nodes.some((node) => node.id === commentNodeId)) {
      setCommentNodeId(null);
    }
  }, [nodes, commentNodeId]);

  const handleShowComments = useCallback((nodeId) => {
    setCommentNodeId(nodeId);
  }, []);

  const handleCloseComments = useCallback(() => {
    setCommentNodeId(null);
  }, []);

  // Dragging context menu
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // -------------------------
  // handleChangeLabel (declaro acá; usa setNodes que ya existe)
  // -------------------------
  const handleChangeLabel = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          const mergedData = { ...n.data, ...newData };
          const comments = Array.isArray(mergedData.comments)
            ? mergedData.comments
            : Array.isArray(n.data?.comments)
            ? n.data.comments
            : [];

          return {
            ...n,
            data: {
              ...mergedData,
              comments,
              onChangeLabel: handleChangeLabel,
              onShowComments: handleShowComments
            }
          };
        })
      );
    },
    [setNodes, handleShowComments]
  );

  const handleAddComment = useCallback(
    (nodeId, commentText) => {
      const text = commentText?.trim();
      if (!text) return;

      const newComment = {
        id: getId(),
        text,
        createdAt: new Date().toISOString()
      };

      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  comments: [
                    ...(Array.isArray(n.data?.comments) ? n.data.comments : []),
                    newComment
                  ],
                  onChangeLabel: handleChangeLabel,
                  onShowComments: handleShowComments
                }
              }
            : n
        )
      );
    },
    [setNodes, handleChangeLabel, handleShowComments]
  );

  // --- Handler para agregar un nodo desde el sidebar
  const handleAddNode = useCallback(
    async ({ name, time, inCharge, description, type = 'custom' }) => {
      const userIP = await getUserIP();
      const position = { x: 120 + Math.random() * 200, y: 120 + Math.random() * 80 };

      const nodeToAdd =
        type === 'custom'
          ? {
              id: getId(),
              type: 'custom',
              position,
              data: {
                name,
                time,
                inCharge,
                description,
                ip: userIP,
                progress: 0,
                comments: [],
                onChangeLabel: handleChangeLabel,
                onShowComments: handleShowComments
              }
            }
          : {
              id: getId(),
              // sin `type` => nodo normal por defecto en React Flow
              position,
              data: { label: name }
            };

      setNodes((existingNodes) => [...existingNodes, nodeToAdd]);
    },
    [setNodes, getUserIP, handleChangeLabel, handleShowComments]
  );

  const handleResetFlow = useCallback(() => {
    setNodes(
      initialNodes.map((node) =>
        node.type === 'custom'
          ? {
              ...node,
              data: {
                ...node.data,
                comments: Array.isArray(node.data?.comments) ? node.data.comments : [],
                onChangeLabel: handleChangeLabel,
                onShowComments: handleShowComments
              }
            }
          : node
      )
    );
    setEdges(initialEdges);
    setFeedback('Flujo reseteado.');
    setTimeout(() => setFeedback(''), 1700);
  }, [setNodes, setEdges, handleChangeLabel, handleShowComments]);

  // Inyectar onChangeLabel en nodos custom al montar / cuando cambien nodesInit
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.type === 'custom'
          ? {
              ...n,
              data: {
                ...n.data,
                comments: Array.isArray(n.data?.comments) ? n.data.comments : [],
                onChangeLabel: handleChangeLabel,
                onShowComments: handleShowComments
              }
            }
          : n
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // se ejecuta una vez al montar

  // -------------------------
  // Handlers básicos
  // -------------------------
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Esta función depende de variables como newLabel, newTime, newInCharge, newType, pero NO están definidas en el código mostrado.
  // Eso significa que createNodeCentered no funcionará correctamente si esas variables no existen como estados o props.
  // Además, tampoco expone ni usa createNodeCentered en ningún sitio, así que falta conectarla (por ejemplo, a un botón o menú).
  // Ejemplo mínimo de lo que le falta:

  // 1. Deben existir los estados:
  // const [newLabel, setNewLabel] = useState('');
  // const [newTime, setNewTime] = useState('');
  // const [newInCharge, setNewInCharge] = useState('');
  // const [newType, setNewType] = useState('custom');
  // ...o debes obtener esos valores de otro input.
  // 2. Debes invocar createNodeCentered desde algún UI (botón, menú, etc).

  // Si quieres solo mostrar el esqueleto correcto:
  const createNodeCentered = useCallback(
    async (label, time = '', inCharge = '', description = '', type = 'custom') => {
      const userIP = await getUserIP();
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      let position = { x: 250, y: 150 };

      if (bounds && reactFlowInstance.current?.project) {
        const centerClient = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
        position = reactFlowInstance.current.project({
          x: centerClient.x - bounds.left,
          y: centerClient.y - bounds.top
        });
      }

      const newNode = {
        id: getId(),
        type: type === 'custom' ? 'custom' : undefined,
        position,
        data:
          type === 'custom'
            ? {
                name: label,
                time,
                inCharge,
                description,
                ip: userIP,
                progress: 0,
                comments: [],
                onChangeLabel: handleChangeLabel,
                onShowComments: handleShowComments
              }
            : { label }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [handleChangeLabel, setNodes, getUserIP]
  );


  const onNodeClick = useCallback((event, node) => {
    event.stopPropagation();
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (rect) {
      setContextMenuPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    }
    setSelectedNode(node);
    setEditingNodeData({ 
      name: node.data.name || '', 
      time: node.data.time || '', 
      inCharge: node.data.inCharge || '', 
      description: node.data.description || '',
      ip: node.data.ip || '',
      progress: node.data.progress !== undefined ? node.data.progress : 0
    });
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
        if (safeData.onShowComments) delete safeData.onShowComments;
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
  const updateNodeData = useCallback(async () => {
    if (selectedNode) {
      const userIP = await getUserIP();
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
                  description: editingNodeData.description,
                  progress: editingNodeData.progress !== undefined ? Math.max(0, Math.min(100, Number(editingNodeData.progress) || 0)) : 0,
                  ip: userIP, // Actualizar con la IP del usuario que modifica
                  comments: Array.isArray(n.data?.comments) ? n.data.comments : [],
                  onChangeLabel: handleChangeLabel,
                  onShowComments: handleShowComments
                }
              }
            : n
        )
      );
      closeContextMenu();
    }
  }, [selectedNode, editingNodeData, setNodes, handleChangeLabel, closeContextMenu, getUserIP]);

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
  // Toolbar handlers: zoom, fit, save, export
  // -------------------------
  const handleZoomIn = useCallback(() => {
    if (reactFlowInstance.current?.zoomIn) {
      reactFlowInstance.current.zoomIn({ duration: 200 });
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (reactFlowInstance.current?.zoomOut) {
      reactFlowInstance.current.zoomOut({ duration: 200 });
    }
  }, []);

  const handleFitView = useCallback(() => {
    if (reactFlowInstance.current?.fitView) {
      reactFlowInstance.current.fitView({ padding: 0.2, duration: 200 });
    }
  }, []);

  const handleExport = useCallback(() => {
    try {
      const instanceNodes = reactFlowInstance?.current?.getNodes?.() ?? nodes;

      const nodesForExport = instanceNodes.map((n) => {
        const safeData = { ...n.data };
        if (safeData.onChangeLabel) delete safeData.onChangeLabel;
        if (safeData.onShowComments) delete safeData.onShowComments;
        return { id: n.id, type: n.type, position: n.position, data: safeData };
      });

      const edgesForExport = edges.map((e) => {
        const { id, source, target, label, type, animated, style } = e;
        return { id, source, target, label, type, animated, style };
      });

      const payload = { nodes: nodesForExport, edges: edgesForExport, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow_${workflowId || 'sin_id'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedback('Workflow exportado.');
      setTimeout(() => setFeedback(''), 2200);
    } catch (err) {
      console.error('Error exportando workflow:', err);
      setFeedback('Error al exportar el workflow.');
    }
  }, [nodes, edges, workflowId]);

  // -------------------------
  // Render
  // -------------------------

  return (
    <div className="flow-container" style={{ display: 'flex', gap: 8 }}>
      <FlowSidebar
        onAddNode={handleAddNode}
        onResetFlow={handleResetFlow}
        nodes={nodes}
        commentNode={commentNode}
        onAddComment={handleAddComment}
        onCloseComments={handleCloseComments}
      >
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
            <EdgeEditorPanel 
              edge={selectedEdge} 
              onSave={(newLabel) => saveEdgeLabel(selectedEdge.id, newLabel)} 
              onDelete={() => deleteEdge(selectedEdge.id)} 
              onClose={() => setSelectedEdgeId(null)} 
            />
          </div>
        ) : (
          <div className="edge-editor-placeholder">Selecciona una arista en el canvas para editarla</div>
        )}
      </FlowSidebar>

      {/* Reemplazado ReactFlow por FlowCanvas aquí para no repetir lógica ya modularizada */}
      <div ref={reactFlowWrapper} className="flow-canvas-container" style={{ flex: 1, position: 'relative' }}>
        <FlowToolbar
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onSave={saveWorkflowToStorage}
          onExport={handleExport}
          extraActions={() => (
            <button
              type="button"
              className="toolbar-btn"
              title="Añadir nodo centrado"
              onClick={() => createNodeCentered('Nuevo nodo', '', '', '', 'custom')}
            >
              (+) Nodo centrado
            </button>
          )}
          style={{ position: 'absolute', top: 8, left: 8, zIndex: 5, background: 'transparent', padding: 0 }}
        />
        {feedback && <div style={{ marginTop: 8 }} className="feedback">{feedback}</div>}
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          onEdgeClick={onEdgeClick}
          onInit={onInit}
        />

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

              <label className="context-menu-label">
                Descripción del trabajo:
                <textarea 
                  value={editingNodeData.description} 
                  onChange={(e) => setEditingNodeData(prev => ({ ...prev, description: e.target.value }))} 
                  className="context-menu-input" 
                  placeholder="Describe el trabajo que se va a realizar..."
                  rows={4}
                />
              </label>

              <label className="context-menu-label">
                Progreso (%):
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={editingNodeData.progress !== undefined ? editingNodeData.progress : 0} 
                  onChange={(e) => setEditingNodeData(prev => ({ ...prev, progress: e.target.value }))} 
                  className="context-menu-input" 
                  placeholder="0-100" 
                />
              </label>
            </div>

            {/* Información de solo lectura - IP */}
            <div className="context-menu-readonly">
              <div className="context-menu-label">
                Último modificador:
                <div className="context-menu-ip-display">{editingNodeData.ip || 'Sin IP'}</div>
              </div>
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
