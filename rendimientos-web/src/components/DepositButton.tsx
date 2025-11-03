import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EmailService } from '../services/emailService';

interface DepositButtonProps {
  onDepositRequest?: () => void;
}

const ADMIN_EMAIL = 'admin@test.com'; // Email del administrador

export function DepositButton({ onDepositRequest }: DepositButtonProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('tarjeta');
  const [loading, setLoading] = useState(false);

  const handleDepositRequest = async () => {
    if (!depositAmount || !depositMethod) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    setLoading(true);
    
    try {
      // Enviar notificación al administrador
      EmailService.notifyAdmin(ADMIN_EMAIL, {
        userEmail: user?.email || 'Usuario no identificado',
        userName: user?.displayName || undefined,
        amount: amount,
        method: depositMethod,
        type: 'deposit',
        timestamp: new Date().toISOString()
      });
      
      alert('Solicitud de depósito enviada. El administrador será notificado y te contactará pronto.');
      setShowModal(false);
      setDepositAmount('');
      setDepositMethod('');
      
      if (onDepositRequest) {
        onDepositRequest();
      }
    } catch (error) {
      console.error('Error enviando solicitud de depósito:', error);
      alert('Error al enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón de Depósito */}
      <button
        onClick={() => setShowModal(true)}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span>+ Depósito</span>
      </button>

      {/* Modal de Solicitud de Depósito */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Realizar Depósito</h3>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a depositar *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de pago *
                </label>
                <select
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Selecciona un método</option>
                  <option value="tarjeta">Tarjeta de crédito</option>
                  <option value="transferencia">Transferencia bancaria</option>
                  <option value="efectivo">Depósito en efectivo</option>
                  <option value="cheque">Cheque</option>
                  <option value="crypto">Criptomonedas</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              {/* Información adicional */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Información
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Los depósitos se procesan en 1-3 días hábiles</li>
                        <li>Recibirá una confirmación por email</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDepositRequest}
                  disabled={loading || !depositAmount || !depositMethod}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    'Confirmar Depósito'
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
