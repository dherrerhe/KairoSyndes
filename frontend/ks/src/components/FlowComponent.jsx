import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import FlowSidebar from './FlowSidebar';
import FlowToolbar from './FlowToolbar';
import FlowCanvas from './FlowCanvas';
import CustomNode from './CustomNode';
import EdgeEditorPanel from './EdgeEditorPanel';
import { useLocation } from 'react-router-dom';
import { getId } from './flowUtils';

// Importar hooks personalizados
import { useWorkflowData } from '../hooks/useWorkflowData';
import { useNodeOperations } from '../hooks/useNodeOperations';
import { useEdgeOperations } from '../hooks/useEdgeOperations';
import { useFeedback, FeedbackDisplay } from '../hooks/useFeedback';

// Definir los tipos de nodos personalizados para React Flow
const nodeTypes = { custom: CustomNode };

// Nodos y edges iniciales de respaldo
const initialNodes = [
  { id: '1', type: 'custom', position: { x: 250, y: 5 }, data: { name: 'Nodo A', time: '2h', inCharge: 'Usuario 1', progress: 0 } },
];
const initialEdges = [];

// ============================================
// Componente Principal
// ============================================
export default function FlowComponent() {
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);

  // Obtener workflowId desde querystring
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const workflowId = params.get('workflowId');

  // ============================================
  // CUSTOM HOOKS - Toda la lógica de negocio
  // ============================================
  
  // Hook para feedback de usuario
  const { feedback, showSuccess, showError } = useFeedback(2000);

  // Hook para cargar workflow desde backend
  const {
    nodes: loadedNodes,
    edges: loadedEdges,
    isLoading,
    loadError,
    setNodes: setLoadedNodes,
    setEdges: setLoadedEdges,
  } = useWorkflowData(workflowId);

  // Estados de ReactFlow (usa los datos cargados)
  const [nodes, setNodes, onNodesChange] = useNodesState(loadedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(loadedEdges);

  // Sincronizar nodos/edges cuando se cargan desde el backend
  useEffect(() => {
    setNodes(loadedNodes);
  }, [loadedNodes, setNodes]);

  useEffect(() => {
    setEdges(loadedEdges);
  }, [loadedEdges, setEdges]);

  // Hook para operaciones de nodos (crear, actualizar, eliminar)
  const nodeOps = useNodeOperations(workflowId, setNodes, showSuccess, showError);

  // Hook para operaciones de edges (crear, actualizar, eliminar)
  const edgeOps = useEdgeOperations(workflowId, setEdges, showSuccess, showError);

  // ============================================
  // Estados de UI (menú contextual, edges seleccionados)
  // ============================================
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [editingNodeData, setEditingNodeData] = useState({ 
    name: '', 
    time: '', 
    inCharge: '', 
    ip: '', 
    progress: 0 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // ============================================
  // Handler para cambiar etiquetas (inline edit)
  // ============================================
  const handleChangeLabel = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId 
          ? { ...n, data: { ...n.data, ...newData, onChangeLabel: handleChangeLabel } } 
          : n
      )
    );
  }, [setNodes]);

  // Inyectar onChangeLabel en todos los nodos custom
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.type === 'custom' 
          ? { ...n, data: { ...n.data, onChangeLabel: handleChangeLabel } } 
          : n
      )
    );
  }, [handleChangeLabel, setNodes]);

  // ============================================
  // Wrappers para los hooks (adaptan la interfaz)
  // ============================================

  /**
   * Handler para agregar nodo desde el sidebar
   */
  const handleAddNode = useCallback(async ({ name, time, inCharge, type = 'custom' }) => {
    const position = { x: 120 + Math.random() * 200, y: 120 + Math.random() * 80 };
    await nodeOps.createNode({ name, time, inCharge, type }, position);
  }, [nodeOps]);

  /**
   * Handler para resetear flujo
   */
  const handleResetFlow = useCallback(() => {
    nodeOps.resetNodes(initialNodes);
    edgeOps.resetEdges(initialEdges);
  }, [nodeOps, edgeOps]);

  /**
   * Crear nodo centrado en el canvas
   */
  const createNodeCentered = useCallback(
    async (label, time = '', inCharge = '', type = 'custom') => {
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      let position = { x: 250, y: 150 };

      if (bounds && reactFlowInstance.current?.project) {
        const centerClient = { 
          x: bounds.left + bounds.width / 2, 
          y: bounds.top + bounds.height / 2 
        };
        position = reactFlowInstance.current.project({
          x: centerClient.x - bounds.left,
          y: centerClient.y - bounds.top
        });
      }

      await nodeOps.createNode({ name: label, time, inCharge, type }, position);
    },
    [nodeOps]
  );

  /**
   * Handler para click en nodo (abrir menú contextual)
   */
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
      ip: node.data.ip || '',
      progress: node.data.progress !== undefined ? node.data.progress : 0
    });
    setIsContextMenuVisible(true);
  }, []);

  /**
   * Cerrar menú contextual
   */
  const closeContextMenu = useCallback(() => {
    setIsContextMenuVisible(false);
    setSelectedNode(null);
    setIsDragging(false);
  }, []);

  /**
   * Actualizar nodo desde menú contextual
   */
  const updateNodeData = useCallback(async () => {
    if (!selectedNode) return;

    await nodeOps.updateNode(selectedNode.id, {
      name: editingNodeData.name,
      time: editingNodeData.time,
      inCharge: editingNodeData.inCharge,
      progress: editingNodeData.progress,
    });

    closeContextMenu();
  }, [selectedNode, editingNodeData, nodeOps, closeContextMenu]);

  // ============================================
  // Handlers de Toolbar
  // ============================================
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.current?.zoomIn?.({ duration: 200 });
  }, []);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.current?.zoomOut?.({ duration: 200 });
  }, []);

  const handleFitView = useCallback(() => {
    reactFlowInstance.current?.fitView?.({ padding: 0.2, duration: 200 });
  }, []);

  /**
   * Guardar workflow completo en el backend
   */
  const saveWorkflowToBackend = useCallback(async () => {
    if (!workflowId) {
      showError('No hay workflowId definido.');
      return;
    }

    try {
      const instanceNodes = reactFlowInstance?.current?.getNodes?.() ?? nodes;
      const { workflowApi } = await import('../api/workflowApi');

      const nodesForSave = instanceNodes.map((n) => ({
        id: n.id,
        node_type: n.type || 'default',
        position: n.position,
        data: {
          name: n.data?.name,
          time: n.data?.time,
          inCharge: n.data?.inCharge,
          ip: n.data?.ip,
          progress: n.data?.progress !== undefined ? n.data.progress : 0
        }
      }));

      const edgesForSave = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        data: {
          edge_type: e.type || 'default',
          animated: e.animated || false,
          style: e.style || {}
        }
      }));

      await workflowApi.saveWorkflow(workflowId, nodesForSave, edgesForSave);
      showSuccess('Workflow guardado en el servidor.');
    } catch (error) {
      console.error('Error guardando workflow:', error);
      showError(error.message);
    }
  }, [workflowId, nodes, edges, showSuccess, showError]);

  /**
   * Exportar workflow a JSON
   */
  const handleExport = useCallback(() => {
    try {
      const instanceNodes = reactFlowInstance?.current?.getNodes?.() ?? nodes;
      
      const nodesForExport = instanceNodes.map((n) => {
        const safeData = { ...n.data };
        if (safeData.onChangeLabel) delete safeData.onChangeLabel;
        return { id: n.id, type: n.type, position: n.position, data: safeData };
      });

      const edgesForExport = edges.map((e) => {
        const { id, source, target, label, type, animated, style } = e;
        return { id, source, target, label, type, animated, style };
      });

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
  }, [nodes, edges, workflowId, showSuccess, showError]);

  // ============================================
  // Handlers de Edges
  // ============================================
  const onEdgeClick = useCallback((event, edge) => {
    event.preventDefault();
    setSelectedEdgeId(edge.id);
  }, []);

  const saveEdgeLabel = useCallback(async (edgeId, newLabel) => {
    await edgeOps.updateEdgeLabel(edgeId, newLabel);
  }, [edgeOps]);

  const deleteEdge = useCallback(async (edgeId) => {
    await edgeOps.deleteEdge(edgeId);
    setSelectedEdgeId(null);
  }, [edgeOps]);

  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) ?? null;

  // ============================================
  // Handlers de ReactFlow
  // ============================================
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
  }, []);

  // ============================================
  // Drag handlers para menú contextual
  // ============================================
  const handleDragStart = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({ 
        x: event.clientX - rect.left - contextMenuPosition.x, 
        y: event.clientY - rect.top - contextMenuPosition.y 
      });
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
      setContextMenuPosition({ 
        x: Math.max(0, Math.min(newX, maxX)), 
        y: Math.max(0, Math.min(newY, maxY)) 
      });
    }
  }, [isDragging, dragOffset]);

  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  // ============================================
  // Effects para menú contextual
  // ============================================
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

  // ============================================
  // Render
  // ============================================
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
      >
        <hr className="flow-separator" />
        <h4 className="flow-tips-title">Tips</h4>
        <ul className="flow-tips-list">
          <li>Arrastra nodos para reposicionarlos</li>
          <li>Conecta nodos arrastrando desde un handle</li>
          <li>Selecciona una arista para editarla</li>
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
          <div className="edge-editor-placeholder">
            Selecciona una arista para editarla
          </div>
        )}
      </FlowSidebar>

      <div ref={reactFlowWrapper} className="flow-canvas-container" style={{ flex: 1, position: 'relative' }}>
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
              onClick={() => createNodeCentered('Nuevo nodo', '', '', 'custom')}
            >
              (+) Nodo centrado
            </button>
          )}
          style={{ position: 'absolute', top: 8, left: 8, zIndex: 5, background: 'transparent', padding: 0 }}
        />
        
        {/* Componente de Feedback usando el hook */}
        <FeedbackDisplay feedback={feedback} />

        <FlowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={edgeOps.handleConnect}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          onEdgeClick={onEdgeClick}
          onInit={onInit}
        />

        {/* Menú Contextual para editar nodos */}
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
            <div 
              className={`context-menu-header ${isDragging ? 'dragging' : ''}`} 
              onMouseDown={handleDragStart}
            >
              <h4>Editar Nodo</h4>
              <button className="context-menu-close" onClick={closeContextMenu}>×</button>
            </div>

            <div className="context-menu-content">
              <label className="context-menu-label">
                Nombre:
                <input 
                  type="text" 
                  value={editingNodeData.name} 
                  onChange={(e) => setEditingNodeData(prev => ({ ...prev, name: e.target.value }))} 
                  className="context-menu-input" 
                />
              </label>

              <label className="context-menu-label">
                Tiempo:
                <input 
                  type="text" 
                  value={editingNodeData.time} 
                  onChange={(e) => setEditingNodeData(prev => ({ ...prev, time: e.target.value }))} 
                  className="context-menu-input" 
                  placeholder="ej: 2h, 30min" 
                />
              </label>

              <label className="context-menu-label">
                Encargado:
                <input 
                  type="text" 
                  value={editingNodeData.inCharge} 
                  onChange={(e) => setEditingNodeData(prev => ({ ...prev, inCharge: e.target.value }))} 
                  className="context-menu-input" 
                  placeholder="Nombre del responsable" 
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

            <div className="context-menu-readonly">
              <div className="context-menu-label">
                Último modificador:
                <div className="context-menu-ip-display">
                  {editingNodeData.ip || 'Sin IP'}
                </div>
              </div>
            </div>

            <div className="context-menu-actions">
              <button className="context-menu-save" onClick={updateNodeData}>
                Guardar
              </button>
              <button className="context-menu-cancel" onClick={closeContextMenu}>
                Cancelar
              </button>
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