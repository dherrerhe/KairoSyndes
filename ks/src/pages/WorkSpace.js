/**
 * @fileoverview Página de Workspace con React Flow para KairoSyndes
 * @description Página que contiene el componente principal de React Flow
 * para la visualización y edición de diagramas de flujo interactivos.
 * @author KairoSyndes
 * @version 1.0.0
 * @since 2024
 */

// Importación de React
import React from 'react';

// Importación de estilos de React Flow
import 'reactflow/dist/style.css';

// Importación del componente principal de React Flow
import FlowComponent from '../components/FlowComponent';

/**
 * Componente de página Workspace.
 * 
 * Este componente representa la página de workspace de la aplicación KairoSyndes,
 * donde los usuarios pueden interactuar con diagramas de flujo utilizando React Flow.
 * Incluye nodos personalizados que permiten editar texto y crear conexiones
 * entre diferentes elementos del diagrama.
 * 
 * @component
 * @returns {JSX.Element} Elemento JSX de la página de workspace
 * 
 * @example
 * // Uso del componente WorkSpace
 * <WorkSpace />
 */
export const WorkSpace = () => {
  return (
    <div>
      {/* Título principal de la página */}
      <h1>React Flow — Nodos personalizados</h1>
      
      {/* Descripción de la funcionalidad */}
      <p>Ejemplo: edita el texto dentro del nodo y conéctalos.</p>
      
      {/* Componente principal de React Flow */}
      <FlowComponent />
    </div>
  );
};
