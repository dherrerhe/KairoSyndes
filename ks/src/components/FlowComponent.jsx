/**
 * Componente principal de ReactFlow para visualizar diagramas de flujo.
 * 
 * Este componente maneja la lógica principal del diagrama de flujo,
 * incluyendo la gestión de nodos, aristas y la interacción del usuario.
 * Utiliza nodos personalizados que permiten editar su contenido.
 * 
 * @fileoverview Componente principal FlowComponent para ReactFlow
 * @author KairoSyndes
 * @version 1.0.0
 */

// src/components/FlowComponent.jsx
import React, { useCallback } from 'react';
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

// Configuración de tipos de nodos personalizados
const nodeTypes = { custom: CustomNode };

// Nodos iniciales del diagrama de flujo
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

// Aristas iniciales del diagrama de flujo
const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' }
];

/**
 * Componente principal del diagrama de flujo.
 * 
 * Maneja el estado de los nodos y aristas, proporciona funcionalidades
 * de edición de labels y conexión entre nodos.
 * 
 * @returns {JSX.Element} Elemento JSX del componente de flujo
 */
export default function FlowComponent() {
  // Estados para manejar nodos y aristas
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
  function nodeColor(node) {
    switch (node.type) {
      case 'input':
        return '#6ede87';
      case 'output':
        return '#6865A5';
      default:
        return '#808080'; // Color gris para los nodos por defecto (comandos)
    }
  }
}

