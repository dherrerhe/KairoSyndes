import { useEffect, useState } from 'react';
import { workflowApi } from '../api/workflowApi';
import useFeedback from './useFeedback';

// Hook encargado de cargar y guardar el workflow (nodes + edges)
export default function useWorkflowData(workflowId, { initialNodes = [], initialEdges = [] } = {}) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [isLoading, setIsLoading] = useState(Boolean(workflowId));
  const [loadError, setLoadError] = useState(null);
  const { feedback, show } = useFeedback();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!workflowId) {
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
        if (!mounted) return;

        const transformedNodes = nodesData.map((n) => ({
          id: n.id.toString(),
          type: n.node_type === 'custom' ? 'custom' : undefined,
          position: n.position || { x: 100, y: 100 },
          data: {
            name: n.data?.name || n.name || 'Sin nombre',
            time: n.data?.time || '',
            inCharge: n.data?.inCharge || '',
            ip: n.data?.ip || '',
            progress: n.data?.progress ?? 0,
          },
        }));

        const transformedEdges = edgesData.map((e) => ({
          id: e.id.toString(),
          source: e.source_node.toString(),
          target: e.target_node.toString(),
          label: e.label || e.condition_type || '',
          type: e.edge_type || 'default',
          animated: e.animated || false,
          style: e.style || {},
        }));

        setNodes(transformedNodes);
        setEdges(transformedEdges);
        show('Workflow cargado correctamente.', 2000);
      } catch (err) {
        console.error('Carga workflow error', err);
        setLoadError(err.message || 'Error desconocido');
        setNodes(initialNodes);
        setEdges(initialEdges);
        show(`Error: ${err.message || 'Error cargando'}`, 3000);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId]);

  const saveWorkflowToBackend = async () => {
    if (!workflowId) {
      show('No hay workflowId definido.', 2000);
      return;
    }
    try {
      const nodesForSave = nodes.map(n => ({
        id: parseInt(n.id) || undefined,
        node_type: n.type || 'default',
        position: n.position,
        data: n.data
      }));
      const edgesForSave = edges.map(e => ({
        id: parseInt(e.id) || undefined,
        source_node: parseInt(e.source),
        target_node: parseInt(e.target),
        label: e.label,
        edge_type: e.type || 'default',
        animated: e.animated || false,
        style: e.style || {}
      }));
      await workflowApi.saveWorkflow(workflowId, nodesForSave, edgesForSave);
      show('Workflow guardado en el servidor.', 2000);
    } catch (err) {
      console.error('Error guardando workflow', err);
      show(`Error: ${err.message || 'No se pudo guardar'}`, 3000);
    }
  };

  return { nodes, setNodes, edges, setEdges, isLoading, loadError, saveWorkflowToBackend, feedback };
}