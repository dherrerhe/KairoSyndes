/**
 * @fileoverview Componente principal de la aplicación KairoSyndes
 * @description Aplicación React con React Router para navegación entre páginas
 * y React Flow para visualización de diagramas de flujo interactivos.
 * @author KairoSyndes
 * @version 1.0.0
 * @since 2024
 */

// Importaciones de estilos globales
import 'reactflow/dist/style.css';
import './styles/App.css';
// Estilos extraídos de App.css
import './fcStyles/FlowComponent.css';
import './fcStyles/FlowCanvas.css';
import './fcStyles/CustomNode.css';
import './fcStyles/NodeContextMenu.css';
import './fcStyles/Modal.css';
import useAuth, { AuthProvider, PrivateRoute } from './hooks/useAuth';

import { useState } from 'react';

// Importaciones de React Router para navegación
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Importaciones de componentes personalizados
import Navbar from './components/Navbar';

// Importaciones de iconos
import { GiHamburgerMenu } from "react-icons/gi";

// Importaciones de páginas
import { WorkSpace } from './pages/WorkSpace';
import Home from './pages/Home';
import LoginPage from './pages/Login';  // Importa la página de Login

/**
 * Wrapper para la pantalla de login, redirige a Home tras autenticación.
 * Esta lógica puede estar aquí o en LoginPage, pero la redirección tras login debe ocurrir aquí.
 */
function LoginRouteWrapper(props) {
  const { isAuthenticated, setIsAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Callback que recibe LoginPage cuando login es exitoso
  const handleLoginSuccess = (authToken) => {
    localStorage.setItem('authToken', authToken);
    setIsAuthenticated(true);
    navigate('/Home', { replace: true });
  };

  if (isAuthenticated) {
    return <Navigate to="/Home" replace />;
  }

  // Se pasa el callback a LoginPage
  return <LoginPage onLoginSuccess={handleLoginSuccess} {...props} />;
}

/**
 * Componente principal de la aplicación KairoSyndes.
 * 
 * Este componente maneja la estructura principal de la aplicación,
 * incluyendo el header con menú hamburguesa, el sidebar de navegación
 * y el sistema de enrutamiento entre diferentes páginas.
 * 
 * @component
 * @returns {JSX.Element} Elemento JSX del componente principal
 * 
 * @example
 * // Uso del componente App
 * <App />
 */
function App() {
  // Estado para controlar la visibilidad del sidebar de navegación
  const [showNav, setshowNav] = useState(false);

  return (
    <AuthProvider>
      <Router>
        {/* Header principal con menú hamburguesa */}
        <header className='App-header'>
          <GiHamburgerMenu 
            onClick={() => setshowNav(!showNav)}
            title="Abrir menú de navegación"
          />
        </header>
        
        {/* Sidebar de navegación con overlay */}
        <Navbar 
          show={showNav} 
          onClose={() => setshowNav(false)}
        />
        
        {/* Contenedor principal para las rutas */}
        <div className='main'>
          <Routes>
            {/* Login - redirecciona a Home si se autenticó */}
            <Route path='/' element={<LoginRouteWrapper />} />
            <Route path='/login' element={<LoginRouteWrapper />} />

            {/* Rutas privadas - solo accesibles tras autenticación */}
            <Route
              path="/Home"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />
            <Route
              path="/WorkSpace"
              element={
                <PrivateRoute>
                  <WorkSpace />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
