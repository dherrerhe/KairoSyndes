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

// Importación de estilos
import '../fcStyles/CustomNode.css';

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
// Función para calcular la luminosidad de un color y determinar si usar texto claro u oscuro
function getContrastColor(hexColor) {
  // Convertir hex a RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calcular luminosidad relativa (fórmula WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Si la luminosidad es menor a 0.5, usar texto blanco, sino negro
  return luminance < 0.5 ? '#ffffff' : '#000000';
}

// Función para oscurecer un color (para el borde)
function darkenColor(hexColor, amount = 0.2) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const newR = Math.max(0, Math.floor(r * (1 - amount)));
  const newG = Math.max(0, Math.floor(g * (1 - amount)));
  const newB = Math.max(0, Math.floor(b * (1 - amount)));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

export default function CustomNode({ id, data }) {
  // Extraer propiedades del objeto data con valores por defecto
  const { name = '', time = '', inCharge = '', ip = '', progress = 0, color = '#4CAF50', onShowComments } = data || {};
  
  // Asegurar que progress esté entre 0 y 100
  const progressValue = Math.max(0, Math.min(100, Number(progress) || 0));
  
  // Calcular el offset del círculo SVG (circunferencia = 2 * π * r)
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressValue / 100) * circumference;

  // Calcular colores para contraste
  const textColor = getContrastColor(color);
  const borderColor = darkenColor(color, 0.3);

  // Estilos dinámicos basados en el color
  const nodeStyle = {
    backgroundColor: color,
    borderColor: borderColor,
  };

  const handleStyle = {
    background: borderColor,
  };

  const textStyle = {
    color: textColor,
  };

  const progressTextStyle = {
    color: textColor,
  };

  const valueStyle = {
    color: textColor,
  };

  return (
    <div className="custom-node" style={nodeStyle}>
      <button
        type="button"
        className="custom-node-comment-btn"
        title="Ver comentarios"
        onClick={(event) => {
          event.stopPropagation();
          if (onShowComments) {
            onShowComments(id);
          }
        }}
      >
        💬
      </button>
      {/* Handle superior (entrada) */}
      <Handle type="target" position="top" className="custom-node-handle" style={handleStyle} />

      {/* Nombre del nodo */}
      <div className="custom-node-name" style={textStyle}>
        {name || 'Sin nombre'}
      </div>

      {/* Barra de progreso circular */}
      <div className="custom-node-progress-container">
        <svg className="custom-node-progress-svg" width="50" height="50">
          {/* Círculo de fondo */}
          <circle
            className="custom-node-progress-bg"
            cx="25"
            cy="25"
            r={radius}
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="4"
          />
          {/* Círculo de progreso */}
          <circle
            className="custom-node-progress-bar"
            cx="25"
            cy="25"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 25 25)"
          />
        </svg>
        <div className="custom-node-progress-text" style={progressTextStyle}>{Math.round(progressValue)}%</div>
      </div>

      {/* Información del nodo */}
      <div className="custom-node-info">
        {time && (
          <div className="custom-node-field">
            <span className="custom-node-label" style={textStyle}>Tiempo:</span>
            <span className="custom-node-value" style={valueStyle}>{time}</span>
          </div>
        )}
        {inCharge && (
          <div className="custom-node-field">
            <span className="custom-node-label" style={textStyle}>Responsable:</span>
            <span className="custom-node-value" style={valueStyle}>{inCharge}</span>
          </div>
        )}
        {ip && (
          <div className="custom-node-field">
            <span className="custom-node-label" style={textStyle}>IP:</span>
            <span className="custom-node-value" style={valueStyle}>{ip}</span>
          </div>
        )}
      </div>

      {/* Handle inferior (salida) */}
      <Handle type="source" position="bottom" id="a" className="custom-node-handle" style={handleStyle} />
    </div>
  );
}
