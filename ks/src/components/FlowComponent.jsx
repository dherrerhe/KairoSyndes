/**
 * @fileoverview Componente principal de ReactFlow para visualizar diagramas de flujo
 * @description Componente que maneja la lógica principal del diagrama de flujo,
 * incluyendo la gestión de nodos, aristas y la interacción del usuario.
 * Utiliza nodos personalizados que permiten editar su contenido en tiempo real.
 * @author KairoSyndes
 * @version 1.0.0
 * @since 2024
 */

// Importación de React y hooks
import React, { useCallback } from 'react';

// Importaciones de ReactFlow
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background
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
 * Nodos iniciales del diagrama de flujo.
 * Define la estructura inicial de nodos que aparecerán al cargar el componente.
 */
const initialNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 5 },
    data: { label: 'Nodo A' }
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 100, y: 150 },
    data: { label: 'Nodo B' }
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
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' }
];

/**
 * Componente principal del diagrama de flujo.
 * 
 * Este componente maneja la lógica principal del diagrama de flujo,
 * incluyendo la gestión de nodos, aristas y la interacción del usuario.
 * Proporciona funcionalidades de edición de labels y conexión entre nodos.
 * 
 * @component
 * @returns {JSX.Element} Elemento JSX del componente de flujo
 * 
 * @example
 * // Uso del componente FlowComponent
 * <FlowComponent />
 */
export default function FlowComponent() {
  // Estados para manejar nodos y aristas del diagrama de flujo
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  /**
   * Función para actualizar el label de un nodo específico.
   * 
   * Esta función permite que los nodos personalizados actualicen
   * su contenido de manera reactiva.
   * 
   * @param {string} nodeId - ID del nodo a actualizar
   * @param {string} newLabel - Nuevo texto del label
   */
  const handleChangeLabel = useCallback((nodeId, newLabel) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel, onChangeLabel: handleChangeLabel } } : n))
    );
  }, [setNodes]);

  /**
   * Efecto para inyectar la función onChangeLabel en nodos personalizados.
   * 
   * Se ejecuta cuando el componente se monta y cuando cambia handleChangeLabel
   * para asegurar que todos los nodos personalizados tengan acceso a la función.
   */
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.type === 'custom'
          ? { ...n, data: { ...n.data, onChangeLabel: handleChangeLabel } }
          : n
      )
    );
  }, [handleChangeLabel]); // Incluimos handleChangeLabel en las dependencias

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
   * Determina el color de un nodo basado en su tipo.
   * 
   * Esta función se utiliza para asignar un color visual a los nodos
   * en el MiniMap, ayudando a diferenciar los tipos de nodos.
   * 
   * @param {Object} node - El objeto nodo de ReactFlow.
   * @param {string} node.type - El tipo del nodo (e.g., 'input', 'output', 'custom').
   * @returns {string} El color hexadecimal correspondiente al tipo de nodo.
   */
  const nodeColor = (node) => {
    switch (node.type) {
      case 'input':
        return '#6ede87';
      case 'output':
        return '#6865A5';
      default:
        return '#808080'; // Color gris para los nodos por defecto (comandos)
    }
  };

  return (
    <div style={{ width: '100%', height: '700px' }} >
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          {/* Componentes adicionales del diagrama */}
          <MiniMap bgColor="#ADD8E6" nodeColor={nodeColor} maskColor='rgba(146, 36, 36, 0.6)'/>
          <Controls />
          <Background gap={16}/>
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

