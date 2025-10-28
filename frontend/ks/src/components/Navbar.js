/**
 * @fileoverview Componente de navegación lateral (Sidebar) para KairoSyndes
 * @description Sidebar deslizable con overlay que contiene la navegación principal
 * de la aplicación, incluyendo enlaces a diferentes páginas y funcionalidad de cierre.
 * @author KairoSyndes
 * @version 1.0.0
 * @since 2024
 */

// Importaciones de iconos de React Icons
import { FaHome } from "react-icons/fa";      // Icono de casa para Home
import { TbTools } from "react-icons/tb";     // Icono de herramientas para Workspace
import { FaTimes } from "react-icons/fa";     // Icono de X para cerrar

// Importación de React Router para navegación
import { Link } from "react-router-dom";

/**
 * Componente de navegación lateral (Sidebar).
 * 
 * Este componente renderiza un sidebar deslizable que contiene:
 * - Un overlay semi-transparente para cerrar el sidebar
 * - Un header con el título "KairoSyndes" y botón de cierre
 * - Enlaces de navegación a las diferentes páginas de la aplicación
 * 
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.show - Estado de visibilidad del sidebar
 * @param {Function} props.onClose - Función para cerrar el sidebar
 * @returns {JSX.Element} Elemento JSX del sidebar de navegación
 * 
 * @example
 * // Uso del componente Navbar
 * <Navbar show={isOpen} onClose={() => setIsOpen(false)} />
 */
const Navbar = ({ show, onClose }) => {
  return (
    <>
      {/* 
        Overlay semi-transparente que aparece cuando el sidebar está abierto.
        Permite cerrar el sidebar haciendo clic fuera de él.
      */}
      <div 
        className={show ? 'sidenav-overlay active' : 'sidenav-overlay'}
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        aria-label="Cerrar menú de navegación"
      ></div>
      
      {/* 
        Sidebar principal con navegación.
        Se desliza desde la izquierda cuando está activo.
      */}
      <div className={show ? 'sidenav active' : 'sidenav'}>
        {/* 
          Header del sidebar que contiene:
          - Título de la aplicación "KairoSyndes"
          - Botón de cierre (X)
        */}
        <div className="sidenav-header">
          <h2 className="sidenav-title">KairoSyndes</h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            aria-label="Cerrar menú de navegación"
            title="Cerrar menú"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* 
          Lista de navegación con enlaces a las diferentes páginas.
          Cada enlace cierra automáticamente el sidebar al ser clickeado.
        */}
        <ul role="navigation" aria-label="Menú principal">
          <li>
            <Link 
              to="/Home" 
              onClick={onClose}
              aria-label="Ir a la página principal"
            >
              <FaHome />
              Home
            </Link>
          </li>
          <li>
            <Link 
              to="/WorkSpace" 
              onClick={onClose}
              aria-label="Ir al workspace de React Flow"
            >
              <TbTools />
              Workspace
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Navbar;