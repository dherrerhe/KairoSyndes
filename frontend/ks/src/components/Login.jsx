// src/components/Login.jsx
import React from 'react';
import '../pagesStyles/Login.css';

// Componente presentacional del formulario de login
// Recibe estado y callbacks por props desde la página contenedora
const Login = ({ formData, errors, isSubmitting, onChange, onSubmit, onNavigateToRegister }) => {
  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Iniciar Sesión</h2>

        <form onSubmit={onSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Correo Electrónico *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={onChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Ingresa tu correo electrónico"
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Contraseña *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password || ''}
              onChange={onChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Ingresa tu contraseña"
              required
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {errors.general && <div className="error-message">{errors.general}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
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

export default Login;
