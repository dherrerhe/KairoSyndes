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
export const useNodeOperations = (workflowId, setNodes, onSuccess, onError, handleChangeLabel, handleShowComments) => {
  
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
  
    let tempId;
  
    try {
      const userIP = await getUserIP();
      tempId = String(getId());
      
      const nodePosition = position || {
        x: 120 + Math.random() * 200,
        y: 120 + Math.random() * 80
      };
  
      const { 
        name, 
        time = '', 
        inCharge = '', 
        description = '',
        color = '#4CAF50',
        type = 'custom' 
      } = nodeData;
  
      const localNode = type === 'custom'
        ? {
            id: tempId,
            type: 'custom',
            position: nodePosition,
            data: { 
              name, 
              time, 
              inCharge, 
              description,
              color,
              ip: userIP, 
              progress: 0,
              comments: [],
              onChangeLabel: handleChangeLabel,
              onShowComments: handleShowComments
            }
          }
        : {
            id: tempId,
            position: nodePosition,
            data: { label: name }
          };
  
      setNodes((existingNodes) => [...existingNodes, localNode]);
  
      const savedNode = await workflowApi.createNode(workflowId, {
        workflow: parseInt(workflowId),
        node_type: type,
        name: name,
        position: nodePosition,
        data: type === 'custom'
          ? { 
              name, 
              time, 
              inCharge, 
              description,
              color,
              ip: userIP, 
              progress: 0 
            }
          : { label: name }
      });
  
      setNodes((nds) =>
        nds.map((n) =>
          n.id === tempId
            ? { 
                ...n, 
                id: savedNode.id.toString(),
                data: {
                  ...n.data,
                  comments: [],
                  onChangeLabel: handleChangeLabel,
                  onShowComments: handleShowComments
                }
              }
            : n
        )
      );
  
      onSuccess?.('Nodo creado correctamente');
      return savedNode;
  
    } catch (error) {
      console.error('Error creando nodo:', error);
      onError?.(error.message);
      if (tempId) {
        setNodes((nds) => nds.filter((n) => n.id !== tempId));
      }
      return null;
    }
  }, [workflowId, setNodes, getUserIP, onSuccess, onError, handleChangeLabel, handleShowComments]);

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
      
      const validProgress = updates.progress !== undefined
        ? Math.max(0, Math.min(100, Number(updates.progress) || 0))
        : undefined;
  
      const updatedData = {
        ...updates,
        ...(validProgress !== undefined && { progress: validProgress }),
        ip: userIP
      };
  
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, ...updatedData } }
            : n
        )
      );
  
      const savedNode = await workflowApi.updateNode(workflowId, nodeId, {
        name: updates.name,
        data: {
          name: updates.name,
          time: updates.time,
          inCharge: updates.inCharge,
          description: updates.description,
          color: updates.color,
          progress: validProgress !== undefined ? validProgress : updates.progress,
          ip: userIP
        }
      });
  
      onSuccess?.('Nodo actualizado correctamente');
      return savedNode;
  
    } catch (error) {
      console.error('Error actualizando nodo:', error);
      onError?.(error.message);
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

    // Usar una referencia mutable para conservar el nodo eliminado
    let deletedNodeRef = { current: null };

    try {
      // Guardar nodo para poder revertir, usando ref para que esté accesible en catch
      setNodes((nds) => {
        const foundNode = nds.find(n => n.id === nodeId);
        deletedNodeRef.current = foundNode;
        return nds.filter((n) => n.id !== nodeId);
      });

      // Eliminar del backend
      await workflowApi.deleteNode(workflowId, nodeId);

      onSuccess?.('Nodo eliminado correctamente');
      return true;

    } catch (error) {
      console.error('Error eliminando nodo:', error);
      onError?.(error.message);
      // Revertir eliminación solo si deletedNode es válido y no existe en la lista
      if (deletedNodeRef.current) {
        setNodes((nds) => {
          const exists = nds.some(n => n.id === deletedNodeRef.current.id);
          return exists ? nds : [...nds, deletedNodeRef.current];
        });
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