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

