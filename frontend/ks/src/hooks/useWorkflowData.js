// src/hooks/useWorkflowData.js

import { useState, useEffect } from 'react';
import { workflowApi, transformNodeFromBackend, transformEdgeFromBackend } from '../api/workflowApi';

/**
 * Hook para cargar y gestionar los datos de un workflow desde el backend
 * @param {string|number} workflowId - ID del workflow a cargar
 * @returns {Object} Estado y funciones del workflow
 */
export const useWorkflowData = (workflowId) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar workflow completo desde el backend
  useEffect(() => {
    const loadWorkflowData = async () => {
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

        const transformedNodes = nodesData.map(transformNodeFromBackend);
        const transformedEdges = edgesData.map(transformEdgeFromBackend);

        setNodes(transformedNodes);
        setEdges(transformedEdges);

        try {
          const workflowData = await workflowApi.fetchWorkflow(workflowId);
          setWorkflow(workflowData);
        } catch (err) {
          console.warn('No se pudo cargar info del workflow:', err);
        }

      } catch (error) {
        console.error('Error cargando workflow:', error);
        setLoadError(error.message);
        setNodes([]);
        setEdges([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflowData();
  }, [workflowId]);

  /**
   * Guardar cambios de nodos y edges en el backend
   */
  const saveChanges = async (nodesToSave, edgesToSave) => {
    if (!workflowId) return false;

    setIsSaving(true);
    try {
      // Preparar datos para enviar
      const payload = {
        name: workflow?.name || 'Untitled Workflow',
        nodes: nodesToSave || nodes,
        edges: edgesToSave || edges,
      };

      // Enviar al backend
      await workflowApi.saveWorkflow(workflowId, payload.nodes, payload.edges);
      
      console.log('Cambios guardados en el servidor');
      return true;

    } catch (error) {
      console.error('Error guardando cambios:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Recargar workflow desde el backend
   */
  const reloadWorkflow = async () => {
    if (!workflowId) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const [nodesData, edgesData] = await Promise.all([
        workflowApi.fetchNodes(workflowId),
        workflowApi.fetchEdges(workflowId),
      ]);

      const transformedNodes = nodesData.map(transformNodeFromBackend);
      const transformedEdges = edgesData.map(transformEdgeFromBackend);

      setNodes(transformedNodes);
      setEdges(transformedEdges);
    } catch (error) {
      console.error('Error recargando workflow:', error);
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Estados
    nodes,
    edges,
    workflow,
    isLoading,
    loadError,
    isSaving,
    
    // Setters (para que ReactFlow pueda actualizar)
    setNodes,
    setEdges,
    
    // Acciones
    saveChanges,
    reloadWorkflow,
  };
};