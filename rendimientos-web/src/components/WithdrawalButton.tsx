import { useState } from 'react';

interface WithdrawalButtonProps {
  onWithdrawalRequest?: () => void;
}

export function WithdrawalButton({ onWithdrawalRequest }: WithdrawalButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdrawalRequest = async () => {
    if (!withdrawalAmount || !withdrawalReason) {
      alert('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    
    try {
      // Aquí se implementaría la lógica para procesar la solicitud de retiro
      console.log('Solicitud de retiro:', {
        amount: withdrawalAmount,
        reason: withdrawalReason,
        timestamp: new Date().toISOString()
      });
      
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Solicitud de retiro enviada exitosamente. Te contactaremos pronto.');
      setShowModal(false);
      setWithdrawalAmount('');
      setWithdrawalReason('');
      
      if (onWithdrawalRequest) {
        onWithdrawalRequest();
      }
    } catch (error) {
      console.error('Error procesando solicitud de retiro:', error);
      alert('Error al procesar la solicitud. Inténtalo de nuevo.');
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
              <h3 className="text-xl font-semibold text-gray-900">Solicitar Retiro</h3>
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
                  Monto a retirar (MXN)
                </label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="Ingresa el monto"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  min="1"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del retiro
                </label>
                <select
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Selecciona un motivo</option>
                  <option value="emergency">Emergencia médica</option>
                  <option value="personal">Necesidad personal</option>
                  <option value="investment">Reinversión en otro proyecto</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              {withdrawalReason === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Especifica el motivo
                  </label>
                  <textarea
                    value={withdrawalReason}
                    onChange={(e) => setWithdrawalReason(e.target.value)}
                    placeholder="Describe el motivo específico"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={3}
                  />
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Información importante
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>El procesamiento puede tomar 3-5 días hábiles</li>
                        <li>Se aplicarán las comisiones correspondientes</li>
                        <li>Recibirás confirmación por email</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleWithdrawalRequest}
                  disabled={loading || !withdrawalAmount || !withdrawalReason}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    'Enviar Solicitud'
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
