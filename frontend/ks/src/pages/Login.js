// src/pages/Login.js
import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import useAuth from '../hooks/useAuth';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }, [errors]);

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
        // Usar el contexto de autenticación
        login(data.token, {
          email: data.user.email,
          nickname: data.user.nickname
        });
        
        console.log('Login exitoso:', data.user);
        
        // Redirigir a Home después de un pequeño delay
        setTimeout(() => {
          navigate('/Home');
        }, 100);
      } else {
        setErrors({ general: 'Respuesta inesperada del servidor' });
      }
  
    } catch (err) {
      console.error('Error de login:', err);
      setErrors({ general: 'Falló la conexión con el servidor' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, navigate, login]);

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

  return <Login {...formProps} />;
};

export default LoginPage;