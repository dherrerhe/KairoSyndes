/**
 * @fileoverview Página principal de la aplicación KairoSyndes
 * @description Componente de página que representa la vista principal
 * de la aplicación, mostrando información de bienvenida.
 * @author KairoSyndes
 * @version 1.0.0
 * @since 2024
 */

// Importación de React
import React from 'react';

/**
 * Componente de página principal (Home).
 * 
 * Este componente representa la página de inicio de la aplicación KairoSyndes.
 * Actualmente muestra un contenido básico que puede ser expandido para incluir
 * información de bienvenida, características de la aplicación, o cualquier
 * contenido relevante para la página principal.
 * 
 * @component
 * @returns {JSX.Element} Elemento JSX de la página principal
 * 
 * @example
 * // Uso del componente Home
 * <Home />
 */
export const Home = () => {
  return (
    <div>
      <h1>Bienvenido a KairoSyndes</h1>
      <p>Página principal de la aplicación</p>
    </div>
  );
};
