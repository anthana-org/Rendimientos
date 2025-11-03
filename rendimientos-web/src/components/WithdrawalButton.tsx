import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EmailService } from '../services/emailService';

interface WithdrawalButtonProps {
  onWithdrawalRequest?: () => void;
  availableBalance?: number;
}

const ADMIN_EMAIL = 'admin@test.com'; // Email del administrador

export function WithdrawalButton({ onWithdrawalRequest, availableBalance = 0 }: WithdrawalButtonProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('transferencia');
  const [loading, setLoading] = useState(false);

  const handleWithdrawalRequest = async () => {
    if (!withdrawalAmount) {
      alert('Por favor ingresa el monto a retirar');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    if (availableBalance > 0 && amount > availableBalance) {
      alert('El monto a retirar no puede ser mayor al balance disponible');
      return;
    }

    setLoading(true);
    
    try {
      // Enviar notificación al administrador
      EmailService.notifyAdmin(ADMIN_EMAIL, {
        userEmail: user?.email || 'Usuario no identificado',
        userName: user?.displayName || undefined,
        amount: amount,
        method: withdrawalMethod,
        type: 'withdrawal',
        timestamp: new Date().toISOString()
      });
      
      alert('Solicitud de retiro enviada. El administrador será notificado y te contactará pronto.');
      setShowModal(false);
      setWithdrawalAmount('');
      
      if (onWithdrawalRequest) {
        onWithdrawalRequest();
      }
    } catch (error) {
      console.error('Error enviando solicitud de retiro:', error);
      alert('Error al enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón de Solicitar Retiro */}
      <button
        onClick={() => setShowModal(true)}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        <span>Solicitar Retiro</span>
      </button>

      {/* Modal de Solicitud de Retiro */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Realizar Retiro</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Balance Disponible */}
              {availableBalance > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Balance Disponible</span>
                    <span className="text-xl font-bold text-green-900">
                      ${availableBalance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a retirar
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                    max={availableBalance > 0 ? availableBalance : undefined}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de retiro
                </label>
                <select
                  value={withdrawalMethod}
                  onChange={(e) => setWithdrawalMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="transferencia">Transferencia bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="cheque">Cheque</option>
                  <option value="crypto">Criptomonedas</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Advertencia importante */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Importante
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>Los retiros pueden tardar 2-5 días hábiles en procesarse. Se aplicarán las comisiones correspondientes.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleWithdrawalRequest}
                  disabled={loading || !withdrawalAmount}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    'Confirmar Retiro'
                  )}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
