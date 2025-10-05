// src/components/CustomNode.jsx
import React from 'react';
import { Handle } from 'reactflow';

export default function CustomNode({ id, data }) {
  // data = { label, onChangeLabel }
  const { label = '', onChangeLabel } = data || {};

  return (
    <div style={{
      padding: 10,
      borderRadius: 8,
      border: '1px solid #bbb',
      background: 'white',
      minWidth: 160,
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Top handle (input) */}
      <Handle type="target" position="top" style={{ background: '#555' }} />

      <div style={{ fontSize: 14, marginBottom: 6, fontWeight: 600 }}>
        Nodo personalizado
      </div>

      <input
        value={label}
        onChange={(e) => onChangeLabel?.(id, e.target.value)}
        style={{
          width: '100%',
          padding: '6px 8px',
          borderRadius: 4,
          border: '1px solid #ddd',
          marginBottom: 8,
          boxSizing: 'border-box'
        }}
      />

      <button
        onClick={() => alert(`Label actual: "${label}"`)}
        style={{
          width: '100%',
          padding: '6px 8px',
          borderRadius: 4,
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Mostrar label
      </button>

      {/* Bottom handle (output) */}
      <Handle type="source" position="bottom" id="a" style={{ background: '#555' }} />
    </div>
  );
}
