import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/5 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-gray-500/5 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-400/3 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-pulse animation-delay-4000"></div>
      </div>
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur-sm shadow-lg border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl xl:max-w-[95vw] 2xl:max-w-[98vw] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Rendimientos</h1>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              <a href="#beneficios" className="text-gray-400 hover:text-white transition-colors font-medium">Beneficios</a>
              <a href="#funcionamiento" className="text-gray-400 hover:text-white transition-colors font-medium">¿Cómo funciona?</a>
              <a href="#testimonios" className="text-gray-400 hover:text-white transition-colors font-medium">Testimonios</a>
              <a href="#contacto" className="text-gray-400 hover:text-white transition-colors font-medium">Contacto</a>
            </nav>
            
            {/* Desktop Login Button */}
            <button
              onClick={handleLogin}
              className="hidden sm:block bg-gradient-to-r from-gray-300 to-gray-400 text-black px-6 py-2.5 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-semibold"
            >
              Iniciar Sesión
            </button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-green-400 hover:bg-gray-800/50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-700/50 py-4">
              <nav className="flex flex-col space-y-4">
                <a href="#beneficios" className="text-gray-400 hover:text-green-400 transition-colors px-2 py-1" onClick={() => setIsMobileMenuOpen(false)}>
                  Beneficios
                </a>
                <a href="#funcionamiento" className="text-gray-400 hover:text-green-400 transition-colors px-2 py-1" onClick={() => setIsMobileMenuOpen(false)}>
                  ¿Cómo funciona?
                </a>
                <a href="#testimonios" className="text-gray-400 hover:text-green-400 transition-colors px-2 py-1" onClick={() => setIsMobileMenuOpen(false)}>
                  Testimonios
                </a>
                <a href="#contacto" className="text-gray-400 hover:text-green-400 transition-colors px-2 py-1" onClick={() => setIsMobileMenuOpen(false)}>
                  Contacto
                </a>
                <button
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-gray-300 to-gray-400 text-black px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 w-full text-left mt-4 font-semibold"
                >
                  Iniciar Sesión
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900/30 via-gray-800/20 to-black py-16 sm:py-20 lg:py-24 xl:py-32 2xl:py-40">
        {/* Additional background elements for hero */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/5 rounded-full mix-blend-screen filter blur-xl opacity-40 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-500/5 rounded-full mix-blend-screen filter blur-xl opacity-40 animate-pulse animation-delay-2000"></div>
        </div>
        <div className="max-w-7xl xl:max-w-[95vw] 2xl:max-w-[98vw] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-white mb-4 sm:mb-6 xl:mb-8 leading-tight">
              Maximiza tus Rendimientos con{' '}
              <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">Tecnología Avanzada</span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-gray-400 mb-6 sm:mb-8 xl:mb-12 max-w-4xl xl:max-w-5xl mx-auto leading-relaxed px-4">
              Gestiona tus inversiones de forma inteligente con nuestra plataforma de análisis financiero y proyecciones en tiempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 xl:gap-6 justify-center px-4">
              <button
                onClick={handleRegister}
                className="bg-gradient-to-r from-gray-300 to-gray-400 text-black px-6 sm:px-8 xl:px-12 py-3 sm:py-4 xl:py-5 rounded-lg text-base sm:text-lg xl:text-xl font-semibold hover:shadow-xl hover:-translate-y-1 hover:from-green-300 hover:to-green-400 transition-all duration-300 w-full sm:w-auto"
              >
                Comenzar Ahora
              </button>
              <button
                onClick={handleLogin}
                className="bg-transparent border-2 border-gray-600 text-white px-6 sm:px-8 xl:px-12 py-3 sm:py-4 xl:py-5 rounded-lg text-base sm:text-lg xl:text-xl font-semibold hover:bg-gray-800/50 hover:border-green-500 hover:text-green-400 transition-all duration-300 w-full sm:w-auto"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios Section */}
      <section id="beneficios" className="py-20 sm:py-24 lg:py-28 xl:py-32 bg-black">
        <div className="max-w-7xl xl:max-w-[95vw] 2xl:max-w-[98vw] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center mb-16 sm:mb-20 xl:mb-24">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-6 xl:mb-8 leading-tight">Tu Éxito es Nuestro Objetivo</h2>
            <p className="text-lg sm:text-xl xl:text-2xl text-gray-400 max-w-4xl xl:max-w-5xl mx-auto leading-relaxed px-4">
              Descubre cómo nuestra plataforma puede transformar tu vida financiera con beneficios claros y tangibles.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 sm:gap-10 xl:gap-14">
            <div className="text-center p-6 sm:p-8 xl:p-10 rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/50 hover:border-green-500/30 transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 xl:w-20 xl:h-20 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6 xl:mb-8">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl xl:text-2xl font-semibold text-white mb-4 xl:mb-6">Métricas Claras</h3>
              <p className="text-sm sm:text-base xl:text-lg text-gray-400 leading-relaxed font-medium">
                Visualiza tu progreso con dashboards intuitivos. Entiende de dónde viene y a dónde va tu dinero.
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 xl:p-10 rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/50 hover:border-green-500/30 transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 xl:w-20 xl:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 xl:mb-8">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl xl:text-2xl font-semibold text-white mb-4 xl:mb-6">Seguridad Total</h3>
              <p className="text-sm sm:text-base xl:text-lg text-gray-400 leading-relaxed">
                Tu información es confidencial y está protegida con los más altos estándares de seguridad.
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 xl:p-10 rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/50 hover:border-green-500/30 transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 xl:w-20 xl:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 xl:mb-8">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl xl:text-2xl font-semibold text-white mb-4 xl:mb-6">Asesoría Experta</h3>
              <p className="text-sm sm:text-base xl:text-lg text-gray-400 leading-relaxed">
                Accede a una red de asesores financieros listos para guiarte en cada paso de tu camino.
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 xl:p-10 rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/50 hover:border-green-500/30 transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 xl:w-20 xl:h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6 xl:mb-8">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl xl:text-2xl font-semibold text-white mb-4 xl:mb-6">Rapidez</h3>
              <p className="text-sm sm:text-base xl:text-lg text-gray-400 leading-relaxed">
                Procesos instantáneos y respuestas rápidas para que no pierdas oportunidades de inversión.
              </p>
            </div>
            
            <div className="text-center p-6 sm:p-8 xl:p-10 rounded-xl bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/50 hover:border-green-500/30 transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 xl:w-20 xl:h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 xl:mb-8">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl xl:text-2xl font-semibold text-white mb-4 xl:mb-6">Confianza</h3>
              <p className="text-sm sm:text-base xl:text-lg text-gray-400 leading-relaxed">
                Miles de usuarios confían en nosotros para gestionar sus finanzas de manera segura y eficiente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionamiento Section */}
      <section id="funcionamiento" className="py-20 sm:py-24 lg:py-28 bg-gray-900/30">
        <div className="max-w-7xl xl:max-w-[95vw] 2xl:max-w-[98vw] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">Alcanza tus Metas en 3 Simples Pasos</h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-4">
              Nuestro proceso está diseñado para ser sencillo, rápido y efectivo.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-300 to-gray-400 text-black rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-6 sm:mb-8 shadow-lg">1</div>
              <h3 className="text-lg sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Regístrate</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed px-4">
                Crea tu cuenta en menos de un minuto y completa tu perfil inicial.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-300 to-gray-400 text-black rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-6 sm:mb-8 shadow-lg">2</div>
              <h3 className="text-lg sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Conecta</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed px-4">
                Vincula tus servicios o elige las herramientas que necesitas para empezar.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-300 to-gray-400 text-black rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold mx-auto mb-6 sm:mb-8 shadow-lg">3</div>
              <h3 className="text-lg sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Crece</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed px-4">
                Monitorea tu progreso, ajusta tu estrategia y ve crecer tu patrimonio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios Section */}
      <section id="testimonios" className="py-20 sm:py-24 lg:py-28 bg-black">
        <div className="max-w-7xl xl:max-w-[95vw] 2xl:max-w-[98vw] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">Historias de Éxito Reales</h2>
            <p className="text-lg sm:text-xl text-gray-400 px-4">
              Nuestros clientes son nuestra mejor carta de presentación.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-10">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-6 sm:p-8 rounded-xl hover:border-green-500/30 transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                  LC
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="font-semibold text-white text-sm sm:text-base">Laura C.</h4>
                  <p className="text-gray-400 text-xs sm:text-sm">Emprendedora</p>
                </div>
              </div>
              <p className="text-gray-400 italic text-sm sm:text-base leading-relaxed">
                "Dezentral cambió mi perspectiva sobre el dinero. Por primera vez, siento que tengo el control total de mi futuro financiero. ¡El panel de control es increíble!"
              </p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-4 sm:p-6 rounded-xl hover:border-green-500/30 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                  MG
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="font-semibold text-white text-sm sm:text-base">Miguel G.</h4>
                  <p className="text-gray-400 text-xs sm:text-sm">Ingeniero</p>
                </div>
              </div>
              <p className="text-gray-400 italic text-sm sm:text-base leading-relaxed">
                "La facilidad de uso y la calidad de la asesoría son inigualables. Pude trazar un plan de ahorro para la educación de mis hijos que antes veía imposible."
              </p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-4 sm:p-6 rounded-xl hover:border-green-500/30 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                  SR
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="font-semibold text-white text-sm sm:text-base">Sofía R.</h4>
                  <p className="text-gray-400 text-xs sm:text-sm">Diseñadora Gráfica</p>
                </div>
              </div>
              <p className="text-gray-400 italic text-sm sm:text-base leading-relaxed">
                "Lo que más valoro es la seguridad y la transparencia. Sé que mis datos están seguros y entiendo cada movimiento. Totalmente recomendado."
              </p>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-4 sm:p-6 rounded-xl hover:border-green-500/30 transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                  AC
                </div>
                <div className="ml-3 sm:ml-4">
                  <h4 className="font-semibold text-white text-sm sm:text-base">Ana C.</h4>
                  <p className="text-gray-400 text-xs sm:text-sm">Consultora</p>
                </div>
              </div>
              <p className="text-gray-400 italic text-sm sm:text-base leading-relaxed">
                "La interfaz es intuitiva y las funcionalidades son exactamente lo que necesitaba para gestionar mis inversiones de manera profesional."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Dashboard Section */}
      <section className="py-20 sm:py-24 lg:py-28 xl:py-32 bg-gradient-to-br from-gray-900/30 via-gray-800/20 to-black">
        <div className="max-w-7xl xl:max-w-[95vw] 2xl:max-w-[98vw] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center mb-16 sm:mb-20 xl:mb-24">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-6 xl:mb-8 leading-tight">Visualiza tu Crecimiento en Tiempo Real</h2>
            <p className="text-lg sm:text-xl xl:text-2xl text-gray-400 max-w-4xl xl:max-w-5xl mx-auto leading-relaxed px-4">
              Te presentamos tu futuro panel de control. Una herramienta poderosa y fácil de usar para monitorear cada aspecto de tu prosperidad.
            </p>
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-sm border-2 border-gray-700/50 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 xl:p-12 max-w-5xl xl:max-w-6xl mx-auto">
            <div className="mb-4 sm:mb-6 xl:mb-8">
              <h3 className="text-lg sm:text-2xl xl:text-3xl font-bold text-white mb-2 xl:mb-4">Panel Principal</h3>
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 xl:w-12 xl:h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white font-semibold mr-3 text-xs sm:text-sm xl:text-base">
                  UD
                </div>
                <span className="text-gray-400 text-sm sm:text-base xl:text-lg">USUARIO DEMOSTRACIÓN</span>
              </div>
            </div>
            
            <div className="text-center mb-6 sm:mb-8 xl:mb-12">
              <h4 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 xl:mb-4">BALANCE TOTAL</h4>
              <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-green-500">$152,480.75 USD</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 xl:gap-8">
              <div className="text-center p-3 sm:p-4 xl:p-6 bg-gray-800/50 border-2 border-gray-700/50 rounded-lg">
                <p className="text-xs sm:text-sm xl:text-base text-gray-400 mb-1 xl:mb-2 font-medium">Depósitos Totales</p>
                <p className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold text-white">$185,000.00</p>
              </div>
              <div className="text-center p-3 sm:p-4 xl:p-6 bg-gray-800/50 border-2 border-gray-700/50 rounded-lg">
                <p className="text-xs sm:text-sm xl:text-base text-gray-400 mb-1 xl:mb-2 font-medium">Beneficios Totales</p>
                <p className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold text-green-400">$18,980.75</p>
              </div>
              <div className="text-center p-3 sm:p-4 xl:p-6 bg-gray-800/50 border-2 border-gray-700/50 rounded-lg">
                <p className="text-xs sm:text-sm xl:text-base text-gray-400 mb-1 xl:mb-2 font-medium">Retiros Totales</p>
                <p className="text-sm sm:text-lg lg:text-xl xl:text-2xl font-bold text-white">$51,500.00</p>
              </div>
              <div className="text-center p-3 sm:p-4 xl:p-6 bg-gray-800/50 border-2 border-gray-600/50 rounded-lg col-span-2 sm:col-span-1">
                <button
                  onClick={handleRegister}
                  className="bg-gradient-to-r from-gray-300 to-gray-400 text-black px-3 sm:px-4 xl:px-6 py-2 xl:py-3 rounded-lg font-semibold hover:shadow-lg hover:from-green-300 hover:to-green-400 transition-all duration-300 text-xs sm:text-sm xl:text-base w-full"
                >
                  Abrir mi Cuenta Gratis
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-gray-900/50 backdrop-blur-sm border-t border-gray-700/50 text-gray-400 py-12 sm:py-16">
        <div className="max-w-7xl xl:max-w-[95vw] 2xl:max-w-[98vw] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Rendimientos</h3>
              <p className="text-gray-400 mb-4 text-sm sm:text-base leading-relaxed">
                Transformando tu relación con el dinero para un futuro próspero y seguro.
              </p>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Navegación</h4>
              <ul className="space-y-2">
                <li><a href="#beneficios" className="text-gray-400 hover:text-green-400 transition-colors text-sm sm:text-base">Beneficios</a></li>
                <li><a href="#funcionamiento" className="text-gray-400 hover:text-green-400 transition-colors text-sm sm:text-base">Funcionamiento</a></li>
                <li><a href="#testimonios" className="text-gray-400 hover:text-green-400 transition-colors text-sm sm:text-base">Testimonios</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors text-sm sm:text-base">Términos y Condiciones</a></li>
                <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors text-sm sm:text-base">Política de Privacidad</a></li>
                <li><a href="#contacto" className="text-gray-400 hover:text-green-400 transition-colors text-sm sm:text-base">Contacto</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700/50 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
            <p className="text-gray-400 text-xs sm:text-sm">
              Av. Siempre Viva 123, Zapopan, Jalisco | hola@rendimientos.mx
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
