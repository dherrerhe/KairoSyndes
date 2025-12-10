import React from 'react';
// Importación de los estilos CSS del formulario
import '../pagesStyles/Register.css';

// Componente presentacional del formulario de registro
// Recibe estado y callbacks por props desde la página contenedora
const Register = ({ formData, errors, isSubmitting, onChange, onSubmit, onNavigateToLogin }) => {
  return (
    // Contenedor principal con fondo degradado
    <div className="register-container">
      {/* Tarjeta del formulario con sombra y bordes redondeados */}
      <div className="register-card">
        {/* Título del formulario */}
        <h2 className="register-title">Crear Cuenta</h2>
        
        {/* Formulario que maneja el envío de datos */}
        <form onSubmit={onSubmit} className="register-form">
          {/* Grupo de campo para el nombre */}
          <div className="form-group">
            {/* Etiqueta del campo nombre con asterisco para indicar que es obligatorio */}
            <label htmlFor="name" className="form-label">
              Nombre Completo *
            </label>
            
            {/* Input del nombre con validación y manejo de errores */}
            <input
              type="text"
              id="name"
              name="name"
              value={formData?.name || ''}
              onChange={onChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Ingresa tu nombre completo"
              required
            />
            
            {/* Mensaje de error que aparece solo si hay error en el nombre */}
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Grupo de campo para el email */}
          <div className="form-group">
            {/* Etiqueta del campo email con asterisco para indicar que es obligatorio */}
            <label htmlFor="email" className="form-label">
              Correo Electrónico *
            </label>
            
            {/* Input del email con validación y manejo de errores */}
            <input
              type="email"
              id="email"
              name="email"
              value={formData?.email || ''}
              onChange={onChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Ingresa tu correo electrónico"
              required
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
              type="password"
              id="password"
              name="password"
              value={formData?.password || ''}
              onChange={onChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Ingresa tu contraseña"
              required
            />
            
            {/* Mensaje de error que aparece solo si hay error en la contraseña */}
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Grupo de campo para confirmar la contraseña */}
          <div className="form-group">
            {/* Etiqueta del campo confirmar contraseña con asterisco para indicar que es obligatorio */}
            <label htmlFor="confirmPassword" className="form-label">
              Confirmar Contraseña *
            </label>
            
            {/* Input de confirmar contraseña con validación y manejo de errores */}
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData?.confirmPassword || ''}
              onChange={onChange}
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirma tu contraseña"
              required
            />
            
            {/* Mensaje de error que aparece solo si hay error en confirmar contraseña */}
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
          
          {/* Botón de envío con estado dinámico */}
          <button 
            type="submit"
            className="register-button"
            disabled={isSubmitting}
          >
            {/* Texto dinámico que cambia según el estado */}
            {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        {/* Link para navegar al login */}
        <div className="register-footer">
          <p className="register-footer-text">
            ¿Ya tienes una cuenta?{' '}
            <a href="/login" onClick={(e) => {
              e.preventDefault();
              onNavigateToLogin();
            }} className="register-link">
              Iniciar Sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// Exporta el componente para que pueda ser usado en otros archivos
export default Register;

