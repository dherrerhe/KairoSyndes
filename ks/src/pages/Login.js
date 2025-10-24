// Importación de React para crear componentes
import React from 'react';
// Importación del componente Login desde la carpeta components
import Login from '../components/Login';

// Componente funcional LoginPage que actúa como página contenedora
const LoginPage = () => {
  // Retorna la estructura de la página
  return (
    // Contenedor de la página con clase CSS para posibles estilos adicionales
    <div className="login-page">
      {/* Renderiza el componente Login dentro de esta página */}
      <Login />
    </div>
  );
};

// Exporta el componente para que pueda ser usado en el routing
export default LoginPage;
