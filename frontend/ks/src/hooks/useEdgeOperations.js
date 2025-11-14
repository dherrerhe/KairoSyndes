// src/hooks/useEdgeOperations.js

import { useCallback } from 'react';
import { addEdge } from 'reactflow';
import { workflowApi } from '../api/workflowApi';

/**
 * Hook para operaciones CRUD de edges (conexiones)
 * @param {string|number} workflowId - ID del workflow
 * @param {Function} setEdges - Función de ReactFlow para actualizar edges
 * @param {Function} onSuccess - Callback cuando una operación es exitosa
 * @param {Function} onError - Callback cuando una operación falla
 * @returns {Object} Funciones para manipular edges
 */
export const useEdgeOperations = (workflowId, setEdges, onSuccess, onError) => {
  
  /**
   * Crear una nueva conexión entre nodos
   * @param {Object} connection - Parámetros de ReactFlow (source, target, etc.)
   */
  const createEdge = useCallback(async (connection) => {
    if (!workflowId) {
      onError?.('No hay workflowId activo');
      return null;
    }

    try {
      // Agregar edge localmente (optimistic update)
      let newEdge = null;
      setEdges((eds) => {
        const updatedEdges = addEdge(connection, eds);
        newEdge = updatedEdges[updatedEdges.length - 1];
        return updatedEdges;
      });

      // Guardar en backend
      const savedEdge = await workflowApi.createEdge(workflowId, {
        workflow: parseInt(workflowId),
        source: parseInt(connection.source),  // ForeignKey a Node
        target: parseInt(connection.target),  // ForeignKey a Node
        label: connection.label || '',
        data: {
          edge_type: connection.type || 'default',
          animated: connection.animated || false,
          style: connection.style || {},
        }
      });

      // Actualizar con ID real del backend
      setEdges((eds) =>
        eds.map((e) =>
          e.id === newEdge.id
            ? { ...e, id: savedEdge.id.toString() }
            : e
        )
      );

      onSuccess?.('Conexión creada correctamente');
      return savedEdge;

    } catch (error) {
      console.error('Error creando edge:', error);
      onError?.(error.message);
      // Revertir optimistic update
      if (newEdge) {
        setEdges((eds) => eds.filter((e) => e.id !== newEdge.id));
      }
      return null;
    }
  }, [workflowId, setEdges, onSuccess, onError]);

  /**
   * Actualizar un edge existente (ej: cambiar label)
   * @param {string} edgeId - ID del edge
   * @param {Object} updates - Datos a actualizar {label, type, animated, style}
   */
  const updateEdge = useCallback(async (edgeId, updates) => {
    if (!workflowId) {
      onError?.('No hay workflowId activo');
      return null;
    }

    try {
      // Actualizar localmente primero
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId ? { ...e, ...updates } : e
        )
      );

      // Actualizar en backend
      const savedEdge = await workflowApi.updateEdge(workflowId, edgeId, updates);

      onSuccess?.('Conexión actualizada correctamente');
      return savedEdge;

    } catch (error) {
      console.error('Error actualizando edge:', error);
      onError?.(error.message);
      // TODO: Revertir cambios en caso de error
      return null;
    }
  }, [workflowId, setEdges, onSuccess, onError]);

  /**
   * Actualizar solo el label de un edge
   * @param {string} edgeId - ID del edge
   * @param {string} newLabel - Nuevo label
   */
  const updateEdgeLabel = useCallback(async (edgeId, newLabel) => {
    return await updateEdge(edgeId, { label: newLabel });
  }, [updateEdge]);

  /**
   * Eliminar un edge
   * @param {string} edgeId - ID del edge a eliminar
   */
  const deleteEdge = useCallback(async (edgeId) => {
    if (!workflowId) {
      onError?.('No hay workflowId activo');
      return false;
    }

    try {
      // Guardar edge para poder revertir
      let deletedEdge = null;
      setEdges((eds) => {
        deletedEdge = eds.find(e => e.id === edgeId);
        return eds.filter((e) => e.id !== edgeId);
      });

      // Eliminar del backend
      await workflowApi.deleteEdge(workflowId, edgeId);

      onSuccess?.('Conexión eliminada correctamente');
      return true;

    } catch (error) {
      console.error('Error eliminando edge:', error);
      onError?.(error.message);
      // Revertir eliminación
      if (deletedEdge) {
        setEdges((eds) => [...eds, deletedEdge]);
      }
      return false;
    }
  }, [workflowId, setEdges, onSuccess, onError]);

  /**
   * Resetear edges a estado inicial
   * @param {Array} initialEdges - Edges iniciales
   */
  const resetEdges = useCallback((initialEdges = []) => {
    setEdges(initialEdges);
    onSuccess?.('Conexiones reseteadas');
  }, [setEdges, onSuccess]);

  /**
   * Handler para el evento onConnect de ReactFlow
   * Wrapper que llama a createEdge automáticamente
   */
  const handleConnect = useCallback((connection) => {
    createEdge(connection);
  }, [createEdge]);

  return {
    createEdge,
    updateEdge,
    updateEdgeLabel,
    deleteEdge,
    resetEdges,
    handleConnect, // Este es el que se pasa a ReactFlow como onConnect
  };
};