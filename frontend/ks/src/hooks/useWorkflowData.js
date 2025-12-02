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

  // Cargar workflow completo desde el backend
  useEffect(() => {
    const loadWorkflowData = async () => {
      // Si no hay workflowId, no cargar nada
      if (!workflowId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        // Cargar nodos y edges en paralelo
        const [nodesData, edgesData] = await Promise.all([
          workflowApi.fetchNodes(workflowId),
          workflowApi.fetchEdges(workflowId),
        ]);

        // Transformar datos del backend al formato ReactFlow
        const transformedNodes = nodesData.map(transformNodeFromBackend);
        const transformedEdges = edgesData.map(transformEdgeFromBackend);

        setNodes(transformedNodes);
        setEdges(transformedEdges);

        // Opcionalmente cargar info del workflow completo
        try {
          const workflowData = await workflowApi.fetchWorkflow(workflowId);
          setWorkflow(workflowData);
        } catch (err) {
          console.warn('No se pudo cargar info del workflow:', err);
        }

      } catch (error) {
        console.error('Error cargando workflow:', error);
        setLoadError(error.message);
        // Mantener arrays vacíos en caso de error
        setNodes([]);
        setEdges([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkflowData();
  }, [workflowId]);

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
    
    // Setters (para que ReactFlow pueda actualizar)
    setNodes,
    setEdges,
    
    // Acciones
    reloadWorkflow,
  };
};