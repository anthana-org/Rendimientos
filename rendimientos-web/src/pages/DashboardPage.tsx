import { SimpleRendimientosTable } from '../components/SimpleRendimientosTable';
import { useContractsTotal } from '../hooks/useContractsTotal';
import { WithdrawalButton } from '../components/WithdrawalButton';
import { DepositButton } from '../components/DepositButton';

export default function DashboardPage() {
  const { totalAmount, loading: contractsLoading } = useContractsTotal();

  return (
    <div className="bg-black min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-6 sm:space-y-8 lg:space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-6 sm:gap-8 lg:gap-10 mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-8">
            <DepositButton />
            <WithdrawalButton />
          </div>
        </div>

        {/* Gráfica Principal - Prioridad */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 xl:p-16 border-2 border-gray-700/50 hover:border-green-400 hover:shadow-green-500/20 hover:shadow-3xl hover:-translate-y-1 transition-all duration-500 ease-out mt-8 sm:mt-12 lg:mt-16 mb-8 sm:mb-12 lg:mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10 lg:mb-12 gap-6 sm:gap-8">
            <div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 sm:mb-3 lg:mb-4">Rendimiento Mensual</h3>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-400">Evolución de tu patrimonio en el tiempo</p>
            </div>
            <div className="flex space-x-3 sm:space-x-4 lg:space-x-6">
              <button className="px-8 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30 text-base sm:text-lg lg:text-xl font-medium hover:bg-green-500/30 hover:border-green-400 hover:text-green-300 hover:scale-105 transition-all duration-300 ease-out shadow-lg hover:shadow-green-500/25">
                6M
              </button>
              <button className="px-8 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 bg-dark-bgTertiary text-gray-400 rounded-xl border border-gray-700/50 text-base sm:text-lg lg:text-xl font-medium hover:bg-gray-900/50 backdrop-blur-sm hover:text-white hover:border-green-500/50 hover:scale-105 transition-all duration-300 ease-out">
                1A
              </button>
              <button className="px-8 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 bg-dark-bgTertiary text-gray-400 rounded-xl border border-gray-700/50 text-base sm:text-lg lg:text-xl font-medium hover:bg-gray-900/50 backdrop-blur-sm hover:text-white hover:border-green-500/50 hover:scale-105 transition-all duration-300 ease-out">
                Todo
              </button>
            </div>
          </div>
          
          <div className="h-80 sm:h-96 lg:h-[32rem] xl:h-[40rem] flex items-center justify-center bg-gradient-to-br from-dark-bgTertiary to-dark-bg rounded-2xl sm:rounded-3xl border-2 border-gray-700/50 hover:border-green-400/50 transition-all duration-500">
            <div className="text-center px-8">
              <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 bg-gradient-green rounded-full flex items-center justify-center mx-auto mb-8 sm:mb-12 animate-pulse hover:animate-none hover:scale-110 hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-500 ease-out">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-4 hover:text-green-400 transition-colors duration-300">Gráfico de Rendimiento</h4>
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 mb-2">Visualización interactiva de tu crecimiento</p>
              <p className="text-sm sm:text-base lg:text-lg text-dark-textMuted animate-pulse">Próximamente disponible</p>
            </div>
          </div>
        </div>

        {/* Balance Total - Elemento Principal */}
        <div className="bg-gradient-to-br from-dark-bgSecondary via-dark-bgTertiary to-dark-bgSecondary rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 xl:p-16 border-4 border-gray-700/50 hover:border-green-400 hover:shadow-green-500/20 hover:shadow-3xl hover:-translate-y-1 transition-all duration-500 ease-out ring-2 ring-dark-borderLight hover:ring-green-400/30 mt-8 sm:mt-12 lg:mt-16 mb-8 sm:mb-12 lg:mb-16">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold text-gray-400 mb-2 sm:mb-3">Balance Total</h2>
            <div className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl 2xl:text-[10rem] font-bold text-white mb-2 sm:mb-3 hover:text-green-400 transition-colors duration-500 cursor-default">$385,000</div>
            <div className="flex items-center justify-center space-x-4 sm:space-x-8">
              <span className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-green-400 font-semibold">+17.0%</span>
              <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl text-gray-400">este mes</span>
            </div>
          </div>
          
          {/* Métricas principales en fila */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-4 sm:p-6 lg:p-8 bg-gray-900/50 backdrop-blur-sm/50 rounded-xl sm:rounded-2xl border border-gray-700/50">
              <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2">$235,000</div>
              <div className="text-sm sm:text-base lg:text-lg text-gray-400 mb-1">Rendimiento Total</div>
              <div className="text-green-400 font-semibold text-base sm:text-lg lg:text-xl">+7.4%</div>
            </div>
            
            <div className="text-center p-4 sm:p-6 lg:p-8 bg-gray-900/50 backdrop-blur-sm/50 rounded-xl sm:rounded-2xl border border-gray-700/50">
              <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2">$150,000</div>
              <div className="text-sm sm:text-base lg:text-lg text-gray-400 mb-1">Balance Actual</div>
              <div className="text-green-400 font-semibold text-base sm:text-lg lg:text-xl">+9.2%</div>
            </div>
            
            <div className="text-center p-4 sm:p-6 lg:p-8 bg-gray-900/50 backdrop-blur-sm/50 rounded-xl sm:rounded-2xl border border-gray-700/50 sm:col-span-2 lg:col-span-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2">12</div>
              <div className="text-sm sm:text-base lg:text-lg text-gray-400 mb-1">Inversiones Activas</div>
              <div className="text-green-400 font-semibold text-base sm:text-lg lg:text-xl">+8.1%</div>
            </div>
          </div>
        </div>


        {/* Estadísticas Secundarias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mt-8 sm:mt-12 lg:mt-16 mb-8 sm:mb-12 lg:mb-16">
          {/* Estadísticas Rápidas */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 border-2 border-gray-700/50 hover:border-green-400 hover:shadow-green-500/20 hover:-translate-y-1 transition-all duration-500 ease-out">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-5 lg:mb-6">Estadísticas Rápidas</h3>
            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
              <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 bg-green-500/10 border border-green-500/30 rounded-lg sm:rounded-xl hover:bg-green-500/15 hover:border-green-400/50 hover:scale-[1.02] transition-all duration-300 ease-out">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm sm:text-base lg:text-lg">Mejor mes</p>
                    <p className="text-gray-400 text-xs sm:text-sm">Diciembre 2024</p>
                  </div>
                </div>
                <span className="text-green-400 font-bold text-lg sm:text-xl">+12.5%</span>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl sm:rounded-2xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm sm:text-base lg:text-lg">Promedio mensual</p>
                    <p className="text-gray-400 text-xs sm:text-sm">Últimos 12 meses</p>
                  </div>
                </div>
                <span className="text-blue-400 font-bold text-lg sm:text-xl">+8.2%</span>
              </div>

              <div className="flex items-center justify-between p-4 sm:p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl sm:rounded-2xl">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm sm:text-base lg:text-lg">Tiempo activo</p>
                    <p className="text-gray-400 text-xs sm:text-sm">Desde el inicio</p>
                  </div>
                </div>
                <span className="text-purple-400 font-bold text-lg sm:text-xl">24 meses</span>
              </div>
            </div>
          </div>

          {/* Métricas Adicionales */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border-2 border-gray-700/50 hover:border-green-500/30 transition-all duration-300">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8">Métricas Adicionales</h3>
            <div className="space-y-4 sm:space-y-6">
              <div className="p-4 sm:p-6 bg-dark-bgTertiary/50 rounded-xl sm:rounded-2xl border border-gray-700/50">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-gray-400 font-medium text-sm sm:text-base">Total Contratos</span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  {contractsLoading ? "Cargando..." : `$${totalAmount.toLocaleString()}`}
                </div>
                <div className="text-green-400 font-semibold text-xs sm:text-sm">+0% este mes</div>
              </div>

              <div className="p-4 sm:p-6 bg-dark-bgTertiary/50 rounded-xl sm:rounded-2xl border border-gray-700/50">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-gray-400 font-medium text-sm sm:text-base">Rendimiento %</span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M18 14v4h-4m6 0l-4-4" />
                    </svg>
                  </div>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">17.0%</div>
                <div className="text-green-400 font-semibold text-xs sm:text-sm">+6.6% este mes</div>
              </div>

              <div className="p-4 sm:p-6 bg-dark-bgTertiary/50 rounded-xl sm:rounded-2xl border border-gray-700/50">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-gray-400 font-medium text-sm sm:text-base">ROI Promedio</span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">23.4%</div>
                <div className="text-green-400 font-semibold text-xs sm:text-sm">+2.1% este mes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla Detallada */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-gray-700/50 hover:border-green-500/30 transition-all duration-300 overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-700/50">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Rendimientos Detallados</h3>
            <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Historial completo de tus inversiones</p>
          </div>
          <div className="p-4 sm:p-6 lg:p-8">
            <SimpleRendimientosTable />
          </div>
        </div>
      </div>
    </div>
  );
}
