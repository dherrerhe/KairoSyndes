// FlowComponent.jsx - VERSIÓN LIMPIA (SIN CÓDIGO DUPLICADO)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ReactFlowProvider, useNodesState, useEdgesState } from 'reactflow';
import { useLocation } from 'react-router-dom';

import 'reactflow/dist/style.css';
import '../fcStyles/NodeContextMenu.css';

import FlowSidebar from './FlowSidebar';
import FlowToolbar from './FlowToolbar';
import FlowCanvas from './FlowCanvas';
import CustomNode from './CustomNode';
import EdgeEditorPanel from './EdgeEditorPanel';
import { getId } from './flowUtils';

import { useWorkflowData } from '../hooks/useWorkflowData';
import { useNodeOperations } from '../hooks/useNodeOperations';
import { useEdgeOperations } from '../hooks/useEdgeOperations';
import { useFeedback, FeedbackDisplay } from '../hooks/useFeedback';

// ==========================
// CONSTANTES
// ==========================
const nodeTypes = { custom: CustomNode };

const PREDEFINED_COLORS = [
  { name: 'Azul', value: '#2196F3' },
  { name: 'Verde', value: '#4CAF50' },
  { name: 'Rojo', value: '#F44336' },
  { name: 'Amarillo', value: '#FFEB3B' },
  { name: 'Naranja', value: '#FF9800' },
  { name: 'Púrpura', value: '#9C27B0' },
  { name: 'Rosa', value: '#E91E63' },
  { name: 'Cian', value: '#00BCD4' },
  { name: 'Gris', value: '#607D8B' },
  { name: 'Marrón', value: '#795548' }
];

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
const initialEdges = [];

// ==========================
// COMPONENTE PRINCIPAL
// ==========================
export default function FlowComponent() {
  // Referencias
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);

  // Params
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const workflowId = params.get('workflowId');

  // Hooks de datos
  const { feedback, showSuccess, showError } = useFeedback(2000);
  const {
    nodes: loadedNodes,
    edges: loadedEdges,
    isLoading,
    loadError,
    isSaving,
    saveChanges,
  } = useWorkflowData(workflowId);

  // Estado React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState(loadedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(loadedEdges);

  // Sincronizar datos cargados
  useEffect(() => setNodes(loadedNodes), [loadedNodes, setNodes]);
  useEffect(() => setEdges(loadedEdges), [loadedEdges, setEdges]);

  // Estado UI
  const [selectedNode, setSelectedNode] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [editingNodeData, setEditingNodeData] = useState({
    name: '',
    time: '',
    inCharge: '',
    description: '',
    color: '#4CAF50',
    ip: '',
    progress: 0
  });
  const [expandedSections, setExpandedSections] = useState({
    description: false,
    color: false,
    progress: false
  });
  const [commentNodeId, setCommentNodeId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Node comentarios
  const commentNode = useMemo(
    () => (commentNodeId ? nodes.find((node) => node.id === commentNodeId) ?? null : null),
    [commentNodeId, nodes]
  );

  // Hooks operaciones
  const nodeOps = useNodeOperations(workflowId, setNodes, showSuccess, showError);
  const edgeOps = useEdgeOperations(workflowId, setEdges, showSuccess, showError);

  // ==========================
  // FUNCIONES UTILITARIAS
  // ==========================
  const toggleSection = useCallback(
    (section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })),
    []
  );

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

  // ==========================
  // FUNCIONES DE CALLBACKS (Sin duplicación)
  // ==========================
  const handleShowComments = useCallback((nodeId) => setCommentNodeId(nodeId), []);
  const handleCloseComments = useCallback(() => setCommentNodeId(null), []);

  const handleChangeLabel = useCallback(
    (nodeId, newData) => {
      setNodes(nds =>
        nds.map(n => {
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
    [setNodes]
  );

  // inyectar callbacks a nodos (UNA SOLA VEZ al iniciar)
  useEffect(() => {
    setNodes(nds =>
      nds.map(n =>
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
  }, [handleChangeLabel, handleShowComments, setNodes]);

  const handleAddComment = useCallback(
    (nodeId, commentText) => {
      const text = commentText?.trim();
      if (!text) return;
      const newComment = { id: getId(), text, createdAt: new Date().toISOString() };
      setNodes(nds =>
        nds.map(n =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  comments: [
                    ...(Array.isArray(n.data?.comments) ? n.data.comments : []),
                    newComment
                  ]
                }
              }
            : n
        )
      );
    },
    [setNodes]
  );

  // Validar comentario activo
  useEffect(() => {
    if (commentNodeId && !nodes.some(node => node.id === commentNodeId)) {
      setCommentNodeId(null);
    }
  }, [nodes, commentNodeId]);

  // ==========================
  // OPERACIONES CON NODOS
  // ==========================
  const handleAddNode = useCallback(
    async ({ name, time, inCharge, description, color = '#4CAF50', type = 'custom' }) => {
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
                color,
                ip: userIP,
                progress: 0,
                comments: [],
                onChangeLabel: handleChangeLabel,
                onShowComments: handleShowComments
              }
            }
          : {
              id: getId(),
              position,
              data: { label: name }
            };
      setNodes(existingNodes => [...existingNodes, nodeToAdd]);
    },
    [setNodes, getUserIP, handleChangeLabel, handleShowComments]
  );

  const handleResetFlow = useCallback(() => {
    setNodes(
      initialNodes.map(node =>
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
    showSuccess('Flujo reseteado.');
    setTimeout(() => showSuccess(''), 1700);
  }, [setNodes, setEdges, handleChangeLabel, handleShowComments, showSuccess]);

  const createNodeCentered = useCallback(
    async (label, time = '', inCharge = '', description = '', type = 'custom') => {
      const userIP = await getUserIP();
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      let position = { x: 250, y: 150 };
      if (bounds && reactFlowInstance.current?.project) {
        const centerClient = {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
        };
        position = reactFlowInstance.current.project({
          x: centerClient.x - bounds.left,
          y: centerClient.y - bounds.top,
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
                color: '#4CAF50',
                ip: userIP,
                progress: 0,
                comments: [],
                onChangeLabel: handleChangeLabel,
                onShowComments: handleShowComments
              }
            : { label }
      };
      setNodes(nds => nds.concat(newNode));
      await nodeOps.createNode({ name: label, time, inCharge, type }, position);
    },
    [getUserIP, reactFlowWrapper, reactFlowInstance, setNodes, nodeOps, handleChangeLabel, handleShowComments]
  );

  // ==========================
  // MENÚ CONTEXTUAL
  // ==========================
  const onNodeClick = useCallback((event, node) => {
    event.stopPropagation();
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (rect) {
      setContextMenuPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
    setSelectedNode(node);
    setEditingNodeData({
      name: node.data.name || '',
      time: node.data.time || '',
      inCharge: node.data.inCharge || '',
      description: node.data.description || '',
      color: node.data.color || '#4CAF50',
      ip: node.data.ip || '',
      progress: node.data.progress !== undefined ? node.data.progress : 0
    });
    setIsContextMenuVisible(true);
  }, []);

  const closeContextMenu = useCallback(() => {
    setIsContextMenuVisible(false);
    setSelectedNode(null);
    setExpandedSections({
      description: false,
      color: false,
      progress: false
    });
    setIsDragging(false);
  }, []);

  const updateNodeData = useCallback(async () => {
    if (!selectedNode) return;
    const userIP = await getUserIP();
    setNodes(nds =>
      nds.map(n =>
        n.id === selectedNode.id
          ? {
              ...n,
              data: {
                ...n.data,
                name: editingNodeData.name,
                time: editingNodeData.time,
                inCharge: editingNodeData.inCharge,
                description: editingNodeData.description,
                color: editingNodeData.color || '#4CAF50',
                progress:
                  editingNodeData.progress !== undefined
                    ? Math.max(0, Math.min(100, Number(editingNodeData.progress) || 0))
                    : 0,
                ip: userIP,
                comments: Array.isArray(n.data?.comments) ? n.data.comments : []
              }
            }
          : n
      )
    );
    closeContextMenu();
  }, [
    selectedNode,
    editingNodeData,
    closeContextMenu,
    getUserIP,
    setNodes
  ]);

  // ==========================
  // DRAG MENÚ CONTEXTUAL
  // ==========================
  const handleDragMove = useCallback(
    event => {
      if (!isDragging) return;
      const rect = reactFlowWrapper.current?.getBoundingClientRect();
      if (rect) {
        const newX = event.clientX - rect.left - dragOffset.x;
        const newY = event.clientY - rect.top - dragOffset.y;
        const maxX = rect.width - 300;
        const maxY = rect.height - 200;
        setContextMenuPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    },
    [isDragging, dragOffset]
  );

  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    const handleClickOutside = event => {
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

  // ==========================
  // TOOLBAR (Zoom, Save, Export)
  // ==========================
  const onInit = useCallback(instance => {
    reactFlowInstance.current = instance;
  }, []);

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

  // Función auxiliar para preparar nodos/edges
  const prepareNodesForSave = useCallback(() => {
    const instanceNodes = reactFlowInstance?.current?.getNodes?.() ?? nodes;
    return instanceNodes.map(n => ({
      id: parseInt(n.id),
      node_type: n.type || 'default',
      position: n.position,
      data: {
        name: n.data?.name,
        time: n.data?.time,
        inCharge: n.data?.inCharge,
        ip: n.data?.ip,
        progress: n.data?.progress !== undefined ? n.data.progress : 0,
        color: n.data?.color || '#4CAF50'
      }
    }));
  }, [nodes]);

  const prepareEdgesForSave = useCallback(() => {
    return edges.map(e => ({
      id: parseInt(e.id),
      source: e.source,
      target: e.target,
      label: e.label || '',
      data: {
        edge_type: e.type || 'default',
        animated: e.animated || false,
        style: e.style || {}
      }
    }));
  }, [edges]);

  const saveWorkflowToBackend = useCallback(async () => {
    if (!workflowId) {
      showError('No hay workflowId definido.');
      return;
    }
    try {
      const { workflowApi } = await import('../api/workflowApi');
      const nodesForSave = prepareNodesForSave();
      const edgesForSave = prepareEdgesForSave();
      await workflowApi.saveWorkflow(workflowId, nodesForSave, edgesForSave);
      showSuccess('Workflow guardado en el servidor.');
    } catch (error) {
      console.error('Error guardando workflow:', error);
      showError(error.message);
    }
  }, [workflowId, prepareNodesForSave, prepareEdgesForSave, showSuccess, showError]);

  const handleExport = useCallback(() => {
    try {
      const instanceNodes = reactFlowInstance?.current?.getNodes?.() ?? nodes;
      const nodesForExport = instanceNodes.map(n => {
        const safeData = { ...n.data };
        delete safeData.onChangeLabel;
        delete safeData.onShowComments;
        return { id: n.id, type: n.type, position: n.position, data: safeData };
      });
      const edgesForExport = prepareEdgesForSave();
      const payload = {
        nodes: nodesForExport,
        edges: edgesForExport,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow_${workflowId || 'sin_id'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Workflow exportado.');
    } catch (err) {
      console.error('Error exportando:', err);
      showError('Error al exportar.');
    }
  }, [nodes, prepareEdgesForSave, workflowId, showSuccess, showError]);

  // ==========================
  // AUTO-SAVE (UNA SOLA VEZ - SIN DUPLICACIÓN)
  // ==========================
  useEffect(() => {
    if (!workflowId) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        const { workflowApi } = await import('../api/workflowApi');
        const instanceNodes = reactFlowInstance?.current?.getNodes?.() ?? nodes;
        
        const nodesToSave = instanceNodes
          .filter(n => !n.id.toString().startsWith('temp-'))
          .map(n => ({
            id: parseInt(n.id),
            position: n.position,
            data: {
              name: n.data?.name,
              time: n.data?.time,
              inCharge: n.data?.inCharge,
              progress: n.data?.progress !== undefined ? n.data.progress : 0,
              ip: n.data?.ip,
              color: n.data?.color || '#4CAF50'
            }
          }));

        const edgesToSave = edges.map(e => ({
          id: parseInt(e.id),
          label: e.label || '',
          data: {
            edge_type: e.type || 'default',
            animated: e.animated || false,
          }
        }));

        if (nodesToSave.length > 0 || edgesToSave.length > 0) {
          await workflowApi.saveCompleteWorkflow(workflowId, nodesToSave, edgesToSave);
          console.log('✅ Auto-save: Workflow guardado');
        }
      } catch (error) {
        console.error('❌ Error en auto-save:', error);
      }
    }, 30000); // 30 segundos

    return () => clearInterval(autoSaveInterval);
  }, [workflowId, nodes, edges]);

  // ==========================
  // RENDERIZADO
  // ==========================
  if (isLoading) {
    return (
      <div className="flow-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Cargando workflow...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flow-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h3>Error al cargar workflow</h3>
          <p>{loadError}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

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
          <li>Arrastra nodos para reposicionarlos</li>
          <li>Conecta nodos arrastrando desde un handle</li>
          <li>Selecciona una arista para editarla</li>
        </ul>
      </FlowSidebar>

      <div
        ref={reactFlowWrapper}
        className="flow-canvas-container"
        style={{ flex: 1, position: 'relative' }}
      >
        <FlowToolbar
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onSave={saveWorkflowToBackend}
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

        <FeedbackDisplay feedback={feedback} />

        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={edgeOps.handleConnect}
          onDragOver={() => {}}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          onEdgeClick={() => {}}
          onInit={onInit}
        />

        {isContextMenuVisible && (
          <div
            className="node-context-menu"
            style={{
              position: 'absolute',
              left: contextMenuPosition.x + 10,
              top: contextMenuPosition.y - 10,
              zIndex: 1000
            }}
          >
            <div className={`context-menu-header ${isDragging ? 'dragging' : ''}`}>
              <h4>Editar Nodo</h4>
              <button className="context-menu-close" onClick={closeContextMenu}>×</button>
            </div>

            <div className="context-menu-content">
              <label className="context-menu-label">
                Nombre:
                <input
                  type="text"
                  value={editingNodeData.name}
                  onChange={e => setEditingNodeData(prev => ({ ...prev, name: e.target.value }))}
                  className="context-menu-input"
                  placeholder="Nombre del nodo"
                />
              </label>

              <label className="context-menu-label">
                Tiempo:
                <input
                  type="text"
                  value={editingNodeData.time}
                  onChange={e => setEditingNodeData(prev => ({ ...prev, time: e.target.value }))}
                  className="context-menu-input"
                  placeholder="ej: 2h, 30min"
                />
              </label>

              <label className="context-menu-label">
                Encargado:
                <input
                  type="text"
                  value={editingNodeData.inCharge}
                  onChange={e => setEditingNodeData(prev => ({ ...prev, inCharge: e.target.value }))}
                  className="context-menu-input"
                  placeholder="Nombre del responsable"
                />
              </label>

              <div className="context-menu-accordion">
                <button
                  type="button"
                  className="context-menu-accordion-header"
                  onClick={() => toggleSection('description')}
                >
                  <span>Descripción del trabajo</span>
                  <span className="context-menu-accordion-arrow">
                    {expandedSections.description ? '▼' : '▶'}
                  </span>
                </button>
                {expandedSections.description && (
                  <div className="context-menu-accordion-content">
                    <textarea
                      value={editingNodeData.description}
                      onChange={e => setEditingNodeData(prev => ({ ...prev, description: e.target.value }))}
                      className="context-menu-input"
                      placeholder="Describe el trabajo que se va a realizar..."
                      rows={4}
                    />
                  </div>
                )}
              </div>

              <div className="context-menu-accordion">
                <button
                  type="button"
                  className="context-menu-accordion-header"
                  onClick={() => toggleSection('color')}
                >
                  <span>Color del nodo</span>
                  <span className="context-menu-accordion-arrow">
                    {expandedSections.color ? '▼' : '▶'}
                  </span>
                </button>
                {expandedSections.color && (
                  <div className="context-menu-accordion-content">
                    <div className="context-menu-color-selector">
                      {PREDEFINED_COLORS.map(color => (
                        <button
                          key={color.value}
                          type="button"
                          className={`context-menu-color-button ${(editingNodeData.color || '#4CAF50') === color.value ? 'active' : ''}`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setEditingNodeData(prev => ({ ...prev, color: color.value }))}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="context-menu-accordion">
                <button
                  type="button"
                  className="context-menu-accordion-header"
                  onClick={() => toggleSection('progress')}
                >
                  <span>Progreso (%)</span>
                  <span className="context-menu-accordion-arrow">
                    {expandedSections.progress ? '▼' : '▶'}
                  </span>
                </button>
                {expandedSections.progress && (
                  <div className="context-menu-accordion-content">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editingNodeData.progress !== undefined ? editingNodeData.progress : 0}
                      onChange={e => setEditingNodeData(prev => ({ ...prev, progress: e.target.value }))}
                      className="context-menu-input"
                      placeholder="0-100"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="context-menu-actions">
              <button className="context-menu-save" onClick={updateNodeData}>Guardar</button>
              <button className="context-menu-cancel" onClick={closeContextMenu}>Cancelar</button>
            </div>

            <div className="context-menu-readonly">
              <div className="context-menu-label">
                Último modificador:
                <div className="context-menu-ip-display">
                  {editingNodeData.ip || 'Sin IP'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function FlowComponentWithProvider(props) {
  return (
    <ReactFlowProvider>
      <FlowComponent {...props} />
    </ReactFlowProvider>
  );
}