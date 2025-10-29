/**
 * FlowToolbar.jsx
 * Barra superior: acciones para zoom, guardar, exportar, etc.
 * Los handlers se pasan por props, para mantener la lógica desacoplada.
 */

import React from 'react';
import { FaMagnifyingGlassPlus } from "react-icons/fa6";
import { FaMagnifyingGlassMinus } from "react-icons/fa6";
import { MdOutlineSettingsOverscan } from "react-icons/md";
import { MdOutlineSaveAlt } from "react-icons/md";
import { PiExportBold } from "react-icons/pi";

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
        <FaMagnifyingGlassPlus />       {/*(icon lupa) + */}
      </button>
      <button 
        className="toolbar-btn" 
        title="Zoom out"
        onClick={onZoomOut}
        type="button"
      >
        <FaMagnifyingGlassMinus />      {/*(icon lupa) - */}
      </button>
      <button 
        className="toolbar-btn" 
        title="Ajustar vista"
        onClick={onFitView}
        type="button"
      >
        <MdOutlineSettingsOverscan />       {/*(icon) Ajustar*/}
      </button>

      <span style={{ marginLeft: 12, marginRight: 4, fontSize: 20 }}>|</span>

      <button 
        className="toolbar-btn"
        title="Guardar workflow"
        onClick={onSave}
        type="button"
      >
        <MdOutlineSaveAlt /> Guardar
      </button>
      {onExport && (
        <button 
          className="toolbar-btn"
          title="Exportar workflow"
          onClick={onExport}
          type="button"
        >
          <PiExportBold /> Exportar
        </button>
      )}

      {/* Espacio para acciones extra */}
      {extraActions && (typeof extraActions === 'function' ? extraActions() : extraActions)}
      {children}
    </div>
  );
}

