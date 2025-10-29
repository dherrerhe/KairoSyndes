/**
 * FlowCanvas.jsx
 * Sólo renderiza <ReactFlow ...> con los nodos, aristas y callbacks recibidos por props.
 * Este componente es "presentacional": toda la lógica de estado y handlers viene por props.
 */

import React from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';

/**
 * FlowCanvas
 * @param {object[]} nodes - array de nodos (estado, viene del padre)
 * @param {object[]} edges - array de aristas (estado, viene del padre)
 * @param {function} onNodesChange - callback para cambios en nodos
 * @param {function} onEdgesChange - callback para cambios en aristas
 * @param {function} onConnect - callback para crear conexión nueva
 * @param {function} onNodeClick - callback al hacer click/nodo
 * @param {function} onEdgeClick - callback al hacer click/arista
 * @param {function} onDragOver - callback para drag&drop (opcional)
 * @param {object} nodeTypes - tipos personalizados de nodos (opcional)
 * @param {object} edgeTypes - tipos personalizados de aristas (opcional)
 * @param {function} onInit - callback cuando ReactFlow está listo (opcional)
 * @param {object} style - estilos extra (opcional)
 * ...otros props posibles
 */
export default function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onDragOver,
  nodeTypes,
  edgeTypes,
  onInit,
  style,
  children,
  ...rest
}) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onDragOver={onDragOver}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onInit={onInit}
      fitView
      style={{ width: '100%', height: '100%', ...(style || {}) }}
      {...rest}
    >
      {/*
        MiniMap es un componente opcional de React Flow que muestra una vista en miniatura de tu workflow.
        Sus atributos principales incluyen:

        - nodeColor: color de los nodos en la vista previa. Puede ser un string fijo, o una función (node) => color
        - nodeStrokeColor: color del borde del nodo, igual que arriba, puede ser función o string fijo
        - nodeBorderRadius: radio de borde de los nodos (por defecto 2)
        - nodeClassName: clase CSS o función para customizar clases por nodo
        - maskColor: color de fondo semitransparente fuera del área visible (por defecto rgba(240,240,240,0.7))
        - zoomable: si permite hacer zoom en el minimap (por defecto false)
        - pannable: si permite arrastrar el minimap (por defecto false)
        - style: estilos personalizados para el MiniMap (width, height, posición, etc)
        */}
    
      <MiniMap 
          nodeColor={node => node.type === 'custom' ? '#1976d2' : '#b34040'} 
          nodeStrokeColor="#000"
          nodeBorderRadius={4}
          maskColor="rgba(210,210,250,0.5)"
          pannable
          zoomable
          style={{ height: 90, right: 4, bottom: 4 }}
        />
      <Controls />
      <Background gap={16} />
      {/* Renderiza elementos hijos extra (por ejemplo, overlays, tooltips, etc) */}
      {children}
    </ReactFlow>
  );
}
