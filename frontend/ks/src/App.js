// src/App.js
import 'reactflow/dist/style.css';
import './styles/App.css';
import './fcStyles/FlowComponent.css';
import './fcStyles/FlowCanvas.css';
import './fcStyles/CustomNode.css';
import './fcStyles/NodeContextMenu.css';
import './fcStyles/Modal.css';
import { AuthProvider, PrivateRoute } from './hooks/useAuth';

import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import { GiHamburgerMenu } from "react-icons/gi";

import { WorkSpace } from './pages/WorkSpace';
import Home from './pages/Home';
import LoginPage from './pages/Login';  // Importa la página de Login
import RegisterPage from './pages/Register';  // Importa la página de Registro
import LoginPage from './pages/Login';

function App() {
  const [showNav, setshowNav] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <header className='App-header'>
          <GiHamburgerMenu 
            onClick={() => setshowNav(!showNav)}
            title="Abrir menú de navegación"
          />
        </header>
        
        <Navbar 
          show={showNav} 
          onClose={() => setshowNav(false)}
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
        
        <div className='main'>
          <Routes>
            {/* Ruta raíz redirige a login */}
            <Route path='/' element={<Navigate to="/login" replace />} />
            
            {/* Login */}
            <Route path='/login' element={<LoginPage />} />

            {/* Rutas privadas */}
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