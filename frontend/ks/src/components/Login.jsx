import React from 'react';
// Importación de los estilos CSS del formulario (ruta corregida)
import '../pagesStyles/Login.css';

// Componente presentacional del formulario de login
// Recibe estado y callbacks por props desde la página contenedora
const Login = ({ formData, errors, isSubmitting, onChange, onSubmit, onNavigateToRegister }) => {
  return (
    // Contenedor principal con fondo degradado
    <div className="login-container">
      {/* Tarjeta del formulario con sombra y bordes redondeados */}
      <div className="login-card">
        {/* Título del formulario */}
        <h2 className="login-title">Iniciar Sesión</h2>
        
        {/* Formulario que maneja el envío de datos */}
        <form onSubmit={onSubmit} className="login-form">
          {/* Grupo de campo para el email */}
          <div className="form-group">
            {/* Etiqueta del campo email con asterisco para indicar que es obligatorio */}
            <label htmlFor="email" className="form-label">
              Correo Electrónico *
            </label>
            
            {/* Input del email con validación y manejo de errores */}
            <input
              type="email"                    // Tipo de input específico para emails
              id="email"                      // ID para asociar con la etiqueta
              name="email"                    // Nombre del campo para el estado
              value={formData?.email || ''}   // Valor controlado por React
              onChange={onChange}             // Función que se ejecuta al cambiar
              className={`form-input ${errors.email ? 'error' : ''}`}  // Clases CSS dinámicas
              placeholder="Ingresa tu correo electrónico"  // Texto de ayuda
              required                        // Campo obligatorio del navegador
            />
            
            {/* Mensaje de error que aparece solo si hay error en el email */}
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          
          {/* Grupo de campo para la contraseña */}
          <div className="form-group">
            {/* Etiqueta del campo contraseña con asterisco para indicar que es obligatorio */}
            <label htmlFor="password" className="form-label">
              Contraseña *
            </label>
            
            {/* Input de la contraseña con validación y manejo de errores */}
            <input
              type="password"                 // Tipo de input que oculta el texto
              id="password"                   // ID para asociar con la etiqueta
              name="password"                 // Nombre del campo para el estado
              value={formData?.password || ''} // Valor controlado por React
              onChange={onChange}              // Función que se ejecuta al cambiar
              className={`form-input ${errors.password ? 'error' : ''}`}  // Clases CSS dinámicas
              placeholder="Ingresa tu contraseña"  // Texto de ayuda
              required                        // Campo obligatorio del navegador
            />
            
            {/* Mensaje de error que aparece solo si hay error en la contraseña */}
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          {/* Botón de envío con estado dinámico */}
          <button 
            type="submit"                     // Tipo de botón que envía el formulario
            className="login-button"         // Clase CSS para estilos
            disabled={isSubmitting}          // Se deshabilita mientras se envía
          >
            {/* Texto dinámico que cambia según el estado */}
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Link para navegar al registro */}
        <div className="login-footer">
          <p className="login-footer-text">
            ¿No tienes una cuenta?{' '}
            <a href="/register" onClick={(e) => {
              e.preventDefault();
              if (onNavigateToRegister) {
                onNavigateToRegister();
              }
            }} className="login-link">
              Crear Cuenta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// Exporta el componente para que pueda ser usado en otros archivos
export default Login;
