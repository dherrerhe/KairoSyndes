// src/hooks/useNodeOperations.js

import { useCallback } from 'react';
import { workflowApi } from '../api/workflowApi';
import { getId } from '../components/flowUtils';

/**
 * Hook para operaciones CRUD de nodos
 * @param {string|number} workflowId - ID del workflow
 * @param {Function} setNodes - Función de ReactFlow para actualizar nodos
 * @param {Function} onSuccess - Callback cuando una operación es exitosa
 * @param {Function} onError - Callback cuando una operación falla
 * @returns {Object} Funciones para manipular nodos
 */
export const useNodeOperations = (workflowId, setNodes, onSuccess, onError) => {
  
  /**
   * Obtener IP del usuario
   */
  const getUserIP = useCallback(async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.warn('No se pudo obtener la IP del usuario:', error);
      return 'IP no disponible';
    }
  }, []);

  /**
   * Crear un nuevo nodo
   * @param {Object} nodeData - {name, time, inCharge, type}
   * @param {Object} position - {x, y} posición del nodo
   */
  const createNode = useCallback(async (nodeData, position = null) => {
    if (!workflowId) {
      onError?.('No hay workflowId activo');
      return null;
    }

    try {
      const userIP = await getUserIP();
      const tempId = getId();
      
      // Generar posición aleatoria si no se proporciona
      const nodePosition = position || {
        x: 120 + Math.random() * 200,
        y: 120 + Math.random() * 80
      };

      const { name, time = '', inCharge = '', type = 'custom' } = nodeData;

      // Crear nodo local (optimistic update)
      const localNode = type === 'custom'
        ? {
            id: tempId,
            type: 'custom',
            position: nodePosition,
            data: { name, time, inCharge, ip: userIP, progress: 0 }
          }
        : {
            id: tempId,
            position: nodePosition,
            data: { label: name }
          };

      setNodes((existingNodes) => [...existingNodes, localNode]);

      // Guardar en el backend
      const savedNode = await workflowApi.createNode(workflowId, {
        workflow: parseInt(workflowId),
        node_type: type,
        name: name,
        position: nodePosition,
        data: type === 'custom'
          ? { name, time, inCharge, ip: userIP, progress: 0 }
          : { label: name }
      });

      // Actualizar con el ID real del backend
      setNodes((nds) =>
        nds.map((n) =>
          n.id === tempId
            ? { ...n, id: savedNode.id.toString() }
            : n
        )
      );

      onSuccess?.('Nodo creado correctamente');
      return savedNode;

    } catch (error) {
      console.error('Error creando nodo:', error);
      onError?.(error.message);
      // Revertir optimistic update
      setNodes((nds) => nds.filter((n) => n.id !== tempId));
      return null;
    }
  }, [workflowId, setNodes, getUserIP, onSuccess, onError]);

  /**
   * Actualizar un nodo existente
   * @param {string} nodeId - ID del nodo
   * @param {Object} updates - Datos a actualizar
   */
  const updateNode = useCallback(async (nodeId, updates) => {
    if (!workflowId) {
      onError?.('No hay workflowId activo');
      return null;
    }

    try {
      const userIP = await getUserIP();
      
      // Validar progreso si existe
      const validProgress = updates.progress !== undefined
        ? Math.max(0, Math.min(100, Number(updates.progress) || 0))
        : undefined;

      const updatedData = {
        ...updates,
        ...(validProgress !== undefined && { progress: validProgress }),
        ip: userIP
      };

      // Actualizar localmente primero (optimistic update)
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, ...updatedData } }
            : n
        )
      );

      // Actualizar en el backend
      const savedNode = await workflowApi.updateNode(workflowId, nodeId, {
        name: updates.name,
        data: {
          name: updates.name,
          time: updates.time,
          inCharge: updates.inCharge,
          progress: validProgress !== undefined ? validProgress : updates.progress,
          ip: userIP
        }
      });

      onSuccess?.('Nodo actualizado correctamente');
      return savedNode;

    } catch (error) {
      console.error('Error actualizando nodo:', error);
      onError?.(error.message);
      // TODO: Revertir cambios en caso de error
      return null;
    }
  }, [workflowId, setNodes, getUserIP, onSuccess, onError]);

  /**
   * Actualizar solo la posición de un nodo (para drag & drop)
   * @param {string} nodeId - ID del nodo
   * @param {Object} position - {x, y}
   */
  const updateNodePosition = useCallback(async (nodeId, position) => {
    if (!workflowId) return;

    try {
      // Actualizar localmente
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, position } : n
        )
      );

      // Actualizar en backend (sin mostrar feedback)
      await workflowApi.updateNodePosition(workflowId, nodeId, position);

    } catch (error) {
      console.error('Error actualizando posición:', error);
      // No mostrar error al usuario por drag & drop
    }
  }, [workflowId, setNodes]);

  /**
   * Eliminar un nodo
   * @param {string} nodeId - ID del nodo a eliminar
   */
  const deleteNode = useCallback(async (nodeId) => {
    if (!workflowId) {
      onError?.('No hay workflowId activo');
      return false;
    }

    try {
      // Guardar nodo para poder revertir
      let deletedNode = null;
      setNodes((nds) => {
        deletedNode = nds.find(n => n.id === nodeId);
        return nds.filter((n) => n.id !== nodeId);
      });

      // Eliminar del backend
      await workflowApi.deleteNode(workflowId, nodeId);

      onSuccess?.('Nodo eliminado correctamente');
      return true;

    } catch (error) {
      console.error('Error eliminando nodo:', error);
      onError?.(error.message);
      // Revertir eliminación
      if (deletedNode) {
        setNodes((nds) => [...nds, deletedNode]);
      }
      return false;
    }
  }, [workflowId, setNodes, onSuccess, onError]);

  /**
   * Resetear flujo a estado inicial
   * @param {Array} initialNodes - Nodos iniciales
   */
  const resetNodes = useCallback((initialNodes = []) => {
    setNodes(initialNodes);
    onSuccess?.('Nodos reseteados');
  }, [setNodes, onSuccess]);

  return {
    createNode,
    updateNode,
    updateNodePosition,
    deleteNode,
    resetNodes,
    getUserIP, // Exportar por si se necesita en otro lugar
  };
};