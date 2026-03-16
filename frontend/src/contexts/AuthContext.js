import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, role, message } = response.data;
      
      // Create user object
      const userData = {
        email: credentials.email,
        role: role,
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, message, role };
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      
      // Extract error message from different possible formats
      let message = 'Login failed';
      
      if (error.response?.data) {
        // If data is a string, use it directly
        if (typeof error.response.data === 'string') {
          message = error.response.data;
        }
        // If data has a message property, use it
        else if (error.response.data.message) {
          message = error.response.data.message;
        }
        // If data is an object, stringify it
        else if (typeof error.response.data === 'object') {
          message = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        message = error.message;
      }
      
      console.log('Final error message:', message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token, role, message, isApproved } = response.data;
      
      // Create user object
      const newUser = {
        email: userData.email,
        role: role,
        fullName: userData.fullName,
        isApproved: isApproved !== false, // Default to true for patients, false for pharmacy/hospital
      };

      // Only store token and login if approved or if it's a patient
      if (isApproved !== false) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        setIsAuthenticated(true);
      }
      
      return { 
        success: true, 
        message, 
        role,
        isApproved: isApproved !== false,
        needsApproval: isApproved === false
      };
    } catch (error) {
      const message = error.response?.data || 'Registration failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};