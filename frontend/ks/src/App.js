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

// Importaciones de React y hooks
import { useState } from 'react';

// Importaciones de React Router para navegación
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importaciones de componentes personalizados
import Navbar from './components/Navbar';

// Importaciones de iconos
import { GiHamburgerMenu } from "react-icons/gi";

// Importaciones de páginas
import { WorkSpace } from './pages/WorkSpace';
import Home from './pages/Home';
import LoginPage from './pages/Login';  // Importa la página de Login
import RegisterPage from './pages/Register';  // Importa la página de Registro

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
          {/* Ruta raíz (/) que muestra el login por defecto - primera pantalla */}
          <Route path='/' element={<LoginPage />} />
          
          {/* Ruta alternativa para el login (/login) - misma página */}
          <Route path='/login' element={<LoginPage />} />
          
          {/* Ruta para el registro de usuarios (/register) */}
          <Route path='/register' element={<RegisterPage />} />
          
          {/* Ruta para la página principal (/Home) - solo accesible después del login */}
          <Route path='/Home' element={<Home />} />
          
          {/* Ruta para el workspace con React Flow (/WorkSpace) */}
          <Route path='/WorkSpace' element={<WorkSpace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
