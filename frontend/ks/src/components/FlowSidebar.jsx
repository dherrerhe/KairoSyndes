// Este componente es el sidebar para crear nodos y mostrar controles básicos.
import React, { useState } from 'react';


// Sidebar para crear nodos y otros controles laterales del flujo
export default function FlowSidebar({ onAddNode, onResetFlow, children }) {
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [inCharge, setInCharge] = useState('');

  const handleAddNode = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (onAddNode) {
      onAddNode({
        name: name.trim(),
        time: time.trim(),
        inCharge: inCharge.trim(),
      });
    }
    setName('');
    setTime('');
    setInCharge('');
  };

  return (
    <aside className="flow-sidebar" style={{padding: 16, borderRight: '1px solid #ccc', width: 260, background: '#fafbfc'}}>
      <h3>Crear nuevo nodo</h3>
      <form onSubmit={handleAddNode} style={{marginBottom: 16}}>
        <div>
          <label>Nombre<br />
            <input
              type="text"
              value={name}
              required
              onChange={e => setName(e.target.value)}
              placeholder="Nombre del nodo"
              style={{width: '100%'}}
            />
          </label>
        </div>
        <div>
          <label>Tiempo<br />
            <input
              type="text"
              value={time}
              onChange={e => setTime(e.target.value)}
              placeholder="Duración/tiempo (opcional)"
              style={{width: '100%'}}
            />
          </label>
        </div>
        <div>
          <label>Responsable<br />
            <input
              type="text"
              value={inCharge}
              onChange={e => setInCharge(e.target.value)}
              placeholder="Responsable (opcional)"
              style={{width: '100%'}}
            />
          </label>
        </div>
        <button type="submit" style={{marginTop: 10}}>Agregar nodo</button>
      </form>

      {onResetFlow && (
        <button type="button" onClick={onResetFlow} style={{marginBottom: 16, background:'#e8e8e8', border:0, padding:8}}>Resetear flujo</button>
      )}

      {/* Aquí puedes agregar más controles o children (por ejemplo, plantillas, importar/exportar, etc) */}
      {children}
    </aside>
  );
}


// === Cambios necesarios en FlowComponent.jsx ====
//
// 1. Importa el FlowSidebar:
//    import FlowSidebar from './FlowSidebar';
//
// 2. Mueve del estado y handlers de creación de nodos a este Sidebar:
//    Quita los formularios/inputs de nodo NUEVO que estaban en FlowComponent
//    y usa en su lugar un callback como:
//
//    const handleAddNode = ({name, time, inCharge}) => {
//      setNodes(ns => [
//        ...ns,
//        {
//          id: getId(),
//          type: 'custom',
//          position: { x: 120 + Math.random()*200, y: 120 + Math.random()*80 },
//          data: { name, time, inCharge }
//        }
//      ]);
//    };
//
// 3. Usa el sidebar en tu layout así:
//   <div style={{display: 'flex'}}>
//     <FlowSidebar onAddNode={handleAddNode} onResetFlow={...} />
//     <div ref={reactFlowWrapper} style={{ flex: 1, height: ... }}>
//       <ReactFlow ...
//   </div>
//
// 4. Elimina de FlowComponent cualquier <form> para crear nodos y su estado relacionado, pues ahora lo lleva el Sidebar.
//
// Puedes pasarle también otros handlers al Sidebar según lo requieras (reset, importar, etc).
