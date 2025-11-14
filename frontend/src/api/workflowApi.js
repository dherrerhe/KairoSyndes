// Simple wrapper fetch para el backend. Adapta baseUrl a tu configuración si hace falta.
const baseUrl = process.env.REACT_APP_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json().catch(() => ({}));
}

export const workflowApi = {
  fetchNodes: (workflowId) => request(`/workflows/${workflowId}/nodes/`),
  fetchEdges: (workflowId) => request(`/workflows/${workflowId}/edges/`),
  createNode: (workflowId, payload) => request(`/workflows/${workflowId}/nodes/`, { method: 'POST', body: JSON.stringify(payload) }),
  updateNode: (workflowId, nodeId, payload) => request(`/workflows/${workflowId}/nodes/${nodeId}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  createEdge: (workflowId, payload) => request(`/workflows/${workflowId}/edges/`, { method: 'POST', body: JSON.stringify(payload) }),
  updateEdge: (workflowId, edgeId, payload) => request(`/workflows/${workflowId}/edges/${edgeId}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteEdge: (workflowId, edgeId) => request(`/workflows/${workflowId}/edges/${edgeId}/`, { method: 'DELETE' }),
  saveWorkflow: (workflowId, nodes, edges) => request(`/workflows/${workflowId}/save/`, { method: 'POST', body: JSON.stringify({ nodes, edges }) }),
};