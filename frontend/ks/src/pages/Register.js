import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from '../components/Register';

// Página contenedora: maneja estado, validación y navegación
const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((data) => {
    const newErrors = {};
    
    if (!data.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (data.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!data.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }
    
    if (!data.password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (data.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (!data.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Debes confirmar tu contraseña';
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    return newErrors;
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }, [errors]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    // Simulación de registro (aquí iría la llamada a la API)
    setTimeout(() => {
      setIsSubmitting(false);
      // Después de registrar, redirigir al login para que el usuario inicie sesión
      navigate('/login');
    }, 1000);
  }, [formData, navigate, validate]);

  const handleNavigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  const formProps = useMemo(() => ({
    formData,
    errors,
    isSubmitting,
    onChange: handleChange,
    onSubmit: handleSubmit,
    onNavigateToLogin: handleNavigateToLogin,
  }), [formData, errors, isSubmitting, handleChange, handleSubmit, handleNavigateToLogin]);

  return (
    <div className="register-page">
      <Register {...formProps} />
    </div>
  );
};

export default RegisterPage;

