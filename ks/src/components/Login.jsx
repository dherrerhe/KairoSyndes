// Importación de React y sus hooks necesarios
import React, { useState } from 'react';
// Importación de React Router para navegación entre páginas
import { useNavigate } from 'react-router-dom';
// Importación de los estilos CSS específicos del componente Login
import '../styles/c_Styles/Login.css';

// Componente funcional Login que maneja el formulario de autenticación
const Login = () => {
  // Estado para almacenar los datos del formulario (email y contraseña)
  const [formData, setFormData] = useState({
    email: '',      // Campo de correo electrónico inicialmente vacío
    password: ''    // Campo de contraseña inicialmente vacío
  });
  
  // Estado para almacenar los errores de validación de cada campo
  const [errors, setErrors] = useState({});
  
  // Estado para controlar si el formulario se está enviando (evita múltiples envíos)
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Hook de React Router para navegar entre páginas
  const navigate = useNavigate();

  // Función que se ejecuta cada vez que el usuario escribe en un campo
  const handleChange = (e) => {
    // Extrae el nombre del campo y su valor del evento
    const { name, value } = e.target;
    
    // Actualiza el estado del formulario con el nuevo valor
    setFormData(prev => ({
      ...prev,        // Mantiene los valores anteriores
      [name]: value   // Actualiza solo el campo que cambió
    }));
    
    // Si hay un error en el campo que se está editando, lo limpia
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,      // Mantiene otros errores
        [name]: ''    // Limpia el error del campo actual
      }));
    }
  };

  // Función que valida todos los campos del formulario
  const validateForm = () => {
    const newErrors = {};  // Objeto para almacenar los errores encontrados
    
    // Validación del campo email
    if (!formData.email.trim()) {
      // Si el email está vacío o solo tiene espacios
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      // Si el email no tiene formato válido (regex para validar email)
      newErrors.email = 'Ingresa un correo electrónico válido';
    }
    
    // Validación del campo contraseña
    if (!formData.password.trim()) {
      // Si la contraseña está vacía o solo tiene espacios
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      // Si la contraseña tiene menos de 6 caracteres
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    // Retorna el objeto con todos los errores encontrados
    return newErrors;
  };

  // Función que se ejecuta cuando el usuario envía el formulario
  const handleSubmit = (e) => {
    e.preventDefault();  // Previene el comportamiento por defecto del formulario
    
    // Ejecuta la validación y obtiene los errores
    const validationErrors = validateForm();
    
    // Si hay errores, los muestra y detiene el proceso
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;  // Sale de la función sin continuar
    }
    
    // Si no hay errores, marca que se está enviando el formulario
    setIsSubmitting(true);
    
    // Simula el proceso de login con un delay de 1 segundo
    setTimeout(() => {
      setIsSubmitting(false);  // Termina el estado de envío
      navigate('/Home');       // Redirige a la página Home
    }, 1000);
  };

  // Retorna la interfaz de usuario del componente Login
  return (
    // Contenedor principal con fondo degradado
    <div className="login-container">
      {/* Tarjeta del formulario con sombra y bordes redondeados */}
      <div className="login-card">
        {/* Título del formulario */}
        <h2 className="login-title">Iniciar Sesión</h2>
        
        {/* Formulario que maneja el envío de datos */}
        <form onSubmit={handleSubmit} className="login-form">
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
              value={formData.email}          // Valor controlado por React
              onChange={handleChange}         // Función que se ejecuta al cambiar
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
              value={formData.password}       // Valor controlado por React
              onChange={handleChange}          // Función que se ejecuta al cambiar
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
      </div>
    </div>
  );
};

// Exporta el componente para que pueda ser usado en otros archivos
export default Login;
