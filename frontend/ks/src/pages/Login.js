import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';

// Página contenedora: maneja estado, validación y navegación
const LoginPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((data) => {
    const newErrors = {};
    if (!data.email.trim()) newErrors.email = 'El correo electrónico es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = 'Ingresa un correo electrónico válido';
    if (!data.password.trim()) newErrors.password = 'La contraseña es obligatoria';
    else if (data.password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
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
    setTimeout(() => {
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
    <div className="login-page">
      <Login {...formProps} />
    </div>
  );
};

export default LoginPage;
