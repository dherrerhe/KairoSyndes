// src/hooks/useAuth.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
        // Verificar si existe el token en localStorage al iniciar
        const token = localStorage.getItem('auth_token');
        return !!token;
    });

    const [user, setUser] = useState(() => {
        // Cargar info del usuario si existe
        const email = localStorage.getItem('user_email');
        const nickname = localStorage.getItem('user_nickname');
        return email ? { email, nickname } : null;
    });

    // * Solución reactiva: escuchamos mensajes de storage para multitab y para sincronía de auth *
    useEffect(() => {
        function handleStorage(e) {
            if (e.key === 'auth_token') {
                // Si cerraron sesión en otra pestaña, se desloguea aquí también
                if (!e.newValue) {
                    setIsAuthenticated(false);
                    setUser(null);
                }
            }
            if (e.key === 'user_email' || e.key === 'user_nickname') {
                const email = localStorage.getItem('user_email');
                const nickname = localStorage.getItem('user_nickname');
                if (email) {
                    setUser({ email, nickname });
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
        }
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    /**
     * Función para hacer login
     * @param {string} token - Token de autenticación
     * @param {Object} userData - Datos del usuario {email, nickname}
     */
    const login = (token, userData) => {
        localStorage.setItem('auth_token', token);
        if (userData?.email) {
            localStorage.setItem('user_email', userData.email);
        }
        if (userData?.nickname) {
            localStorage.setItem('user_nickname', userData.nickname);
        }
        setUser(userData);
        setIsAuthenticated(true);
    };

    /**
     * Función para hacer logout
     * Workaround: forzar reinicio de estados internos de React además de limpiar localStorage
     */
    const logout = () => {
        // Limpiar localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_nickname');

        // Limpiar cache y reactividad inmediatamente
        setUser(null);
        setIsAuthenticated(false);

    };

    // Verificar token al montar
    useEffect(() => {
        // Esto permite que si algún componente externo cambia los datos manualmente, el estado se ajuste
        const checkLocalStorage = () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setIsAuthenticated(false);
                setUser(null);
            } else {
                setIsAuthenticated(true);
                const email = localStorage.getItem('user_email');
                const nickname = localStorage.getItem('user_nickname');
                setUser(email ? { email, nickname } : null);
            }
        };
        // Ejecutar al montar:
        checkLocalStorage();

        // Y cada vez que se navega (en el futuro, podría añadir un hook al history/location también)
    }, []);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            setIsAuthenticated,
            user,
            login,
            logout
        }}>
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