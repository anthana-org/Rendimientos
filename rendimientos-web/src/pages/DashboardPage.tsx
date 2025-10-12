import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ContractService } from '../services/contractService';
import { RendimientosService } from '../services/rendimientosService';
import { PerformanceChart } from '../components/PerformanceChart';

interface Contract {
  id: string;
  contractType: string;
  investmentAmount: number;
  monthlyReturn: number;
  startDate: string;
  expirationDate: string;
  status: string;
}

interface Rendimiento {
  period: string;
  capital: number;
  rendimientoAmount: number;
  balance: number;
  rendimientoPercent: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [rendimientos, setRendimientos] = useState<Rendimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6M');
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [monthlyGains, setMonthlyGains] = useState(0);
  const [activeContracts, setActiveContracts] = useState(0);
  
  // Estados para modales de depósito y retiro
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('bank_transfer');
  const [withdrawalMethod, setWithdrawalMethod] = useState('bank_transfer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Limpiar mensajes automáticamente
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Cargar contratos del usuario
      const contractsResult = await ContractService.getContractsByUser(user.uid);
      if (contractsResult.success && contractsResult.data) {
        const userContracts = contractsResult.data;
        setContracts(userContracts);
        
        // Calcular métricas
        const active = userContracts.filter(c => c.status === 'active');
        setActiveContracts(active.length);
        
        const totalInv = active.reduce((sum, c) => sum + (c.investmentAmount || 0), 0);
        setTotalInvested(totalInv);
        
        // Calcular balance total con rendimientos
        let totalBal = totalInv;
        let totalGains = 0;
        
        active.forEach(contract => {
          const startDate = new Date(contract.startDate);
          const now = new Date();
          const monthsElapsed = Math.max(1, Math.ceil(
            (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
          ));
          
          const monthlyReturn = contract.monthlyReturn || 0;
          const monthlyGain = contract.investmentAmount * (monthlyReturn / 100);
          const totalGain = monthlyGain * monthsElapsed;
          
          totalGains += totalGain;
        });
        
        setTotalBalance(totalInv + totalGains);
        setMonthlyGains(totalGains);
        
        // Preparar datos para la gráfica
        const chartData = active
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
          .map((contract, index) => {
            const startDate = new Date(contract.startDate);
            const now = new Date();
            const monthsElapsed = Math.max(1, Math.ceil(
              (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
            ));
            
            const monthlyReturn = contract.monthlyReturn || 0;
            const monthlyGain = contract.investmentAmount * (monthlyReturn / 100);
            const totalGain = monthlyGain * monthsElapsed;
            
            return {
              period: `${contract.contractType} - ${startDate.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}`,
              capital: contract.investmentAmount,
              rendimientoAmount: totalGain,
              balance: contract.investmentAmount + totalGain,
              contractType: contract.contractType,
              monthlyReturn: monthlyReturn,
              monthsElapsed: monthsElapsed
            };
          });
        
        setRendimientos(chartData);
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const getROI = () => {
    if (totalInvested === 0) return 0;
    return ((totalBalance - totalInvested) / totalInvested * 100).toFixed(2);
  };

  const getMonthlyROI = () => {
    if (totalInvested === 0) return 0;
    return (monthlyGains / totalInvested * 100).toFixed(2);
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setMessage({type: 'error', text: 'Ingresa un monto válido'});
      return;
    }

    setIsProcessing(true);
    try {
      // Aquí iría la lógica real de depósito
      // Por ahora simulamos un depósito exitoso
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage({type: 'success', text: `Depósito de $${parseFloat(depositAmount).toLocaleString()} procesado exitosamente`});
      setShowDepositModal(false);
      setDepositAmount('');
      
      // Recargar datos del usuario
      await loadUserData();
    } catch (error) {
      setMessage({type: 'error', text: 'Error procesando el depósito. Intenta nuevamente.'});
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      setMessage({type: 'error', text: 'Ingresa un monto válido'});
      return;
    }

    if (parseFloat(withdrawalAmount) > totalBalance) {
      setMessage({type: 'error', text: 'No tienes suficiente balance para este retiro'});
      return;
    }

    setIsProcessing(true);
    try {
      // Aquí iría la lógica real de retiro
      // Por ahora simulamos un retiro exitoso
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage({type: 'success', text: `Retiro de $${parseFloat(withdrawalAmount).toLocaleString()} procesado exitosamente`});
      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
      
      // Recargar datos del usuario
      await loadUserData();
    } catch (error) {
      setMessage({type: 'error', text: 'Error procesando el retiro. Intenta nuevamente.'});
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        
        {/* Header con Acciones */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
              ¡Hola, {user?.email?.split('@')[0]}!
            </h1>
            <p className="text-gray-400 text-lg">Gestiona tus inversiones y rendimientos</p>
          </div>
          
          <div className="flex gap-4 mt-6 lg:mt-0">
            <button 
              onClick={() => setShowDepositModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 font-semibold flex items-center gap-2 shadow-lg hover:shadow-green-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Depósito
            </button>
            <button 
              onClick={() => setShowWithdrawalModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold flex items-center gap-2 shadow-lg hover:shadow-blue-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m16 0l-4-4m4 4l-4 4" />
              </svg>
              Retiro
            </button>
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Balance Total */}
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <span className="text-green-400 text-sm font-medium">+{getMonthlyROI()}% este mes</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-2">Balance Total</h3>
            <p className="text-3xl font-bold text-white">${totalBalance.toLocaleString()}</p>
          </div>

          {/* Total Invertido */}
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-2">Total Invertido</h3>
            <p className="text-3xl font-bold text-white">${totalInvested.toLocaleString()}</p>
          </div>

          {/* Ganancias Totales */}
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-green-400 text-sm font-medium">+{getROI()}% ROI</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-2">Ganancias Totales</h3>
            <p className="text-3xl font-bold text-white">${monthlyGains.toLocaleString()}</p>
          </div>

          {/* Contratos Activos */}
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-2">Contratos Activos</h3>
            <p className="text-3xl font-bold text-white">{activeContracts}</p>
          </div>
        </div>

        {/* Gráfica de Rendimientos */}
        {rendimientos.length > 0 && (
          <div className="mb-8">
            <PerformanceChart 
              data={rendimientos}
              height={500}
            />
          </div>
        )}

        {/* Tabla de Contratos */}
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700/50">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Mis Contratos ({contracts.length})
            </h3>
          </div>
          
          {contracts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Tipo</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Monto</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Rendimiento</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Inicio</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Vencimiento</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Días Restantes</th>
                    <th className="text-left py-4 px-6 text-gray-400 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => {
                    const now = new Date();
                    const expirationDate = new Date(contract.expirationDate);
                    const timeDiff = expirationDate.getTime() - now.getTime();
                    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                    
                    return (
                      <tr key={contract.id} className="border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors">
                        <td className="py-4 px-6 text-white font-medium">{contract.contractType}</td>
                        <td className="py-4 px-6 text-white">${contract.investmentAmount?.toLocaleString() || 'N/A'}</td>
                        <td className="py-4 px-6 text-green-400 font-bold">{contract.monthlyReturn || 0}%</td>
                        <td className="py-4 px-6 text-gray-300">{new Date(contract.startDate).toLocaleDateString('es-MX')}</td>
                        <td className="py-4 px-6 text-gray-300">{new Date(contract.expirationDate).toLocaleDateString('es-MX')}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            daysRemaining > 30 ? 'bg-green-500/20 text-green-400' :
                            daysRemaining > 7 ? 'bg-yellow-500/20 text-yellow-400' :
                            daysRemaining > 0 ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {daysRemaining > 0 ? `${daysRemaining} días` : 
                             daysRemaining === 0 ? 'Hoy' : 
                             `${Math.abs(daysRemaining)} días vencido`}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            contract.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            contract.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {contract.status === 'active' ? 'Activo' : 
                             contract.status === 'inactive' ? 'Inactivo' : 'Vencido'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">No tienes contratos aún</h4>
              <p className="text-gray-400 mb-6">Comienza invirtiendo para ver tus rendimientos aquí</p>
              <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 font-semibold">
                Crear Primera Inversión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Depósito */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Realizar Depósito</h2>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monto a depositar
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Método de pago
                  </label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="bank_transfer">Transferencia bancaria</option>
                    <option value="credit_card">Tarjeta de crédito</option>
                    <option value="debit_card">Tarjeta de débito</option>
                    <option value="crypto">Criptomonedas</option>
                  </select>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-blue-400 font-medium">Información</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Los depósitos se procesan en 1-3 días hábiles. Recibirás una confirmación por email.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleDeposit}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Procesando...
                      </div>
                    ) : (
                      'Confirmar Depósito'
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowDepositModal(false)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Retiro */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Realizar Retiro</h2>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-green-400 font-medium">Balance Disponible</span>
                  </div>
                  <p className="text-white text-2xl font-bold">${totalBalance.toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monto a retirar
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder="0.00"
                      max={totalBalance}
                      className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Método de retiro
                  </label>
                  <select
                    value={withdrawalMethod}
                    onChange={(e) => setWithdrawalMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="bank_transfer">Transferencia bancaria</option>
                    <option value="debit_card">Tarjeta de débito</option>
                    <option value="crypto">Criptomonedas</option>
                  </select>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-yellow-400 font-medium">Importante</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Los retiros pueden tardar 2-5 días hábiles en procesarse. Se aplicarán las comisiones correspondientes.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleWithdrawal}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-300"
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Procesando...
                      </div>
                    ) : (
                      'Confirmar Retiro'
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowWithdrawalModal(false)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificación de mensaje */}
      {message && (
        <div className="fixed top-4 right-4 z-50 animate-slideIn">
          <div className={`px-6 py-4 rounded-xl shadow-lg border ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}