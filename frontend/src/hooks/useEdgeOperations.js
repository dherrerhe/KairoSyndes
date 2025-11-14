import { useCallback } from 'react';
import { addEdge } from 'reactflow';
import { workflowApi } from '../api/workflowApi';

// Encapsula operaciones de edges (crear, actualizar, eliminar)
export default function useEdgeOperations({ workflowId, edges, setEdges, showFeedback }) {
  const onConnect = useCallback(async (params) => {
    setEdges((eds) => addEdge(params, eds));
    if (!workflowId) return;
    try {
      await workflowApi.createEdge(workflowId, {
        workflow: parseInt(workflowId),
        source_node: parseInt(params.source),
        target_node: parseInt(params.target),
        edge_type: params.type || 'default',
        label: params.label || '',
      });
      showFeedback('Conexión guardada.');
    } catch (err) {
      console.error('Error guardando edge', err);
      showFeedback(`Error al guardar conexión: ${err.message || ''}`);
    }
  }, [setEdges, workflowId, showFeedback]);

  const saveEdgeLabel = useCallback(async (edgeId, newLabel) => {
    setEdges((eds) => eds.map((e) => (e.id === edgeId ? { ...e, label: newLabel } : e)));
    if (!workflowId) return;
    try {
      await workflowApi.updateEdge(workflowId, edgeId, { label: newLabel });
      showFeedback('Etiqueta de arista actualizada.');
    } catch (err) {
      console.error('Error actualizando edge label', err);
      showFeedback(`Error: ${err.message || ''}`);
    }
  }, [setEdges, workflowId, showFeedback]);

  const deleteEdge = useCallback(async (edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    if (!workflowId) return;
    try {
      await workflowApi.deleteEdge(workflowId, edgeId);
      showFeedback('Arista eliminada.');
    } catch (err) {
      console.error('Error eliminando edge', err);
      showFeedback(`Error: ${err.message || ''}`);
    }
  }, [setEdges, workflowId, showFeedback]);

  return { onConnect, saveEdgeLabel, deleteEdge };
}