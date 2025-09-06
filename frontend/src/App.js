import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Importar páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Palpites from './pages/Palpites';
import Historico from './pages/Historico';
import Relatorios from './pages/Relatorios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context para autenticação
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro do AuthProvider');
  }
  return context;
};

// Provider de autenticação
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configurar axios com token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verificar se token é válido
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Token inválido:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/login`, {
        username,
        password
      });

      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Erro ao fazer login' 
      };
    }
  };

  const register = async (username, password, nivel = 'comum') => {
    try {
      await axios.post(`${API}/register`, {
        username,
        password,
        nivel
      });
      
      // Fazer login automaticamente após registro
      return await login(username, password);
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Erro ao registrar usuário' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-yellow-700">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <div className="text-white text-xl font-bold">Carregando O Mestre do Bicho...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Componente para proteger rotas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Layout principal da aplicação
const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-yellow-700">
      {user && (
        <nav className="bg-black/20 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="text-3xl">🎯</div>
                <div className="text-white font-bold text-xl">O Mestre do Bicho</div>
              </div>
              
              <div className="flex items-center space-x-6">
                <span className="text-white/80">
                  {user.nivel === 'admin' ? '👑' : '👤'} {user.username}
                </span>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            
            <Route path="/palpites/:modalidade" element={
              <PrivateRoute>
                <Palpites />
              </PrivateRoute>
            } />
            
            <Route path="/historico" element={
              <PrivateRoute>
                <Historico />
              </PrivateRoute>
            } />
            
            <Route path="/relatorios" element={
              <PrivateRoute>
                <Relatorios />
              </PrivateRoute>
            } />
            
            {/* Redirect para dashboard se autenticado, senão para login */}
            <Route path="*" element={
              <PrivateRoute>
                <Navigate to="/" replace />
              </PrivateRoute>
            } />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;