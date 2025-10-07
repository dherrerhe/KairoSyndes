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
const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' }
];

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

  // Estados para manejar nodos y aristas del diagrama de flujo
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Estados para el panel de creación de nodos
  const [newLabel, setNewLabel] = useState('Nuevo nodo');
  const [newType, setNewType] = useState('custom');

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
        ? { name: newLabel, time: '', inCharge: '', onChangeLabel: handleChangeLabel }
        : { label: newLabel, onChangeLabel: handleChangeLabel }
    };

    // Agregar el nodo al estado
    setNodes((nds) => nds.concat(newNode));
  }, [newLabel, newType, project, handleChangeLabel, setNodes]);


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

  return (
    <div className="flow-container">
      {/* Panel lateral con formulario para crear nodos */}
      <aside className="flow-panel">
        {/* Título del panel */}
        <h3 className="flow-panel-title">Crear nodo</h3>

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
          Time:
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="flow-form-input"
            placeholder="Ingresa la duración de la tarea"
          />
        </label>
        <label className="flow-form-label">
          InCharge:
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
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

        {/* Separador visual */}
        <hr className="flow-separator" />

        {/* Tips y consejos */}
        <h4 className="flow-tips-title">Tips</h4>
        <ul className="flow-tips-list">
          <li>Arrastra nodos para reposicionarlos en el canvas</li>
          <li>Conecta nodos arrastrando desde un handle a otro</li>
          <li>Usa los controles para hacer zoom y navegar</li>
          <li>Guarda en localStorage: usa setNodes y setEdges para persistir</li>
        </ul>
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
          nodeTypes={nodeTypes}
          fitView
          className="flow-canvas"
        >
          {/* Componentes adicionales del diagrama */}
          <MiniMap nodeColor='rgb(179, 64, 64)' />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
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