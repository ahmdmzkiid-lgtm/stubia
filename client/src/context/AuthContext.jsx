import { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(() => {
    return !!localStorage.getItem('token');
  });

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await authService.me();
        setUser(res.data.data);
      } catch (error) {
        console.error('Failed to refresh user');
      }
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await authService.me();
          setUser(res.data.data);
        } catch (error) {
          // Hanya hapus token jika server menolak (401 = token invalid/expired)
          // Jangan logout user karena network error / server timeout
          const status = error?.response?.status;
          if (status === 401) {
            console.error("Token ditolak server (401), removing...");
            setToken(null);
            localStorage.removeItem('token');
          } else {
            console.error("Gagal fetch user (non-401), token dipertahankan:", status || 'network error');
          }
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const loginWithGoogle = async (credential) => {
    try {
      const response = await authService.loginWithGoogle(credential);
      const { token: newToken, user: userData } = response.data.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Handle Google OAuth redirect callback.
   * Called when Google redirects back to /auth/google/callback?code=xxx
   * Sends the authorization code to the backend to exchange for user + JWT.
   */
  const handleGoogleCallback = async (code, redirectUri) => {
    try {
      const response = await authService.googleCallback(code, redirectUri);
      const { token: newToken, user: userData } = response.data.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    return res.data;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    const { token: newToken, user: newUserData } = res.data.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUserData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: ['admin', 'question_writer', 'quality_assurance', 'article_writer'].includes(user?.role),
    loading,
    login,
    loginWithGoogle,
    handleGoogleCallback,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
