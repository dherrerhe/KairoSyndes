// src/pages/login.js
import React, { useState, useCallback } from 'react';
import Login from '../components/Login';

// Importa useAuth si lo necesitas (no navigate aquí)
import useAuth from '../hooks/useAuth';

const LoginPage = ({ onLoginSuccess }) => {
  // Quita navigate (el wrapper del router hará el redirect tras login)
  const { setIsAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Maneja cambios en los inputs
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }, [errors]);

  // Envío del formulario
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    // Validación simple
    const validationErrors = {};
    //if (!formData.email.trim()) validationErrors.email = 'El correo es obligatorio';
    if (!formData.password) validationErrors.password = 'La contraseña es obligatoria';
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || 'Error al iniciar sesión' });
        setIsSubmitting(false);
        return;
      }

      if (data.token) {
        // Usa el estándar: guarda el token como 'authToken' para integración con useAuth.js
        localStorage.setItem('authToken', data.token);
        setIsAuthenticated(true);

        // Si hay un callback onLoginSuccess (App lo pasa), llámalo para navegar
        if (onLoginSuccess) {
          onLoginSuccess(data.token);
        }
      } else {
        setErrors({ general: 'Respuesta inesperada del servidor' });
      }

    } catch (err) {
      setErrors({ general: 'Fallo la conexión con el servidor' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, setIsAuthenticated, onLoginSuccess]);

  return (
    <Login
      formData={formData}
      errors={errors}
      isSubmitting={isSubmitting}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
};

export default LoginPage;