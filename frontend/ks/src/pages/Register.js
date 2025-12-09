import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from '../components/Register';

// Página contenedora: maneja estado, validación y navegación del formulario de registro
const RegisterPage = () => {
  const navigate = useNavigate();

  // Estado para el formulario de registro
  const [formData, setFormData] = useState({ 
    name: '',                // Nombre completo del usuario (visible)
    email: '',               // Correo electrónico del usuario
    password: '',            // Contraseña ingresada
    confirmPassword: ''      // Confirmar contraseña
  });
  const [errors, setErrors] = useState({}); // Estado de errores de validación
  const [isSubmitting, setIsSubmitting] = useState(false); // Indica si se está enviando el formulario

  // Validación de campos del formulario
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

  // Maneja cambios en los inputs del formulario
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpia el error del campo al modificarlo
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }, [errors]);

  // Maneja el submit del formulario de registro
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors); // Si hay validaciones, muestra los errores
      return;
    }
    
    setIsSubmitting(true); // Indica que comenzó el envío
    
    try {
      // Hacer request al backend para registrar usuario
      const response = await fetch('/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          nickname: formData.name.toLowerCase().replace(/\s+/g, '_'),  // Convierte el nombre a nickname (sin espacios)
          first_name: formData.name.split(' ')[0],                     // Toma la primera palabra como first_name
          last_name: formData.name.split(' ').slice(1).join(' '),      // El resto como last_name
          password: formData.password,
          confirm_password: formData.confirmPassword
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        // Si la respuesta no es exitosa, muestra error general devuelto por el backend
        setErrors({ general: data.error || 'Error al registrar' });
        setIsSubmitting(false);
        return;
      }
  
      // Si es exitoso, imprime el usuario en consola y redirige a login
      console.log('Registro exitoso:', data.user);
      navigate('/login');
  
    } catch (err) {
      // Manejo de error de red/conexión
      console.error('Error de registro:', err);
      setErrors({ general: 'Falló la conexión con el servidor' });
      setIsSubmitting(false);
    }
  }, [formData, navigate, validate]);

  // Permite navegar al login manualmente
  const handleNavigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // Props que se pasan al componente presentacional Register
  const formProps = useMemo(() => ({
    formData,
    errors,
    isSubmitting,
    onChange: handleChange,
    onSubmit: handleSubmit,
    onNavigateToLogin: handleNavigateToLogin,
  }), [formData, errors, isSubmitting, handleChange, handleSubmit, handleNavigateToLogin]);

  // Renderiza el formulario de registro inyectando los props
  return (
    <div className="register-page">
      <Register {...formProps} />
    </div>
  );
};

export default RegisterPage;
