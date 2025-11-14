import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Contexto de autenticación para compartir el estado globalmente
 */
const AuthContext = createContext();

/**
 * Proveedor de AuthContext para gestionar el estado de autenticación globalmente.
 * Incluye persistencia en localStorage.
 */
const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!localStorage.getItem('authToken');
    });

    useEffect(() => {
        if (isAuthenticated) {
            // Si está autenticado, asegura que el token está presente
            // (nada adicional que hacer aquí)
        } else {
            // Si no está autenticado, eliminar token
            localStorage.removeItem('authToken');
        }
    }, [isAuthenticated]);

    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook para usar el contexto de autenticación en cualquier componente
 */
function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}

/**
 * Ruta privada: sólo permite acceso si el usuario está autenticado.
 * Si no, redirige a login.
 */
function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (isAuthenticated) {
        return children;
    } else {
        // Guarda el path al que se quería acceder para después del login
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
}

export default useAuth;
export { AuthProvider, PrivateRoute };

/**
 * -- Notas sobre tu problema --
 * 
 * 1. El warning de "util._extend" es del servidor, NO de este código React.
 *    - Debes buscar en tu código backend (Node.js) o las dependencias backend (no React)
 *      y reemplazar cualquier uso de util._extend por Object.assign.
 *    - Si es de una librería, trata de actualizar esa librería.
 * 
 * 2. SOBRE EL PROBLEMA DE NO REDIRIGIR AL HOME EN TU FRONTEND:
 *    - Asegúrate que después de un login exitoso, guardes el token con localStorage.setItem('authToken', ...)
 *      y llames a setIsAuthenticated(true).
 *    - Si usas el login por API, revisa que devuelvas el token y lo almacenes como corresponde.
 *    - El flujo correcto sería:
 *       - LoginPage recibe submit correcto → guarda el token → llama a setIsAuthenticated(true) → ocurre el navigate('/Home').
 *    - Si nada de eso funciona, revisa que el componente LoginPage realmente reciba y ejecute onLoginSuccess.
 *    - También prueba borrar el caché del navegador.
 * 
 * 3. Si tras login exitoso NO se navega, revisa la lógica en tu componente que hace el login (no en este archivo).
 *    - Recuerda, PrivateRoute sólo permite el acceso si hay token y setIsAuthenticated es true.
 *    - Si no logras forzar el redirect tras login, imprime en consola si authToken está guardado: console.log(localStorage.getItem('authToken'));
 *    - Puedes también depurar con React DevTools si isAuthenticated está actualizando.
 */
