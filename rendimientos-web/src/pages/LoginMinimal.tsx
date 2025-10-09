import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginMinimal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isRegistering 
        ? await register(email, password)
        : await login(email, password);

      if (result.success) {
        navigate('/app');
      } else {
        setError(result.error || 'Error desconocido');
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-500/5 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Login Form Container - Centered */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Logo/Brand */}
        <div className="text-center mb-10">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 bg-gradient-silver rounded-2xl flex items-center justify-center shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">
            Rendimientos
          </h1>
          <p className="text-xl text-dark-textSecondary font-medium">
            {isRegistering ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-dark-bgSecondary border-2 border-dark-border rounded-2xl shadow-2xl p-8 backdrop-blur-sm w-full">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-base font-semibold text-white mb-3">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 bg-white/10 border-2 border-gray-600 text-white rounded-xl text-lg placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white/20 shadow-inner"
                placeholder="tu@email.com"
                style={{ textShadow: '0 0 8px rgba(255,255,255,0.3)' }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-semibold text-white mb-3">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-5 py-4 bg-white/10 border-2 border-gray-600 text-white rounded-xl text-lg placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white/20 shadow-inner"
                placeholder="••••••••"
                style={{ textShadow: '0 0 8px rgba(255,255,255,0.3)' }}
              />
              <p className="mt-2 text-sm text-gray-300">Mínimo 6 caracteres</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border-2 border-red-500/30 text-red-400 text-base text-center p-4 rounded-xl font-medium">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-4 px-6 bg-gradient-silver text-white border-none rounded-xl text-lg font-bold cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading 
                ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isRegistering ? 'Creando cuenta...' : 'Iniciando sesión...'}
                  </span>
                )
                : (isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión')
              }
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-dark-border text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setEmail('');
                setPassword('');
              }}
              className="text-dark-textSecondary text-base cursor-pointer transition-colors duration-200 hover:text-green-400 font-medium"
            >
              {isRegistering ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
              <span className="text-green-400 hover:text-green-300 font-semibold">
                {isRegistering ? 'Iniciar Sesión' : 'Crear una'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-dark-textMuted">
            © 2024 Rendimientos. Todos los derechos reservados.
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <a href="#" className="text-sm text-dark-textSecondary hover:text-green-400 transition-colors">
              Términos
            </a>
            <span className="text-dark-textMuted">•</span>
            <a href="#" className="text-sm text-dark-textSecondary hover:text-green-400 transition-colors">
              Privacidad
            </a>
            <span className="text-dark-textMuted">•</span>
            <a href="#" className="text-sm text-dark-textSecondary hover:text-green-400 transition-colors">
              Soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
