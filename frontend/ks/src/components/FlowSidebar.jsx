// Este componente es el sidebar para crear nodos y mostrar controles básicos.
import React, { useState, useMemo } from 'react';
import '../fcStyles/FlowSidebar.css';


// Sidebar para crear nodos y otros controles laterales del flujo
export default function FlowSidebar({ onAddNode, onResetFlow, children, nodes = [] }) {
  // Estados locales para los inputs del formulario (nombre, tiempo, responsable)
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [inCharge, setInCharge] = useState('');
  const [nodeType, setNodeType] = useState('custom'); // 'custom' | 'normal'
  const [isProgressExpanded, setIsProgressExpanded] = useState(true); // Estado para el acordeón

  // Calcular el progreso total del proyecto
  const projectProgress = useMemo(() => {
    // Filtrar solo los nodos tipo 1 (custom)
    const customNodes = nodes.filter(node => node.type === 'custom');
    
    if (customNodes.length === 0) {
      return { average: 0, total: 0, count: 0 };
    }
    
    // Sumar todos los porcentajes de progreso
    const totalProgress = customNodes.reduce((sum, node) => {
      const progress = node.data?.progress !== undefined ? Number(node.data.progress) : 0;
      return sum + Math.max(0, Math.min(100, progress));
    }, 0);
    
    const average = Math.round(totalProgress / customNodes.length);
    
    return {
      average,
      total: totalProgress,
      count: customNodes.length
    };
  }, [nodes]);

  // Handler para el formulario de agregar nodo
  const handleAddNode = (e) => {
    e.preventDefault(); // Prevenir refresco del formulario por el submit
    if (!name.trim()) return; // No crear si nombre vacío
    if (onAddNode) {
      // Invoca el callback recibido con los datos del nuevo nodo
      onAddNode({
        name: name.trim(),
        time: time.trim(),
        inCharge: inCharge.trim(),
        type: nodeType,
      });
    }
    // Limpia los inputs después de agregar
    setName('');
    setTime('');
    setInCharge('');
    setNodeType('custom');
  };

  return (
    <aside className="flow-sidebar">
      {/* Sección desplegable de progreso del proyecto */}
      <div className="fs-progress-section">
        <button 
          className="fs-progress-header"
          onClick={() => setIsProgressExpanded(!isProgressExpanded)}
          type="button"
        >
          <span className="fs-progress-title">Progreso del Proyecto</span>
          <span className="fs-progress-arrow">{isProgressExpanded ? '▼' : '▶'}</span>
        </button>
        {isProgressExpanded && (
          <div className="fs-progress-content">
            <div className="fs-progress-info">
              <div className="fs-progress-stats">
                <span className="fs-progress-label">Nodos tipo 1:</span>
                <span className="fs-progress-value">{projectProgress.count}</span>
              </div>
              <div className="fs-progress-stats">
                <span className="fs-progress-label">Progreso promedio:</span>
                <span className="fs-progress-value">{projectProgress.average}%</span>
              </div>
            </div>
            <div className="fs-progress-bar-container">
              <div className="fs-progress-bar-bg">
                <div 
                  className="fs-progress-bar-fill"
                  style={{ width: `${projectProgress.average}%` }}
                ></div>
              </div>
            </div>
            <div className="fs-progress-percentage">
              {projectProgress.average}%
            </div>
          </div>
        )}
      </div>

      <h3>Crear nuevo nodo</h3>
      {/* Formulario para crear nodos */}
      <form onSubmit={handleAddNode} className="fs-form">
        <div>
          <label>
            Nombre<br />
            <input
              type="text"
              value={name}
              required
              onChange={e => setName(e.target.value)}
              placeholder="Nombre del nodo"
              className="fs-input"
            />
          </label>
        </div>
        <div>
          <label>
            Tipo de nodo<br />
            <select
              className="fs-input"
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value)}
            >
              <option value="custom">Personalizado (Tipo 1)</option>
              <option value="normal">Normal (Tipo 2)</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Tiempo<br />
            <input
              type="text"
              value={time}
              onChange={e => setTime(e.target.value)}
              placeholder="Duración/tiempo (opcional)"
              className="fs-input"
            />
          </label>
        </div>
        <div>
          <label>
            Responsable<br />
            <input
              type="text"
              value={inCharge}
              onChange={e => setInCharge(e.target.value)}
              placeholder="Responsable (opcional)"
              className="fs-input"
            />
          </label>
        </div>
        {/* Botón para agregar nodo */}
        <button type="submit" className="fs-button">
          Agregar nodo
        </button>
      </form>

      {/* Botón para resetear el flujo (si se proporciona onResetFlow) */}
      {onResetFlow && (
        <button
          type="button"
          onClick={onResetFlow}
          className="fs-reset-button"
        >
          Resetear flujo
        </button>
      )}

      {/* Aquí puedes agregar más controles o children (por ejemplo, plantillas, importar/exportar, etc) */}
      {children}
    </aside>
  );
}
