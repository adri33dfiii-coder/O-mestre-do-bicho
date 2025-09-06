import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../App';

const Login = () => {
  const { login, register, isAuthenticated } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect se já estiver logado
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isLoginMode && formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    const result = isLoginMode
      ? await login(formData.username, formData.password)
      : await register(formData.username, formData.password);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-float">🎯</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            O Mestre do Bicho
          </h1>
          <p className="text-white/80 text-lg">
            {isLoginMode ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-white font-semibold mb-2">
                👤 Usuário
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                placeholder="Digite seu usuário"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white font-semibold mb-2">
                🔐 Senha
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                placeholder="Digite sua senha"
              />
            </div>

            {/* Confirm Password (apenas no registro) */}
            {!isLoginMode && (
              <div>
                <label className="block text-white font-semibold mb-2">
                  🔐 Confirmar Senha
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  placeholder="Confirme sua senha"
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="feedback-error">
                ⚠️ {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full palpite-button text-lg font-bold py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isLoginMode ? 'Entrando...' : 'Registrando...'}
                </div>
              ) : (
                <>
                  {isLoginMode ? '🎯 Entrar' : '📝 Registrar'}
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="text-center mt-6 pt-6 border-t border-white/20">
            <p className="text-white/80 mb-3">
              {isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            </p>
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError('');
                setFormData({ username: '', password: '', confirmPassword: '' });
              }}
              className="text-green-400 hover:text-green-300 font-semibold transition-colors"
            >
              {isLoginMode ? '📝 Criar conta' : '🎯 Fazer login'}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-8 text-white/60 text-sm">
          <p>🎲 Sistema de geração de palpites</p>
          <p className="mt-1">⚠️ Nada é 100% confiável, gerencie suas apostas</p>
        </div>
      </div>
    </div>
  );
};

export default Login;