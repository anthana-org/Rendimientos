import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ConnectionStatus } from './ConnectionStatus';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  
  // Verificar si el usuario es administrador
  const isAdmin = user?.email?.includes('admin') || 
                 user?.email === 'admin@test.com' ||
                 user?.email === 'victorgallo.financiero@gmail.com' ||
                 user?.email === 'test3@gmail.com';

  // No mostrar navbar en login
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <nav className="bg-dark-bgSecondary shadow-2xl border-b-2 border-dark-border sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl xl:max-w-screen-2xl 2xl:max-w-[90vw] mx-auto pl-8 sm:pl-12 lg:pl-16 xl:pl-20 2xl:pl-24 pr-2 sm:pr-3 lg:pr-4 xl:pr-6 2xl:pr-8">
        <div className="flex justify-between h-20 sm:h-24 lg:h-28 py-4 sm:py-6 lg:py-8">
          {/* Logo y navegación principal */}
          <div className="flex items-center">
            <Link to={isAdmin ? "/admin" : "/app"} className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-silver rounded-xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">Rendimientos</span>
            </Link>

            {/* Botones de acción */}
            <div className="hidden md:ml-8 lg:ml-10 md:flex md:space-x-4 lg:space-x-6">
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Depósito
              </button>
              <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Retiro
              </button>
            </div>

            {/* Navegación desktop */}
            <div className="hidden md:ml-8 lg:ml-10 md:flex md:space-x-8 lg:space-x-10">
              {!isAdmin && (
                <Link
                  to="/app"
                  className={`inline-flex items-center px-4 py-3 text-lg lg:text-xl font-bold transition-all duration-300 rounded-xl ${
                    isActive('/app')
                      ? 'text-green-400 bg-green-500/20 border-2 border-green-400 shadow-lg'
                      : 'text-dark-textSecondary hover:text-white hover:bg-dark-bgTertiary hover:border-dark-borderLight border-2 border-transparent hover:shadow-lg'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                  </svg>
                  Dashboard
                </Link>
              )}
              
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`inline-flex items-center px-4 py-3 text-lg lg:text-xl font-bold transition-all duration-300 rounded-xl ${
                    isActive('/admin')
                      ? 'text-green-400 bg-green-500/20 border-2 border-green-400 shadow-lg'
                      : 'text-dark-textSecondary hover:text-white hover:bg-dark-bgTertiary hover:border-dark-borderLight border-2 border-transparent hover:shadow-lg'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Administración
                </Link>
              )}
            </div>
          </div>

          {/* Lado derecho - Usuario */}
          <div className="flex items-center space-x-4 sm:space-x-5 lg:space-x-6">
            {/* Estado de conexión */}
            <ConnectionStatus />

            {/* Notificaciones */}
            <button className="relative p-3 sm:p-4 text-dark-textSecondary hover:text-green-400 hover:bg-dark-bgTertiary focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-dark-bgSecondary rounded-xl transition-all duration-300">
              <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-2 right-2 block h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full bg-red-500 ring-2 ring-dark-bgSecondary"></span>
            </button>

            {/* Menú de usuario */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-dark-bgSecondary"
              >
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-xs sm:text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="ml-1 sm:ml-2 text-dark-text font-medium hidden lg:block text-sm">
                  {user?.email}
                </span>
                <svg className="ml-1 h-4 w-4 text-dark-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown del usuario */}
              {isUserMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-2xl bg-dark-bgTertiary border border-dark-border focus:outline-none">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-dark-text border-b border-dark-border">
                      <p className="font-medium">{user?.email}</p>
                      <p className="text-dark-textSecondary text-xs">Usuario</p>
                    </div>
                    {!isAdmin && (
                      <Link
                        to="/app"
                        className="block px-4 py-2 text-sm text-dark-textSecondary hover:bg-dark-bgSecondary hover:text-purple-400 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                        Dashboard
                      </Link>
                    )}
                    
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-dark-textSecondary hover:bg-dark-bgSecondary hover:text-purple-400 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Administración
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-dark-textSecondary hover:bg-dark-bgSecondary hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón hamburguesa para móvil */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-dark-textSecondary hover:text-green-400 hover:bg-dark-bgTertiary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-dark-bgTertiary border-t border-dark-border">
            {!isAdmin && (
              <Link
                to="/app"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/app')
                    ? 'bg-dark-bg text-green-400'
                    : 'text-dark-textSecondary hover:text-dark-text hover:bg-dark-bgSecondary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                Dashboard
              </Link>
            )}
            
            {isAdmin && (
              <Link
                to="/admin"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/admin')
                    ? 'bg-dark-bg text-green-400'
                    : 'text-dark-textSecondary hover:text-dark-text hover:bg-dark-bgSecondary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Administración
              </Link>
            )}
            
            {/* Búsqueda móvil */}
            <div className="px-3 py-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-dark-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="block w-full pl-10 pr-3 py-2 border border-dark-border rounded-md leading-5 bg-dark-bgSecondary text-dark-text placeholder-dark-textMuted focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
