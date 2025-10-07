/**
 * @fileoverview Componente de nodo personalizado para ReactFlow
 * @description Nodo personalizado que permite editar texto en tiempo real
 * y crear conexiones en diagramas de flujo interactivos.
 * @author KairoSyndes
 * @version 1.0.0
 * @since 2024
 */

// Importación de React
import React from 'react';

// Importación de Handle de ReactFlow para puntos de conexión
import { Handle } from 'reactflow';

/**
 * Componente de nodo personalizado para ReactFlow.
 * 
 * Este componente crea un nodo interactivo que permite:
 * - Editar el texto del label en tiempo real
 * - Mostrar el contenido actual del nodo
 * - Crear conexiones con otros nodos mediante handles
 * - Personalizar la apariencia visual del nodo
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {string} props.id - Identificador único del nodo en ReactFlow
 * @param {Object} props.data - Datos del nodo
 * @param {string} props.data.label - Texto del label del nodo
 * @param {Function} props.data.onChangeLabel - Función para actualizar el label
 * @returns {JSX.Element} Elemento JSX del nodo personalizado
 * 
 * @example
 * // Uso del componente CustomNode
 * <CustomNode id="node1" data={{ label: "Mi nodo", onChangeLabel: handleChange }} />
 */
export default function CustomNode({ id, data }) {
  // Extraer propiedades del objeto data con valores por defecto
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
      {/* Handle superior (entrada) */}
      <Handle type="target" position="top" style={{ background: '#555' }} />

      {/* Título del nodo */}
      <div style={{ fontSize: 14, marginBottom: 6, fontWeight: 600 }}>
        Nodo personalizado
      </div>

      {/* Campo de entrada para editar el label */}
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

      {/* Botón para mostrar el label actual */}
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

      {/* Handle inferior (salida) */}
      <Handle type="source" position="bottom" id="a" style={{ background: '#555' }} />
    </div>
  );
}
