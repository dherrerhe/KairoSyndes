// src/pages/Login.js
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';

const LoginPage = () => {
  const navigate = useNavigate();
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
    if (!formData.email.trim()) validationErrors.email = 'El correo es obligatorio';
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
        // Guardar token en localStorage
        localStorage.setItem('auth_token', data.token);
        
        // Guardar email del usuario (opcional, para mostrar en UI)
        localStorage.setItem('user_email', formData.email);
        
        // ✅ Redirigir a Home
        navigate('/Home');
      } else {
        setErrors({ general: 'Respuesta inesperada del servidor' });
      }

    } catch (err) {
      console.error('Error de login:', err);
      setErrors({ general: 'Fallo la conexión con el servidor' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, navigate]);

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