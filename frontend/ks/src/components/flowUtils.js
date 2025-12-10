// Utils para FlowComponent (no dependen de React)


let idCounter = 100;
export function getId() {
  // Devuelve un id string con prefijo para evitar choques con ids de backend numéricos
  return `temp-${idCounter++}`;
}

// Quita props no serializables/callbacks de data de un nodo
export function limpiarDatosNodoParaSerializar(n) {
  // Solo deja los campos serializables (no funciones/referencias)
  if (!n || typeof n !== "object") return n;
  let safeData = {};
  if (n.data && typeof n.data === "object") {
    // Quita campos que sean funciones/callbacks
    for (const [k, v] of Object.entries(n.data)) {
      if (typeof v !== "function") safeData[k] = v;
    }
  }
  return { ...n, data: safeData };
}

// Guarda el workflow actual (nodos y aristas sanitizados) en localStorage
export function saveWorkflowToLocalStorage(workflowId, nodes, edges) {
  if (!workflowId) throw new Error("workflowId requerido para guardar");
  const nodesForSave = (nodes || []).map(limpiarDatosNodoParaSerializar);
  const edgesForSave = (edges || []).map((e) => {
    const { id, source, target, label, type, animated, style } = e;
    return { id, source, target, label, type, animated, style };
  });
  const payload = {
    nodes: nodesForSave,
    edges: edgesForSave,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(`workflow_data_${workflowId}`, JSON.stringify(payload));
}

// Carga workflow guardado desde localStorage, retorna {nodes, edges, savedAt} o null
export function loadWorkflowFromLocalStorage(workflowId) {
  if (!workflowId) return null;
  try {
    const raw = localStorage.getItem(`workflow_data_${workflowId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    // Puede registrar en consola si se desea
    return null;
  }
}

