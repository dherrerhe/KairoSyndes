// src/components/Navbar.js
import { FaHome } from "react-icons/fa";
import { TbTools } from "react-icons/tb";
import { FaTimes } from "react-icons/fa";
import { FaSignOutAlt } from "react-icons/fa"; // Nuevo icono
import { Link, useNavigate } from "react-router-dom";
import useAuth from '../hooks/useAuth';

const Navbar = ({ show, onClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Llama al logout para limpiar estado de autenticación y localStorage
    await logout();
    // Forza reload para limpiar cualquier caché o estado residual, permitiendo nuevo login fresco
    navigate('/login', { replace: true });
  };

  return (
    <>
      <div 
        className={show ? 'sidenav-overlay active' : 'sidenav-overlay'}
        onClick={onClose}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        aria-label="Cerrar menú de navegación"
      ></div>
      
      <div className={show ? 'sidenav active' : 'sidenav'}>
        <div className="sidenav-header">
          <div>
            <h2 className="sidenav-title">KairoSyndes</h2>
            {user && <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{user.email}</p>}
          </div>
          <button 
            className="close-btn" 
            onClick={onClose}
            aria-label="Cerrar menú de navegación"
            title="Cerrar menú"
          >
            <FaTimes />
          </button>
        </div>
        
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
          <li style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '8px' }}>
            <button 
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#f44336'
              }}
            >
              <FaSignOutAlt />
              Cerrar Sesión
            </button>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Navbar;