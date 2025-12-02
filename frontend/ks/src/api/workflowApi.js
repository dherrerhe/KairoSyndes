// src/api/workflowApi.js

// Usando proxy configurado en package.json
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Función helper para hacer llamadas a la API
 * Maneja headers, autenticación y errores de forma centralizada
 */
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` }), // ← "Token" no "Bearer"
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Debug: log de headers enviados
    console.log('Headers enviados:', headers);
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `Error ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};
/**
 * API de Workflows
 * Centraliza todas las operaciones CRUD con el backend Django
 */
export const workflowApi = {
  // ============================================
  // WORKFLOWS
  // ============================================
  
  /**
   * Obtener un workflow por ID
   * @param {string|number} workflowId - ID del workflow
   * @returns {Promise<Object>} Datos del workflow
   */
  fetchWorkflow: async (workflowId) => {
    return await apiCall(`/workflows/${workflowId}/`);
  },

  /**
  * Obtener lista de todos los workflows
  * @returns {Promise<Array>} Lista de workflows
  */
 fetchAllWorkflows: async () => {
   return await apiCall('/workflows/');
 },
 
 /**
  * Crear un nuevo workflow
  * @param {Object} workflowData - Datos del workflow
  * @returns {Promise<Object>} Workflow creado
  */
 createWorkflow: async (workflowData) => {
   return await apiCall('/workflows/', {
     method: 'POST',
     body: JSON.stringify(workflowData),
   });
 },
 
 /**
  * Eliminar un workflow
  * @param {string|number} workflowId - ID del workflow
  * @returns {Promise<null>}
  */
 deleteWorkflow: async (workflowId) => {
   return await apiCall(`/workflows/${workflowId}/`, {
     method: 'DELETE',
   });
 },

  /**
   * Actualizar un workflow completo (nodos + edges)
   * @param {string|number} workflowId - ID del workflow
   * @param {Array} nodes - Nodos del workflow
   * @param {Array} edges - Edges del workflow
   * @returns {Promise<Object>} Workflow actualizado
   */
  saveWorkflow: async (workflowId, nodes, edges) => {
    return await apiCall(`/workflows/${workflowId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ nodes, edges }),
    });
  },


  // ============================================
  // NODES (Nodos)
  // ============================================

  /**
   * Obtener todos los nodos de un workflow
   * @param {string|number} workflowId - ID del workflow
   * @returns {Promise<Array>} Lista de nodos
   */
  fetchNodes: async (workflowId) => {
    return await apiCall(`/workflows/${workflowId}/nodes/`);
  },

  /**
   * Obtener un nodo específico
   * @param {string|number} workflowId - ID del workflow
   * @param {string|number} nodeId - ID del nodo
   * @returns {Promise<Object>} Datos del nodo
   */
  fetchNode: async (workflowId, nodeId) => {
    return await apiCall(`/workflows/${workflowId}/nodes/${nodeId}/`);
  },

  /**
   * Crear un nuevo nodo
   * @param {string|number} workflowId - ID del workflow
   * @param {Object} nodeData - Datos del nodo
   * @returns {Promise<Object>} Nodo creado
   */
  createNode: async (workflowId, nodeData) => {
    return await apiCall(`/workflows/${workflowId}/nodes/`, {
      method: 'POST',
      body: JSON.stringify(nodeData),
    });
  },

  /**
   * Actualizar un nodo existente
   * @param {string|number} workflowId - ID del workflow
   * @param {string|number} nodeId - ID del nodo
   * @param {Object} nodeData - Datos actualizados
   * @returns {Promise<Object>} Nodo actualizado
   */
  updateNode: async (workflowId, nodeId, nodeData) => {
    return await apiCall(`/workflows/${workflowId}/nodes/${nodeId}/`, {
      method: 'PATCH',
      body: JSON.stringify(nodeData),
    });
  },

  /**
   * Actualizar posición de un nodo (para drag & drop)
   * @param {string|number} workflowId - ID del workflow
   * @param {string|number} nodeId - ID del nodo
   * @param {Object} position - {x, y}
   * @returns {Promise<Object>} Nodo actualizado
   */
  updateNodePosition: async (workflowId, nodeId, position) => {
    return await apiCall(`/workflows/${workflowId}/nodes/${nodeId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ position }),
    });
  },

  /**
   * Eliminar un nodo
   * @param {string|number} workflowId - ID del workflow
   * @param {string|number} nodeId - ID del nodo
   * @returns {Promise<null>}
   */
  deleteNode: async (workflowId, nodeId) => {
    return await apiCall(`/workflows/${workflowId}/nodes/${nodeId}/`, {
      method: 'DELETE',
    });
  },

  // ============================================
  // EDGES (Conexiones/Aristas)
  // ============================================

  /**
   * Obtener todos los edges de un workflow
   * @param {string|number} workflowId - ID del workflow
   * @returns {Promise<Array>} Lista de edges
   */
  fetchEdges: async (workflowId) => {
    return await apiCall(`/workflows/${workflowId}/edges/`);
  },

  /**
   * Obtener un edge específico
   * @param {string|number} workflowId - ID del workflow
   * @param {string|number} edgeId - ID del edge
   * @returns {Promise<Object>} Datos del edge
   */
  fetchEdge: async (workflowId, edgeId) => {
    return await apiCall(`/workflows/${workflowId}/edges/${edgeId}/`);
  },

  /**
   * Crear un nuevo edge
   * @param {string|number} workflowId - ID del workflow
   * @param {Object} edgeData - Datos del edge
   * @returns {Promise<Object>} Edge creado
   */
  createEdge: async (workflowId, edgeData) => {
    return await apiCall(`/workflows/${workflowId}/edges/`, {
      method: 'POST',
      body: JSON.stringify(edgeData),
    });
  },

  /**
   * Actualizar un edge existente
   * @param {string|number} workflowId - ID del workflow
   * @param {string|number} edgeId - ID del edge
   * @param {Object} edgeData - Datos actualizados
   * @returns {Promise<Object>} Edge actualizado
   */
  updateEdge: async (workflowId, edgeId, edgeData) => {
    return await apiCall(`/workflows/${workflowId}/edges/${edgeId}/`, {
      method: 'PATCH',
      body: JSON.stringify(edgeData),
    });
  },

  /**
   * Eliminar un edge
   * @param {string|number} workflowId - ID del workflow
   * @param {string|number} edgeId - ID del edge
   * @returns {Promise<null>}
   */
  deleteEdge: async (workflowId, edgeId) => {
    return await apiCall(`/workflows/${workflowId}/edges/${edgeId}/`, {
      method: 'DELETE',
    });
  },

  // ============================================
  // BATCH OPERATIONS (Operaciones por lote)
  // ============================================

  /**
   * Actualizar múltiples nodos a la vez
   * @param {string|number} workflowId - ID del workflow
   * @param {Array} nodesData - Array de {id, ...data}
   * @returns {Promise<Array>} Nodos actualizados
   */
  batchUpdateNodes: async (workflowId, nodesData) => {
    return await apiCall(`/workflows/${workflowId}/nodes/batch/`, {
      method: 'PATCH',
      body: JSON.stringify({ nodes: nodesData }),
    });
  },

  /**
   * Eliminar múltiples nodos a la vez
   * @param {string|number} workflowId - ID del workflow
   * @param {Array} nodeIds - Array de IDs de nodos
   * @returns {Promise<null>}
   */
  batchDeleteNodes: async (workflowId, nodeIds) => {
    return await apiCall(`/workflows/${workflowId}/nodes/batch/`, {
      method: 'DELETE',
      body: JSON.stringify({ node_ids: nodeIds }),
    });
  },
};

/**
 * Helper para transformar nodos del backend al formato ReactFlow
 * @param {Object} backendNode - Nodo desde Django
 * @returns {Object} Nodo formato ReactFlow
 */
export const transformNodeFromBackend = (backendNode) => ({
  id: backendNode.id.toString(),
  type: backendNode.node_type === 'custom' ? 'custom' : undefined,
  position: backendNode.position || { x: 100, y: 100 },
  data: {
    name: backendNode.data?.name || backendNode.name || 'Sin nombre',
    time: backendNode.data?.time || '',
    inCharge: backendNode.data?.inCharge || '',
    ip: backendNode.data?.ip || '',
    progress: backendNode.data?.progress !== undefined ? backendNode.data.progress : 0,
  },
});

/**
 * Helper para transformar edges del backend al formato ReactFlow
 * @param {Object} backendEdge - Edge desde Django
 * @returns {Object} Edge formato ReactFlow
 */
export const transformEdgeFromBackend = (backendEdge) => ({
  id: backendEdge.id.toString(),
  source: (backendEdge.source?.id || backendEdge.source).toString(),
  target: (backendEdge.target?.id || backendEdge.target).toString(),
  label: backendEdge.label || '',
  type: backendEdge.data?.edge_type || 'default',
  animated: backendEdge.data?.animated || false,
  style: backendEdge.data?.style || {},
});

/**
 * Helper para transformar nodo de ReactFlow al formato backend
 * @param {Object} reactFlowNode - Nodo desde ReactFlow
 * @param {number} workflowId - ID del workflow
 * @returns {Object} Nodo formato Django
 */
export const transformNodeToBackend = (reactFlowNode, workflowId) => ({
  workflow: parseInt(workflowId),
  node_type: reactFlowNode.type || 'default',
  name: reactFlowNode.data.name || reactFlowNode.data.label || 'Sin nombre',
  position: reactFlowNode.position,
  data: {
    name: reactFlowNode.data.name,
    time: reactFlowNode.data.time,
    inCharge: reactFlowNode.data.inCharge,
    ip: reactFlowNode.data.ip,
    progress: reactFlowNode.data.progress !== undefined ? reactFlowNode.data.progress : 0,
  },
});

/**
 * Helper para transformar edge de ReactFlow al formato backend
 * @param {Object} reactFlowEdge - Edge desde ReactFlow
 * @param {number} workflowId - ID del workflow
 * @returns {Object} Edge formato Django
 */
export const transformEdgeToBackend = (reactFlowEdge, workflowId) => ({
  workflow: parseInt(workflowId),
  source_node: parseInt(reactFlowEdge.source),
  target_node: parseInt(reactFlowEdge.target),
  edge_type: reactFlowEdge.type || 'default',
  label: reactFlowEdge.label || '',
  animated: reactFlowEdge.animated || false,
  style: reactFlowEdge.style || {},
});