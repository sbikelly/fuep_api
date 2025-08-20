import { createContext, useContext, useEffect, useState } from 'react';
import { jsx as _jsx } from 'react/jsx-runtime';

import { getApiBaseUrl } from '../utils/config';
const AuthContext = createContext(undefined);
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!user;
  useEffect(() => {
    // Check if user is already logged in on app start
    const token = localStorage.getItem('accessToken');
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, []);
  const login = async (username, password) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Store tokens
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        // Fetch user profile
        await refreshUser();
        return true;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };
  const refreshUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(`${getApiBaseUrl()}/candidates/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        // Token expired or invalid
        logout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setUser(data.candidate);
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };
  const changePassword = async (oldPassword, newPassword) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (response.ok) {
        // Update user state to reflect password change
        if (user) {
          setUser({ ...user, tempPasswordFlag: false });
        }
        return true;
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      return false;
    }
  };
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    changePassword,
  };
  return _jsx(AuthContext.Provider, { value: value, children: children });
};
