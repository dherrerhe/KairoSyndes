/**
 * FlowToolbar.jsx
 * Barra superior: acciones para zoom, guardar, exportar, etc.
 * Los handlers se pasan por props, para mantener la lógica desacoplada.
 */

import React from 'react';

export default function FlowToolbar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onSave,
  onExport,
  extraActions,
  children,
  style
}) {
  return (
    <div className="flow-toolbar" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, ...(style || {}) }}>
      <button 
        className="toolbar-btn" 
        title="Zoom in"
        onClick={onZoomIn}
        type="button"
      >
        (icon lupa)+
      </button>
      <button 
        className="toolbar-btn" 
        title="Zoom out"
        onClick={onZoomOut}
        type="button"
      >
        (icon lupa)-
      </button>
      <button 
        className="toolbar-btn" 
        title="Ajustar vista"
        onClick={onFitView}
        type="button"
      >
        (icon) Ajustar
      </button>

      <span style={{ marginLeft: 12, marginRight: 4, fontSize: 20 }}>|</span>

      <button 
        className="toolbar-btn"
        title="Guardar workflow"
        onClick={onSave}
        type="button"
      >
        (icon) Guardar
      </button>
      {onExport && (
        <button 
          className="toolbar-btn"
          title="Exportar workflow"
          onClick={onExport}
          type="button"
        >
          (icon) Exportar
        </button>
      )}

      {/* Espacio para acciones extra */}
      {extraActions && (typeof extraActions === 'function' ? extraActions() : extraActions)}
      {children}
    </div>
  );
}

