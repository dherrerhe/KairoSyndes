// Este componente es el sidebar para crear nodos y mostrar controles básicos.
import React, { useState } from 'react';
import '../fcStyles/FlowSidebar.css';


// Sidebar para crear nodos y otros controles laterales del flujo
export default function FlowSidebar({ onAddNode, onResetFlow, children }) {
  // Estados locales para los inputs del formulario (nombre, tiempo, responsable)
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [inCharge, setInCharge] = useState('');

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
      });
    }
    // Limpia los inputs después de agregar
    setName('');
    setTime('');
    setInCharge('');
  };

  return (
    <aside className="flow-sidebar">
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
