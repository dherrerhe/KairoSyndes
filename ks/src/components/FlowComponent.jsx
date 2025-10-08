/**
 * @fileoverview Componente principal de ReactFlow para visualizar diagramas de flujo
 * @description Componente que maneja la lógica principal del diagrama de flujo,
 * incluyendo la gestión de nodos, aristas y la interacción del usuario.
 * Utiliza nodos personalizados que permiten editar su contenido en tiempo real
 * y proporciona funcionalidades avanzadas de creación de nodos.
 * @author KairoSyndes
 * @version 2.0.0
 * @since 2024
 */

// Importación de React y hooks
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Importaciones de ReactFlow
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  useReactFlow  // Para proyección de coordenadas
} from 'reactflow';

// Importación de estilos de ReactFlow
import 'reactflow/dist/style.css';

// Importación del componente de nodo personalizado
import CustomNode from './CustomNode';
import EdgeEditorPanel from './EdgeEditorPanel';
import { useLocation } from 'react-router-dom';


/**
 * Configuración de tipos de nodos personalizados para ReactFlow.
 * Define los tipos de nodos disponibles en el diagrama de flujo.
 */
const nodeTypes = { custom: CustomNode };

/**
 * Sistema para generar IDs únicos para nuevos nodos.
 * Utiliza un contador incremental para asegurar IDs únicos.
 */
let id = 100;
const getId = () => `${id++}`;

/**
 * Nodos iniciales del diagrama de flujo.
 * Define la estructura inicial de nodos que aparecerán al cargar el componente.
 */
const initialNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 5 },
    data: { name: 'Nodo A', time: '2h', inCharge: 'Usuario 1' }
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 100, y: 150 },
    data: { name: 'Nodo B', time: '1.5h', inCharge: 'Usuario 2' }
  },
  {
    id: '3',
    position: { x: 400, y: 150 },
    data: { label: 'Nodo C (normal)' }
  }
];

/**
 * Aristas iniciales del diagrama de flujo.
 * Define las conexiones iniciales entre los nodos del diagrama.
 */
const initialEdges = [{ id: 'e1-2', source: '1', target: '2', label: 'dependencia' }];

/**
 * Componente principal del diagrama de flujo.
 * 
 * Este componente maneja la lógica principal del diagrama de flujo,
 * incluyendo la gestión de nodos, aristas y la interacción del usuario.
 * Proporciona funcionalidades avanzadas de:
 * - Edición de labels en tiempo real
 * - Creación de nodos desde panel lateral
 * - Creación de nodos haciendo clic en el canvas
 * - Conexión entre nodos mediante arrastre
 * - Panel de control con formulario
 * 
 * @component
 * @returns {JSX.Element} Elemento JSX del componente de flujo
 * 
 * @example
 * // Uso del componente FlowComponent
 * <FlowComponent />
 */
export default function FlowComponent() {

  
  // Referencia al contenedor del ReactFlow para cálculos de posición
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);

  const location = useLocation();
  const params = location ? new URLSearchParams(location.search) : new URLSearchParams(window.location.search);
  const workflowId = params.get('workflowId');

  const loadTemplateFromStorage = () => {
    if (!workflowId) return null;
    try {
      const raw = localStorage.getItem(`workflow_data_${workflowId}`);
      if (!raw) return null;
      return JSON.parse(raw); // { nodes, edges }
    } catch (err) {
      console.warn('No se pudo cargar plantilla del workflow:', err);
      return null;
    }
  };

  // usarlo para inicializar:
  const tpl = loadTemplateFromStorage();
  const nodesToUse = tpl?.nodes?.length ? tpl.nodes : initialNodes;
  const edgesToUse = tpl?.edges?.length ? tpl.edges : initialEdges;

  // Estados para manejar nodos y aristas del diagrama de flujo
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Estados para el panel de creación de nodos
  const [newLabel, setNewLabel] = useState('Nuevo nodo');
  const [newTime, setNewTime] = useState('');
  const [newInCharge, setNewInCharge] = useState('');
  const [newType, setNewType] = useState('custom');

  // Estado para la arista seleccionada (editar/eliminar)
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  // Estado para controlar el menú desplegable
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  
  // Estados para el menú contextual del nodo
  const [selectedNode, setSelectedNode] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [editingNodeData, setEditingNodeData] = useState({ name: '', time: '', inCharge: '' });
  
  // Estados para el arrastre del menú contextual
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Hook de ReactFlow para proyección de coordenadas
  const { project } = useReactFlow();

  

  /**
   * Función para actualizar los datos de un nodo específico.
   * 
   * Esta función permite que los nodos personalizados actualicen
   * su contenido de manera reactiva.
   * 
   * @param {string} nodeId - ID del nodo a actualizar
   * @param {Object} newData - Nuevos datos del nodo (name, time, inCharge)
   */
  const handleChangeLabel = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, ...newData, onChangeLabel: handleChangeLabel } }
          : n
      )
    );
  }, [setNodes]);

  /**
   * Efecto para inyectar la función onChangeLabel en nodos personalizados.
   * 
   * Se ejecuta cuando el componente se monta para asegurar que todos
   * los nodos personalizados tengan acceso a la función de actualización.
   */
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.type === 'custom'
          ? { ...n, data: { ...n.data, onChangeLabel: handleChangeLabel } }
          : n
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Función para manejar la conexión entre nodos.
   * 
   * Se ejecuta cuando el usuario crea una nueva arista
   * arrastrando desde un nodo a otro.
   * 
   * @param {Object} params - Parámetros de la conexión
   */
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  /**
   * Función para crear un nodo centrado en la vista actual.
   * 
   * Calcula la posición del centro del contenedor y crea un nuevo nodo
   * en esa ubicación. Útil para crear nodos desde el panel lateral.
   */
  const createNodeCentered = useCallback(() => {
    // Obtener las dimensiones del contenedor
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    let position = { x: 250, y: 150 }; // Posición por defecto

    // Si tenemos las dimensiones, calcular el centro
    if (bounds) {
      const centerClient = {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2
      };
      position = project({
        x: centerClient.x - bounds.left,
        y: centerClient.y - bounds.top
      });
    }

    // Crear el nuevo nodo
    const newNode = {
      id: getId(),
      type: newType === 'custom' ? 'custom' : undefined,
      position,
      data: newType === 'custom' 
        ? { name: newLabel, time: newTime, inCharge: newInCharge, onChangeLabel: handleChangeLabel }
        : { label: newLabel, onChangeLabel: handleChangeLabel }
    };

    // Agregar el nodo al estado
    setNodes((nds) => nds.concat(newNode));
  }, [newLabel, newTime, newInCharge, newType, project, handleChangeLabel, setNodes]);


  /**
   * Función para manejar el clic en un nodo.
   * 
   * Abre el menú contextual con la información del nodo seleccionado.
   * 
   * @param {Object} event - Evento de clic
   * @param {Object} node - Nodo que fue clicado
   */
  const onNodeClick = useCallback((event, node) => {
    event.stopPropagation();
    
    // Obtener la posición del clic
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (rect) {
      setContextMenuPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
    
    // Configurar el nodo seleccionado y sus datos
    setSelectedNode(node);
    setEditingNodeData({
      name: node.data.name || '',
      time: node.data.time || '',
      inCharge: node.data.inCharge || ''
    });
    setIsContextMenuVisible(true);
  }, []);

  /**
   * Función para cerrar el menú contextual.
   */
  const closeContextMenu = useCallback(() => {
    setIsContextMenuVisible(false);
    setSelectedNode(null);
    setIsDragging(false);
  }, []);

  /**
   * Función para iniciar el arrastre del menú contextual.
   */
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

  /**
   * Función para manejar el movimiento durante el arrastre.
   */
  const handleDragMove = useCallback((event) => {
    if (!isDragging) return;
    
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    if (rect) {
      const newX = event.clientX - rect.left - dragOffset.x;
      const newY = event.clientY - rect.top - dragOffset.y;
      
      // Limitar el movimiento dentro del contenedor
      const maxX = rect.width - 300; // Ancho del menú
      const maxY = rect.height - 200; // Altura aproximada del menú
      
      setContextMenuPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  }, [isDragging, dragOffset]);

  /**
   * Función para finalizar el arrastre.
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Función para actualizar la información del nodo seleccionado.
   */
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

  /**
   * Efecto para cerrar el menú contextual al hacer clic fuera de él.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isContextMenuVisible && !event.target.closest('.node-context-menu')) {
        closeContextMenu();
      }
    };

    if (isContextMenuVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isContextMenuVisible, closeContextMenu]);

  /**
   * Efecto para manejar el arrastre del menú contextual.
   */
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

  /**
   * Función para manejar el evento de arrastre sobre el canvas.
   * 
   * Permite el drag & drop de elementos externos al canvas.
   * Útil para futuras implementaciones de drag & drop desde sidebar.
   * 
   * @param {Object} event - Evento de arrastre
   */
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Handlers para la gestión de interacciones con aristas: selección, edición y eliminación.
   */

  /**
   * Maneja el evento de clic en una arista dentro del canvas de React Flow.
   * Evita el comportamiento predeterminado del panel para prevenir la creación accidental de nodos.
   * Establece el ID de la arista clicada en el estado `selectedEdgeId`,
   * lo que activa la visualización del panel de edición de aristas.
   *
   * @param {MouseEvent} event - El objeto de evento del DOM.
   * @param {Object} edge - El objeto de la arista que fue clicada.
   */
   const onEdgeClick = useCallback((event, edge) => {
     event.preventDefault(); // Evita el comportamiento predeterminado de clic en el panel de React Flow
     setSelectedEdgeId(edge.id); // Establece la arista clicada como seleccionada
   }, []);

  /**
   * Actualiza la etiqueta de una arista específica.
   * Itera sobre la lista actual de aristas y modifica la propiedad `label`
   * para la arista que coincide con el `edgeId` proporcionado.
   *
   * @param {string} edgeId - El identificador único de la arista a actualizar.
   * @param {string} newLabel - La nueva etiqueta a asignar a la arista.
   */
   const saveEdgeLabel = useCallback(
     (edgeId, newLabel) => {
       setEdges((eds) => eds.map((e) => (e.id === edgeId ? { ...e, label: newLabel } : e)));
     },
     [setEdges]
   );

  /**
   * Elimina una arista específica del canvas de React Flow.
   * Filtra la arista con el `edgeId` dado de la lista actual de aristas
   * y restablece el estado `selectedEdgeId` a `null`.
   *
   * @param {string} edgeId - El identificador único de la arista a eliminar.
   */
   const deleteEdge = useCallback(
     (edgeId) => {
       setEdges((eds) => eds.filter((e) => e.id !== edgeId));
       setSelectedEdgeId(null); // Limpia la arista seleccionada después de la eliminación
     },
     [setEdges]
   );

  /**
   * Busca el objeto de la arista actualmente seleccionada en el array `edges`.
   * Esta variable contiene el objeto completo de la arista correspondiente a `selectedEdgeId`,
   * o `null` si no hay ninguna arista seleccionada actualmente.
   */
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) ?? null;

  return (
    <div className="flow-container">
      {/* Panel lateral con formulario para crear nodos */}
      <aside className="flow-panel">
        {/* Título del panel con flecha desplegable */}
        <div 
          className="flow-panel-header"
          onClick={() => setIsMenuExpanded(!isMenuExpanded)}
        >
          <h3 className="flow-panel-title">Crear nodo</h3>
          <span className={`flow-arrow ${isMenuExpanded ? 'expanded' : ''}`}>
            ▼
          </span>
        </div>

        {/* Contenedor desplegable del formulario */}
        <div className={`flow-form-container ${isMenuExpanded ? 'expanded' : ''}`}>
          {/* Campo para el nombre del nodo */}
          <label className="flow-form-label">
            Nombre:
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="flow-form-input"
              placeholder="Ingresa el nombre del nodo"
            />
          </label>

          <label className="flow-form-label">
            Duración:
            <input
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="flow-form-input"
              placeholder="Ingresa la duración de la tarea"
            />
          </label>

          <label className="flow-form-label">
            A cargo:
            <input
              value={newInCharge}
              onChange={(e) => setNewInCharge(e.target.value)}
              className="flow-form-input"
              placeholder="Ingresa la persona encargada"
            />
          </label>

          {/* Selector de tipo de nodo */}
          <label className="flow-form-label">
            Tipo:
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="flow-form-select"
            >
              <option value="custom">Custom</option>
              <option value="default">Default</option>
            </select>
          </label>

          {/* Botón para crear nodo en el centro */}
          <button
            onClick={createNodeCentered}
            className="flow-create-button"
          >
            Crear nodo (centro)
          </button>

          {/* Instrucciones para el usuario */}
          <div className="flow-instructions">
            Usa el botón de arriba para crear nodos en el centro del canvas.
          </div>
        </div>

        {/* Separador visual */}
        <hr className="flow-separator" />

        {/* Tips y consejos */}
        <h4 className="flow-tips-title">Tips</h4>
        <ul className="flow-tips-list">
          <li>Arrastra nodos para reposicionarlos en el canvas</li>
          <li>Conecta nodos arrastrando desde un handle a otro</li>
          <li>Usa los controles para hacer zoom y navegar</li>
          <li>Guarda en localStorage: usa setNodes y setEdges para persistir</li>
          <li>Selecciona una arista para editar su etiqueta o eliminarla</li>
        </ul>

        {/* Editor de aristas en el panel lateral */}
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
      </aside>

      {/* Contenedor principal del ReactFlow */}
      <div ref={reactFlowWrapper} className="flow-canvas-container">
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
          onInit={(instance) => (reactFlowInstance.current = instance)}
          className="flow-canvas"
        >
          {/* Componentes adicionales del diagrama */}
          <MiniMap nodeColor='rgb(179, 64, 64)' />
          <Controls />
          <Background gap={16} />
        </ReactFlow>

        {/* Menú contextual para editar nodos */}
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
              <button 
                className="context-menu-close"
                onClick={closeContextMenu}
              >
                ×
              </button>
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
            </div>
            
            <div className="context-menu-actions">
              <button 
                className="context-menu-save"
                onClick={updateNodeData}
              >
                Guardar
              </button>
              <button 
                className="context-menu-cancel"
                onClick={closeContextMenu}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente wrapper que incluye el ReactFlowProvider.
 * 
 * Este componente envuelve FlowComponent con ReactFlowProvider,
 * necesario para que los hooks de ReactFlow funcionen correctamente.
 * Útil cuando se monta el componente desde App.js.
 * 
 * @component
 * @param {Object} props - Propiedades que se pasan al FlowComponent
 * @returns {JSX.Element} Elemento JSX del componente con provider
 * 
 * @example
 * // Uso del componente con provider
 * <FlowComponentWithProvider />
 */
export function FlowComponentWithProvider(props) {
  return (
    <ReactFlowProvider>
      <FlowComponent {...props} />
    </ReactFlowProvider>
  );
}