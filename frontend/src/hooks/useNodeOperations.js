import { useCallback } from 'react';
import { workflowApi } from '../api/workflowApi';
import { getId, getUserIP } from '../utils/flowUtils';

// Encapsula operaciones de nodo (crear, actualizar, añadir centrado)
export default function useNodeOperations({ workflowId, nodes, setNodes, showFeedback }) {
  const createNodeLocal = useCallback((node) => {
    setNodes((existing) => [...existing, node]);
  }, [setNodes]);

  const addNode = useCallback(async ({ name, time, inCharge, type = 'custom' }) => {
    if (!workflowId) {
      showFeedback('No hay workflowId activo.');
      return;
    }
    const userIP = await getUserIP();
    const tempId = getId();
    const position = { x: 120 + Math.random() * 200, y: 120 + Math.random() * 80 };

    const nodeToAdd = type === 'custom'
      ? { id: tempId, type: 'custom', position, data: { name, time, inCharge, ip: userIP, progress: 0 } }
      : { id: tempId, position, data: { label: name } };

    createNodeLocal(nodeToAdd);

    try {
      const savedNode = await workflowApi.createNode(workflowId, {
        workflow: parseInt(workflowId),
        node_type: type,
        name,
        position,
        data: type === 'custom' ? { name, time, inCharge, ip: userIP, progress: 0 } : { label: name }
      });

      setNodes((nds) => nds.map((n) => (n.id === tempId ? { ...n, id: savedNode.id.toString() } : n)));
      showFeedback('Nodo creado correctamente.');
    } catch (err) {
      console.error('Error creando nodo:', err);
      setNodes((nds) => nds.filter((n) => n.id !== tempId));
      showFeedback(`Error: ${err.message || 'no se pudo crear nodo'}`);
    }
  }, [workflowId, createNodeLocal, setNodes, showFeedback]);

  const updateNode = useCallback(async (workflowIdLocal, nodeId, payload) => {
    try {
      await workflowApi.updateNode(workflowIdLocal, nodeId, payload);
      showFeedback('Nodo actualizado correctamente.');
    } catch (err) {
      console.error('Error actualizando nodo:', err);
      showFeedback(`Error: ${err.message || 'error actualizando'}`);
    }
  }, [showFeedback]);

  const createNodeCentered = useCallback(async (label, position, type = 'custom') => {
    // position param: {x,y} computed by caller with reactFlowInstance.project
    const tempId = getId();
    const userIP = await getUserIP();
    const newNode = {
      id: tempId,
      type: type === 'custom' ? 'custom' : undefined,
      position,
      data: type === 'custom' ? { name: label, time: '', inCharge: '', ip: userIP, progress: 0 } : { label }
    };
    createNodeLocal(newNode);

    if (!workflowId) return;
    try {
      const savedNode = await workflowApi.createNode(workflowId, {
        workflow: parseInt(workflowId),
        node_type: type,
        name: label,
        position,
        data: newNode.data
      });
      setNodes((nds) => nds.map((n) => (n.id === tempId ? { ...n, id: savedNode.id.toString() } : n)));
    } catch (err) {
      console.error('Error guardando nodo centrado:', err);
      // no revertamos acá por simplicidad
    }
  }, [createNodeLocal, workflowId, setNodes]);

  return { addNode, updateNode, createNodeCentered };
}