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
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

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

        <div className='main'>
          <Routes>
            {/* Ruta raíz redirige a login */}
            <Route path='/' element={<Navigate to="/login" replace />} />
            
            {/* Login y Registro (públicas) */}
            <Route path='/login' element={<LoginPage />} />
            <Route path='/register' element={<RegisterPage />} />

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