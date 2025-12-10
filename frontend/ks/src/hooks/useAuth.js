// src/hooks/useAuth.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const token = localStorage.getItem('auth_token');
        return !!token;
    });

    const [user, setUser] = useState(() => {
        const email = localStorage.getItem('user_email');
        const nickname = localStorage.getItem('user_nickname');
        return email ? { email, nickname } : null;
    });

    // Escuchar cambios en storage (sincronización multi-tab)
    useEffect(() => {
        function handleStorage(e) {
            if (e.key === 'auth_token') {
                if (!e.newValue) {
                    setIsAuthenticated(false);
                    setUser(null);
                } else {
                    setIsAuthenticated(true);
                }
            }
            if (e.key === 'user_email' || e.key === 'user_nickname') {
                const email = localStorage.getItem('user_email');
                const nickname = localStorage.getItem('user_nickname');
                if (email) {
                    setUser({ email, nickname });
                    setIsAuthenticated(true);
                }
            }
        }
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const login = (token, userData) => {
        console.log('Login:', { token, userData });
        localStorage.setItem('auth_token', token);
        if (userData?.email) localStorage.setItem('user_email', userData.email);
        if (userData?.nickname) localStorage.setItem('user_nickname', userData.nickname);
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_nickname');
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            user,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}

function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (isAuthenticated) {
        return children;
    } else {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
}

export default useAuth;
export { AuthProvider, PrivateRoute };