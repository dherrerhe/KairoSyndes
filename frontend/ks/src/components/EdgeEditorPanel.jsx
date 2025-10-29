/**
 * EdgeEditorPanel.jsx
 * Panel pequeño para editar la etiqueta de una arista y eliminarla.
 */

import React, { useState, useEffect } from 'react';

export default function EdgeEditorPanel({ edge, onSave, onDelete, onClose }) {
  const [label, setLabel] = useState(edge?.label ?? '');

  useEffect(() => {
    setLabel(edge?.label ?? '');
  }, [edge]);

  if (!edge) return null;

  return (
    <div className="edge-editor">
      <div className="edge-editor-row">
        <label className="edge-editor-label">Etiqueta</label>
        <input
          className="edge-editor-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Etiqueta de la arista"
        />
      </div>

      <div className="edge-editor-meta">
        <small>Desde: {edge.source} → Hasta: {edge.target}</small>
      </div>

      <div className="edge-editor-buttons">
        <button
          className="edge-editor-save"
          onClick={() => {
            onSave(label);
          }}
        >
          Guardar
        </button>

        <button
          className="edge-editor-delete"
          onClick={() => {
            // confirma antes de borrar
            const ok = window.confirm('¿Eliminar esta arista?');
            if (ok) onDelete();
          }}
        >
          Eliminar
        </button>

        <button
          className="edge-editor-close"
          onClick={() => onClose()}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
