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

const nodeTypes = { custom: CustomNode };

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

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' }
];

export default function FlowComponent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Para que el CustomNode pueda actualizar su label, le pasamos una función en data.onChangeLabel
  // La función aquí actualiza el arreglo de nodes.
  const handleChangeLabel = useCallback((nodeId, newLabel) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel, onChangeLabel: handleChangeLabel } } : n))
    );
  }, [setNodes]);

  // Necesitamos inyectar la función onChangeLabel en cada nodo custom (para cuando se monte)
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        n.type === 'custom'
          ? { ...n, data: { ...n.data, onChangeLabel: handleChangeLabel } }
          : n
      )
    );
  }, [handleChangeLabel]); // Incluimos handleChangeLabel en las dependencias

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '700px' }}>
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
          <MiniMap />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
