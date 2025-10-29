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
 */
export default function CustomNode({ id, data }) {
  // Extraer propiedades del objeto data con valores por defecto
  const { name = '', time = '', inCharge = '', ip = '', onChangeLabel } = data || {};

  return (
    <div className="custom-node">
      {/* Handle superior (entrada) */}
      <Handle type="target" position="top" className="custom-node-handle" />

      {/* Nombre del nodo */}
      <div className="custom-node-name">
        {name || 'Sin nombre'}
      </div>

      {/* Información del nodo */}
      <div className="custom-node-info">
        {time && (
          <div className="custom-node-field">
            <span className="custom-node-label">Tiempo:</span>
            <span className="custom-node-value">{time}</span>
          </div>
        )}
        {inCharge && (
          <div className="custom-node-field">
            <span className="custom-node-label">Responsable:</span>
            <span className="custom-node-value">{inCharge}</span>
          </div>
        )}
        {ip && (
          <div className="custom-node-field">
            <span className="custom-node-label">IP:</span>
            <span className="custom-node-value">{ip}</span>
          </div>
        )}
      </div>

      {/* Handle inferior (salida) */}
      <Handle type="source" position="bottom" id="a" className="custom-node-handle" />
    </div>
  );
}
