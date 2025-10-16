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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      zIndex: 9999
    }}>
      {/* Background Effects */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          width: '288px',
          height: '288px',
          backgroundColor: 'rgba(34, 197, 94, 0.05)',
          borderRadius: '50%',
          filter: 'blur(48px)',
          animation: 'pulse 4s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '25%',
          right: '25%',
          width: '288px',
          height: '288px',
          backgroundColor: 'rgba(107, 114, 128, 0.05)',
          borderRadius: '50%',
          filter: 'blur(48px)',
          animation: 'pulse 4s ease-in-out infinite 2s'
        }}></div>
      </div>

      {/* Main Container */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(55, 65, 81, 0.5)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-block', marginBottom: '24px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #d1d5db 0%, #6b7280 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              margin: '0 auto'
            }}>
              <svg width="48" height="48" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 8px 0'
          }}>
            Rendimientos
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#9ca3af',
            fontWeight: '500',
            margin: 0
          }}>
            {isRegistering ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
          </p>
        </div>

        {/* Back to Home Button */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(156, 163, 175, 0.3)',
              borderRadius: '8px',
              color: '#9ca3af',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textDecoration: 'none'
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(156, 163, 175, 0.1)';
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(156, 163, 175, 0.5)';
              (e.target as HTMLButtonElement).style.color = '#d1d5db';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(156, 163, 175, 0.3)';
              (e.target as HTMLButtonElement).style.color = '#9ca3af';
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al inicio
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '32px' }}>
          {/* Email Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '12px'
            }}>
              Correo electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
                  border: '1px solid #4b5563',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '18px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = '#22c55e';
                  (e.target as HTMLButtonElement).style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.2)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = '#4b5563';
                  (e.target as HTMLButtonElement).style.boxShadow = 'none';
                }}
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '16px',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}>
                <svg width="20" height="20" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '12px'
            }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  backgroundColor: 'rgba(31, 41, 55, 0.8)',
                  border: '1px solid #4b5563',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '18px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = '#22c55e';
                  (e.target as HTMLButtonElement).style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.2)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLButtonElement).style.borderColor = '#4b5563';
                  (e.target as HTMLButtonElement).style.boxShadow = 'none';
                }}
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '16px',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}>
                <svg width="20" height="20" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            {isRegistering && (
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '14px',
                color: '#9ca3af'
              }}>
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '16px',
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              fontWeight: '500',
              marginBottom: '24px'
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
              color: '#000000',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              opacity: loading ? 0.5 : 1,
              transform: loading ? 'none' : 'translateY(0)',
              boxSizing: 'border-box'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
                (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.background = 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)';
                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.target as HTMLButtonElement).style.boxShadow = 'none';
              }
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg 
                  className="animate-spin" 
                  width="20" 
                  height="20" 
                  style={{ marginRight: '12px' }}
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isRegistering ? 'Creando cuenta...' : 'Iniciando sesión...'}
              </span>
            ) : (
              isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Toggle Form */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(55, 65, 81, 0.5)',
          textAlign: 'center'
        }}>
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setEmail('');
              setPassword('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'color 0.2s',
              fontWeight: '500'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.color = '#22c55e'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.color = '#9ca3af'}
          >
            {isRegistering ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <span style={{
              color: '#22c55e',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.color = '#16a34a'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.color = '#22c55e'}
            >
              {isRegistering ? 'Iniciar Sesión' : 'Crear una'}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 16px 0'
          }}>
            © 2024 Rendimientos. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        input::placeholder {
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}