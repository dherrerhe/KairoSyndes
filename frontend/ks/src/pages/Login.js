// src/pages/Login.js
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';
// eslint-disable-next-line
import useAuth from '../hooks/useAuth';

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
  
      if (data.token && data.user) {
        // Guardar token
        localStorage.setItem('auth_token', data.token);
        
        // Guardar datos del usuario (completos)
        localStorage.setItem('user_email', data.user.email);
        localStorage.setItem('user_nickname', data.user.nickname || '');
        localStorage.setItem('user_id', data.user.id);
        
        console.log('Login exitoso:', data.user);
        
        // Redirigir a Home
        navigate('/Home');
      } else {
        setErrors({ general: 'Respuesta inesperada del servidor' });
      }
  
    } catch (err) {
      console.error('Error de login:', err);
      setErrors({ general: 'Falló la conexión con el servidor' });
    } finally {
      setIsSubmitting(false);
      navigate('/Home');
    }, 1000);
  }, [formData, navigate, validate]);

  const handleNavigateToRegister = useCallback(() => {
    navigate('/register');
  }, [navigate]);

  const formProps = useMemo(() => ({
    formData,
    errors,
    isSubmitting,
    onChange: handleChange,
    onSubmit: handleSubmit,
    onNavigateToRegister: handleNavigateToRegister,
  }), [formData, errors, isSubmitting, handleChange, handleSubmit, handleNavigateToRegister]);

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