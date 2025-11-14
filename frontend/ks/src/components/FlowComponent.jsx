import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlowProvider, addEdge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import FlowSidebar from './FlowSidebar';
import FlowToolbar from './FlowToolbar';
import FlowCanvas from './FlowCanvas';
import CustomNode from './CustomNode';
import EdgeEditorPanel from './EdgeEditorPanel';
import { useLocation } from 'react-router-dom';
import { getId } from './flowUtils';
import { workflowApi } from '../api/workflowApi';

const nodeTypes = { custom: CustomNode };

// Nodos iniciales de respaldo
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

  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Estados de ReactFlow
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Estados de UI
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
  // Cargar datos desde el backend al montar
  // ============================================
  useEffect(() => {
    const loadWorkflowData = async () => {
      if (!workflowId) {
        setFeedback('No hay workflowId. Usando flujo inicial.');
        setNodes(initialNodes);
        setEdges(initialEdges);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const [nodesData, edgesData] = await Promise.all([
          workflowApi.fetchNodes(workflowId),
          workflowApi.fetchEdges(workflowId),
        ]);

        // Transformar nodos del backend al formato de ReactFlow
        const transformedNodes = nodesData.map((node) => ({
          id: node.id.toString(),
          type: node.node_type === 'custom' ? 'custom' : undefined,
          position: node.position || { x: 100, y: 100 },
          data: {
            name: node.data?.name || node.name || 'Sin nombre',
            time: node.data?.time || '',
            inCharge: node.data?.inCharge || '',
            ip: node.data?.ip || '',
            progress: node.data?.progress !== undefined ? node.data.progress : 0,
          },
        }));

        // Transformar edges del backend al formato de ReactFlow
        const transformedEdges = edgesData.map((edge) => ({
          id: edge.id.toString(),
          source: edge.source_node.toString(),
          target: edge.target_node.toString(),
          label: edge.label || edge.condition_type || '',
          type: edge.edge_type || 'default',
          animated: edge.animated || false,
          style: edge.style || {},
        }));

        setNodes(transformedNodes);
        setEdges(transformedEdges);
        setFeedback('Workflow cargado correctamente.');
        setTimeout(() => setFeedback(''), 2000);
      } catch (error) {
        console.error('Error cargando workflow:', error);
        setLoadError(error.message);
        setFeedback(`Error: ${error.message}`);
        setNodes(initialNodes);
        setEdges(initialEdges);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflowData();
  }, [workflowId]);

  // ============================================
  // Función para obtener IP del usuario
  // ============================================
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
  // Handler para agregar nodo (desde sidebar)
  // ACTUALIZADO: Ahora incluye progress y type
  // ============================================
  const handleAddNode = useCallback(async ({ name, time, inCharge, type = 'custom' }) => {
    if (!workflowId) {
      setFeedback('No hay workflowId activo.');
      return;
    }

    try {
      const userIP = await getUserIP();
      const tempId = getId();
      const position = { x: 120 + Math.random() * 200, y: 120 + Math.random() * 80 };

      const nodeToAdd =
        type === 'custom'
          ? {
              id: tempId,
              type: 'custom',
              position,
              data: { 
                name, 
                time, 
                inCharge, 
                ip: userIP, 
                progress: 0,
                onChangeLabel: handleChangeLabel 
              }
            }
          : {
              id: tempId,
              position,
              data: { label: name }
            };

      // Agregar localmente primero (optimistic update)
      setNodes((existingNodes) => [...existingNodes, nodeToAdd]);

      // Guardar en el backend
      const savedNode = await workflowApi.createNode(workflowId, {
        workflow: parseInt(workflowId),
        node_type: type,
        name: name,
        position: position,
        data: type === 'custom' 
          ? { name, time, inCharge, ip: userIP, progress: 0 }
          : { label: name }
      });

      // Actualizar con el ID real del backend
      setNodes((nds) =>
        nds.map((n) =>
          n.id === tempId 
            ? { ...n, id: savedNode.id.toString() } 
            : n
        )
      );

      setFeedback('Nodo creado correctamente.');
      setTimeout(() => setFeedback(''), 2000);
    } catch (error) {
      console.error('Error creando nodo:', error);
      setFeedback(`Error: ${error.message}`);
      // Revertir optimistic update en caso de error
      setNodes((nds) => nds.filter((n) => n.id !== tempId));
    }
  }, [workflowId, setNodes, getUserIP, handleChangeLabel]);

  // ============================================
  // Handler para resetear flujo
  // ============================================
  const handleResetFlow = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setFeedback('Flujo reseteado (solo local).');
    setTimeout(() => setFeedback(''), 1700);
  }, [setNodes, setEdges]);

  // ============================================
  // Handlers de ReactFlow
  // ============================================
  const onConnect = useCallback(async (params) => {
    setEdges((eds) => addEdge(params, eds));
    
    // Guardar edge en el backend
    if (workflowId) {
      try {
        await workflowApi.createEdge(workflowId, {
          workflow: parseInt(workflowId),
          source_node: parseInt(params.source),
          target_node: parseInt(params.target),
          edge_type: params.type || 'default',
          label: params.label || '',
        });
      } catch (error) {
        console.error('Error guardando edge:', error);
        setFeedback(`Error al guardar conexión: ${error.message}`);
      }
    }
  }, [setEdges, workflowId]);

  const createNodeCentered = useCallback(
    async (label, time = '', inCharge = '', type = 'custom') => {
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

      const tempId = getId();
      const newNode = {
        id: tempId,
        type: type === 'custom' ? 'custom' : undefined,
        position,
        data: type === 'custom'
          ? { name: label, time, inCharge, ip: userIP, progress: 0, onChangeLabel: handleChangeLabel }
          : { label }
      };

      setNodes((nds) => nds.concat(newNode));

      // Guardar en backend si hay workflowId
      if (workflowId) {
        try {
          const savedNode = await workflowApi.createNode(workflowId, {
            workflow: parseInt(workflowId),
            node_type: type,
            name: label,
            position: position,
            data: type === 'custom' 
              ? { name: label, time, inCharge, ip: userIP, progress: 0 }
              : { label }
          });

          setNodes((nds) => nds.map((n) => n.id === tempId ? { ...n, id: savedNode.id.toString() } : n));
        } catch (error) {
          console.error('Error guardando nodo centrado:', error);
          setFeedback(`Error: ${error.message}`);
        }
      }
    },
    [handleChangeLabel, setNodes, getUserIP, workflowId]
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

  // ============================================
  // Actualizar nodo desde menú contextual
  // ACTUALIZADO: Ahora incluye progress con validación
  // ============================================
  const updateNodeData = useCallback(async () => {
    if (!selectedNode || !workflowId) return;

    try {
      const userIP = await getUserIP();
      const validProgress = Math.max(0, Math.min(100, Number(editingNodeData.progress) || 0));
      
      // Actualizar localmente
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
                  progress: validProgress,
                  ip: userIP,
                  onChangeLabel: handleChangeLabel
                }
              }
            : n
        )
      );

      // Actualizar en el backend
      await workflowApi.updateNode(workflowId, selectedNode.id, {
        name: editingNodeData.name,
        data: {
          name: editingNodeData.name,
          time: editingNodeData.time,
          inCharge: editingNodeData.inCharge,
          progress: validProgress,
          ip: userIP
        }
      });

      setFeedback('Nodo actualizado correctamente.');
      setTimeout(() => setFeedback(''), 2000);
      closeContextMenu();
    } catch (error) {
      console.error('Error actualizando nodo:', error);
      setFeedback(`Error: ${error.message}`);
    }
  }, [selectedNode, editingNodeData, setNodes, handleChangeLabel, closeContextMenu, getUserIP, workflowId]);

  // ============================================
  // Guardar workflow completo
  // ============================================
  const saveWorkflowToBackend = useCallback(async () => {
    if (!workflowId) {
      setFeedback('No hay workflowId definido.');
      return;
    }

    try {
      const instanceNodes = reactFlowInstance?.current?.getNodes?.() ?? nodes;

      const nodesForSave = instanceNodes.map((n) => ({
        id: parseInt(n.id),
        node_type: n.type || 'default',
        position: n.position,
        data: {
          name: n.data.name,
          time: n.data.time,
          inCharge: n.data.inCharge,
          ip: n.data.ip,
          progress: n.data.progress !== undefined ? n.data.progress : 0
        }
      }));

      const edgesForSave = edges.map((e) => ({
        id: parseInt(e.id),
        source_node: parseInt(e.source),
        target_node: parseInt(e.target),
        label: e.label,
        edge_type: e.type || 'default',
        animated: e.animated || false,
        style: e.style || {}
      }));

      await workflowApi.saveWorkflow(workflowId, nodesForSave, edgesForSave);

      setFeedback('Workflow guardado en el servidor.');
      setTimeout(() => setFeedback(''), 2200);
    } catch (error) {
      console.error('Error guardando workflow:', error);
      setFeedback(`Error: ${error.message}`);
    }
  }, [workflowId, nodes, edges]);

  // ============================================
  // Toolbar handlers
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
      
      setFeedback('Workflow exportado.');
      setTimeout(() => setFeedback(''), 2200);
    } catch (err) {
      console.error('Error exportando:', err);
      setFeedback('Error al exportar.');
    }
  }, [nodes, edges, workflowId]);

  // ============================================
  // Otros handlers
  // ============================================
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onEdgeClick = useCallback((event, edge) => {
    event.preventDefault();
    setSelectedEdgeId(edge.id);
  }, []);

  const saveEdgeLabel = useCallback(async (edgeId, newLabel) => {
    setEdges((eds) => eds.map((e) => (e.id === edgeId ? { ...e, label: newLabel } : e)));
    
    // Actualizar en backend
    if (workflowId) {
      try {
        await workflowApi.updateEdge(workflowId, edgeId, { label: newLabel });
      } catch (error) {
        console.error('Error actualizando edge:', error);
      }
    }
  }, [setEdges, workflowId]);

  const deleteEdge = useCallback(async (edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setSelectedEdgeId(null);
    
    // Eliminar del backend
    if (workflowId) {
      try {
        await workflowApi.deleteEdge(workflowId, edgeId);
        setFeedback('Arista eliminada.');
        setTimeout(() => setFeedback(''), 2000);
      } catch (error) {
        console.error('Error eliminando edge:', error);
      }
    }
  }, [setEdges, workflowId]);

  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) ?? null;

  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
  }, []);

  // Handlers de drag para menú contextual
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

  // Effects para menú contextual
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
        
        {feedback && (
          <div style={{ 
            position: 'absolute', 
            top: 60, 
            left: 8, 
            zIndex: 5, 
            padding: '8px 12px', 
            background: feedback.includes('Error') ? '#f44336' : '#4CAF50', 
            color: 'white', 
            borderRadius: 4 
          }}>
            {feedback}
          </div>
        )}

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