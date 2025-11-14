// Este componente es el sidebar para crear nodos y mostrar controles básicos.
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import '../fcStyles/FlowSidebar.css';


// Sidebar para crear nodos y otros controles laterales del flujo
export default function FlowSidebar({ onAddNode, onResetFlow, children, nodes = [], commentNode = null, onAddComment, onCloseComments }) {
  // Estados locales para los inputs del formulario (nombre, tiempo, responsable, descripción)
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [inCharge, setInCharge] = useState('');
  const [description, setDescription] = useState('');
  const [nodeType, setNodeType] = useState('custom'); // 'custom' | 'normal'
  const [isProgressExpanded, setIsProgressExpanded] = useState(true); // Estado para el acordeón
  const [newComment, setNewComment] = useState('');
  
  // Estado para el ancho del sidebar (con valor por defecto y carga desde localStorage)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('flowSidebarWidth');
    return saved ? parseInt(saved, 10) : 260;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(260);

  const comments = useMemo(
    () => (Array.isArray(commentNode?.data?.comments) ? commentNode.data.comments : []),
    [commentNode]
  );

  useEffect(() => {
    setNewComment('');
  }, [commentNode?.id]);

  // Establecer el ancho inicial en el DOM al montar (el style inline ya lo hace, pero esto asegura sincronización)
  useEffect(() => {
    if (sidebarRef.current && !isResizing) {
      sidebarRef.current.style.width = `${sidebarWidth}px`;
    }
  }, [sidebarWidth, isResizing]);

  // Guardar el ancho del sidebar en localStorage cuando cambie (solo cuando no está redimensionando)
  useEffect(() => {
    if (!isResizing && sidebarWidth) {
      localStorage.setItem('flowSidebarWidth', sidebarWidth.toString());
    }
  }, [sidebarWidth, isResizing]);

  // Handlers para redimensionar el sidebar
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sidebarRef.current) return;
    
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    setIsResizing(true);
  }, [sidebarWidth]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !sidebarRef.current) return;
    
    const deltaX = e.clientX - startXRef.current;
    const newWidth = startWidthRef.current + deltaX;
    // Limitar el ancho entre 260px (tamaño original) y 600px
    const clampedWidth = Math.max(260, Math.min(600, newWidth));
    
    // Actualizar directamente en el DOM para evitar re-renders durante el arrastre
    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${clampedWidth}px`;
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    if (!sidebarRef.current) return;
    
    // Obtener el ancho final del DOM
    const finalWidth = sidebarRef.current.offsetWidth;
    setIsResizing(false);
    
    // Actualizar el estado con el ancho final (esto causará un re-render pero solo una vez)
    setSidebarWidth(finalWidth);
    localStorage.setItem('flowSidebarWidth', finalWidth.toString());
  }, []);

  useEffect(() => {
    if (isResizing) {
      const handleMove = (e) => {
        e.preventDefault();
        handleMouseMove(e);
      };
      
      const handleUp = () => {
        handleMouseUp();
      };
      
      document.addEventListener('mousemove', handleMove, { passive: false });
      document.addEventListener('mouseup', handleUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
      
      // Restaurar pointer events en el handle
      if (sidebarRef.current) {
        const handle = sidebarRef.current.querySelector('.fs-resize-handle');
        if (handle) {
          handle.style.pointerEvents = 'auto';
        }
      }
      
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.style.pointerEvents = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

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
    if (!description.trim()) return; // No crear si descripción vacía
    if (onAddNode) {
      // Invoca el callback recibido con los datos del nuevo nodo
      onAddNode({
        name: name.trim(),
        time: time.trim(),
        inCharge: inCharge.trim(),
        description: description.trim(),
        type: nodeType,
      });
    }
    // Limpia los inputs después de agregar
    setName('');
    setTime('');
    setInCharge('');
    setDescription('');
    setNodeType('custom');
  };

  return (
    <aside 
      ref={sidebarRef}
      className="flow-sidebar"
      style={{ width: `${sidebarWidth}px`, minWidth: '260px', maxWidth: '600px' }}
    >
      {/* Handle de redimensionamiento */}
      <div 
        className="fs-resize-handle"
        onMouseDown={handleMouseDown}
        style={{ cursor: 'col-resize' }}
      />
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
        <div>
          <label>
            Descripción del trabajo<br />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe el trabajo que se va a realizar..."
              className="fs-input"
              rows={4}
              required
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

      {commentNode && (
        <div className="fs-comments-section">
          <div className="fs-comments-header">
            <h4 className="fs-comments-title">Comentarios — {commentNode.data?.name || commentNode.id}</h4>
            <button
              type="button"
              className="fs-comments-close"
              onClick={() => {
                if (onCloseComments) onCloseComments();
              }}
            >
              ×
            </button>
          </div>

          {/* Mostrar descripción del trabajo */}
          {commentNode.data?.description && (
            <div className="fs-description-section">
              <h5 className="fs-description-title">Descripción del trabajo</h5>
              <div className="fs-description-text">{commentNode.data.description}</div>
            </div>
          )}

          <div className="fs-comments-list">
            {comments.length === 0 ? (
              <p className="fs-comments-empty">No hay comentarios aún.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="fs-comment-item">
                  <div className="fs-comment-text">{comment.text}</div>
                  {comment.createdAt && (
                    <div className="fs-comment-meta">
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <form
            className="fs-comments-form"
            onSubmit={(e) => {
              e.preventDefault();
              const text = newComment.trim();
              if (!text || !commentNode) return;
              if (onAddComment) {
                onAddComment(commentNode.id, text);
                setNewComment('');
              }
            }}
          >
            <textarea
              className="fs-comments-textarea"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              rows={3}
            />
            <button type="submit" className="fs-comments-submit" disabled={!newComment.trim()}>
              Agregar comentario
            </button>
          </form>
        </div>
      )}

      {/* Aquí puedes agregar más controles o children (por ejemplo, plantillas, importar/exportar, etc) */}
      {children}
    </aside>
  );
}
