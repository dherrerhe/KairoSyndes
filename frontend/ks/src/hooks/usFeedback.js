// src/hooks/useFeedback.js

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook para gestionar mensajes de feedback (success, error, info)
 * @param {number} defaultDuration - Duración en ms antes de que el mensaje desaparezca (default: 3000)
 * @returns {Object} Estado y funciones para feedback
 */
export const useFeedback = (defaultDuration = 3000) => {
  const [feedback, setFeedback] = useState(null);
  const timeoutRef = useRef(null);

  /**
   * Limpiar timeout al desmontar componente
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Mostrar mensaje de feedback
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de mensaje: 'success', 'error', 'info', 'warning'
   * @param {number} duration - Duración en ms (opcional, usa defaultDuration si no se especifica)
   */
  const showFeedback = useCallback((message, type = 'info', duration = null) => {
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Establecer nuevo feedback
    setFeedback({ message, type });

    // Auto-ocultar después de la duración especificada
    const hideDuration = duration ?? defaultDuration;
    if (hideDuration > 0) {
      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
        timeoutRef.current = null;
      }, hideDuration);
    }
  }, [defaultDuration]);

  /**
   * Mostrar mensaje de éxito
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms (opcional)
   */
  const showSuccess = useCallback((message, duration) => {
    showFeedback(message, 'success', duration);
  }, [showFeedback]);

  /**
   * Mostrar mensaje de error
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms (opcional)
   */
  const showError = useCallback((message, duration) => {
    showFeedback(message, 'error', duration);
  }, [showFeedback]);

  /**
   * Mostrar mensaje informativo
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms (opcional)
   */
  const showInfo = useCallback((message, duration) => {
    showFeedback(message, 'info', duration);
  }, [showFeedback]);

  /**
   * Mostrar mensaje de advertencia
   * @param {string} message - Mensaje a mostrar
   * @param {number} duration - Duración en ms (opcional)
   */
  const showWarning = useCallback((message, duration) => {
    showFeedback(message, 'warning', duration);
  }, [showFeedback]);

  /**
   * Ocultar feedback manualmente
   */
  const hideFeedback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setFeedback(null);
  }, []);

  /**
   * Verificar si hay feedback activo
   */
  const hasFeedback = feedback !== null;

  return {
    // Estado
    feedback, // { message: string, type: 'success'|'error'|'info'|'warning' } | null
    hasFeedback,
    
    // Funciones generales
    showFeedback,
    hideFeedback,
    
    // Funciones específicas por tipo
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};

/**
 * Componente de UI para mostrar feedback
 * @param {Object} feedback - { message, type }
 * @param {Function} onClose - Callback al cerrar (opcional)
 */
export const FeedbackDisplay = ({ feedback, onClose }) => {
  if (!feedback) return null;

  const { message, type } = feedback;

  // Colores según el tipo
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    info: '#2196F3',
    warning: '#ff9800',
  };

  const backgroundColor = colors[type] || colors.info;

  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        left: 8,
        zIndex: 9999,
        padding: '12px 16px',
        background: backgroundColor,
        color: 'white',
        borderRadius: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: 400,
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: 18,
            cursor: 'pointer',
            padding: '0 4px',
          }}
        >
          x
        </button>
      )}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};