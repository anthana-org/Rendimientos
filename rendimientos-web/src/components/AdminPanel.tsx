import React, { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { ContractService } from '../services/contractService';
import { RendimientoGenerator } from '../services/rendimientoGenerator';
import { RendimientosService } from '../services/rendimientosService';

interface User {
  uid: string;
  email: string;
  createdAt: string;
  isAdmin?: boolean;
}

export const AdminPanel: React.FC = () => {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: ''
  });

  const [newContract, setNewContract] = useState({
    amount: '',
    startDate: '',
    endDate: '',
    status: 'active',
    rendimiento: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File[]}>({});
  const [selectedUserContracts, setSelectedUserContracts] = useState<any[]>([]);
  const [showUserContracts, setShowUserContracts] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [showContractDetails, setShowContractDetails] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      console.log('Usuarios cargados, iniciando generación de contratos...');
      initializeContracts().then(() => {
        console.log('Contratos inicializados, generando rendimientos...');
        // Después de crear contratos, generar rendimientos
        RendimientoGenerator.generateRendimientosForAllUsers().then(result => {
          console.log('Resultado de generación de rendimientos:', result);
          if (result.success && result.generated && result.generated > 0) {
            console.log(`✅ Generados ${result.generated} rendimientos automáticamente`);
          } else {
            console.log('⚠️ No se generaron rendimientos:', result.error);
          }
        });
      });
    }
  }, [users]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await UserService.getAllUsers();
      
      if (Array.isArray(response)) {
        setUsers(response);
      } else if (response && Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (err: any) {
      setError('Error cargando usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newUser.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await UserService.createUser(newUser.email, newUser.password);
      setSuccess('Usuario creado exitosamente');
      setNewUser({ email: '', password: '' });
      setShowCreateUser(false);
      loadUsers(); // Recargar lista de usuarios
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.uid));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = selectedUsers.includes(userId) 
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    
    setSelectedUsers(newSelected);
  };


  const handleCreateContractClick = () => {
    if (selectedUsers.length > 0) {
      setShowCreateContract(true);
    }
  };

  const handleViewUserContracts = async (user: User) => {
    try {
      const result = await ContractService.getContractsByUser(user.uid);
      if (result.success && result.data) {
        setSelectedUserContracts(result.data);
        setShowUserContracts(true);
      }
    } catch (error) {
      console.error('Error cargando contratos del usuario:', error);
    }
  };

  const handleViewContractDetails = (contract: any) => {
    setSelectedContract(contract);
    setShowContractDetails(true);
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
      setError('Selecciona al menos un usuario');
      return;
    }

    if (!newContract.amount || !newContract.startDate || !newContract.endDate || !newContract.rendimiento) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (parseFloat(newContract.amount) <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (parseFloat(newContract.rendimiento) <= 0 || parseFloat(newContract.rendimiento) > 100) {
      setError('El rendimiento debe estar entre 0.01% y 100%');
      return;
    }

    if (new Date(newContract.startDate) >= new Date(newContract.endDate)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Crear contratos en Firebase para cada usuario seleccionado
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const userId of selectedUsers) {
        const user = users.find(u => u.uid === userId);
        if (!user) continue;

        const contractData = {
          userId: userId,
          userEmail: user.email,
          contractType: 'Inversión Mensual',
          startDate: newContract.startDate,
          expirationDate: newContract.endDate,
          investmentAmount: parseFloat(newContract.amount),
          monthlyReturn: parseFloat(newContract.rendimiento),
          status: newContract.status as 'active' | 'inactive' | 'expired',
          lastNotification: ''
        };

        const result = await ContractService.createContract(contractData);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`${user.email}: ${result.error}`);
        }
      }

      const totalFiles = Object.values(uploadedFiles).reduce((acc, files) => acc + files.length, 0);
      
      if (successCount > 0) {
        setSuccess(`✅ ${successCount} contratos creados exitosamente${totalFiles > 0 ? ` con ${totalFiles} documento(s) PDF` : ''}${errorCount > 0 ? `. ${errorCount} errores.` : ''}`);
      }
      
      if (errorCount > 0 && successCount === 0) {
        setError(`Error creando contratos: ${errors.join(', ')}`);
      }

      // Limpiar formulario solo si hay al menos un éxito
      if (successCount > 0) {
        setNewContract({ amount: '', startDate: '', endDate: '', status: 'active', rendimiento: '' });
        setUploadedFiles({});
        setSelectedUsers([]);
        setShowCreateContract(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear contratos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContractInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewContract(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (userId: string, files: FileList | null) => {
    if (files) {
      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      if (pdfFiles.length > 0) {
        setUploadedFiles(prev => ({
          ...prev,
          [userId]: pdfFiles
        }));
      }
    }
  };

  const removeFile = (userId: string, fileIndex: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      [userId]: prev[userId]?.filter((_, index) => index !== fileIndex) || []
    }));
  };

  const initializeContracts = async (force = false) => {
    if (users.length === 0) {
      console.log('No hay usuarios para crear contratos');
      return;
    }

    try {
      if (!force) {
        console.log(`Verificando contratos existentes para ${users.length} usuarios...`);
        // Verificar si ya existen contratos para evitar duplicados
        const contractsResult = await ContractService.getAllContracts();
        console.log('Contratos existentes:', contractsResult.data?.length || 0);
        
        if (contractsResult.success && contractsResult.data && contractsResult.data.length > 0) {
          console.log('Ya existen contratos, no se crearán más');
          return; // Ya hay contratos, no crear más
        }
      } else {
        console.log('Modo forzado: creando contratos sin verificar existentes');
      }

      console.log('Creando 20 contratos por cada usuario...');
      let totalCreated = 0;
      
      // Generar 20 contratos por cada usuario
      for (const user of users) {
        console.log(`Creando contratos para usuario: ${user.email}`);
        for (let i = 1; i <= 20; i++) {
          // Fechas aleatorias en los últimos 12 meses
          const now = new Date();
          const startDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
          const endDate = new Date(startDate.getTime() + (30 + Math.random() * 330) * 24 * 60 * 60 * 1000);

          // Montos aleatorios entre $10,000 y $500,000
          const amount = 10000 + Math.random() * 490000;
          
          // Rendimientos aleatorios entre 1% y 8%
          const rendimiento = 1 + Math.random() * 7;

          const contractData = {
            userId: user.uid,
            userEmail: user.email,
            contractType: `Inversión ${i}`,
            startDate: startDate.toISOString().split('T')[0],
            expirationDate: endDate.toISOString().split('T')[0],
            investmentAmount: Math.round(amount),
            monthlyReturn: parseFloat(rendimiento.toFixed(2)),
            status: 'active' as const,
            lastNotification: ''
          };

          const result = await ContractService.createContract(contractData);
          if (result.success) {
            totalCreated++;
          } else {
            console.error(`Error creando contrato ${i} para ${user.email}:`, result.error);
          }
        }
      }
      
      console.log(`✅ Creados ${totalCreated} contratos en total`);
    } catch (err: any) {
      console.error('Error inicializando contratos:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
          <button
            onClick={() => setShowCreateUser(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
          >
            Crear Usuario
          </button>
        </div>

        {/* Users List */}
        <div className="bg-gray-900 rounded-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                Usuarios Activos ({filteredUsers.length})
                {filteredUsers.length !== users.length && (
                  <span className="text-gray-400 text-sm ml-2">
                    de {users.length} total
                  </span>
                )}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  {selectedUsers.length === filteredUsers.length ? 'Deseleccionar' : 'Seleccionar'} Todos
                </button>
                {selectedUsers.length > 0 && (
                  <button
                    onClick={handleCreateContractClick}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Crear Contrato ({selectedUsers.length})
                  </button>
                )}
              </div>
            </div>
            
            {/* Search */}
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          
          <div className="p-6">
            {loadingUsers ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Cargando usuarios...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-3">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.uid} 
                    className={`p-4 rounded-lg transition-colors ${
                      selectedUsers.includes(user.uid) 
                        ? 'bg-green-500/20 border border-green-500/50' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.uid)}
                          onChange={() => handleSelectUser(user.uid)}
                          className="w-4 h-4 text-green-600 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                        />
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.email}</p>
                          <p className="text-gray-400 text-sm">
                            Creado: {new Date(user.createdAt).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleViewUserContracts(user)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Ver Historial
                        </button>
                        {user.isAdmin && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No hay usuarios registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Crear Usuario</h2>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <input
                type="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg"
                placeholder="Email"
              />

              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg"
                placeholder="Contraseña"
              />


              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {isLoading ? 'Creando...' : 'Crear'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Contract Modal */}
      {showCreateContract && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Crear Contrato</h2>
              <p className="text-gray-400 text-sm mt-1">
                Para {selectedUsers.length} usuario{selectedUsers.length > 1 ? 's' : ''} seleccionado{selectedUsers.length > 1 ? 's' : ''}
              </p>
            </div>
            
            <form onSubmit={handleCreateContract} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Monto (MXN)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={newContract.amount}
                  onChange={handleContractInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg"
                  placeholder="100000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={newContract.startDate}
                  onChange={handleContractInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={newContract.endDate}
                  onChange={handleContractInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rendimiento Mensual (%)
                </label>
                <input
                  type="number"
                  name="rendimiento"
                  value={newContract.rendimiento}
                  onChange={handleContractInputChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg"
                  placeholder="5.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  name="status"
                  value={newContract.status}
                  onChange={handleContractInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>

              {/* PDF Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Documentos PDF por Usuario
                </label>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedUsers.map((userId) => {
                    const user = users.find(u => u.uid === userId);
                    return (
                      <div key={userId} className="bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white text-sm font-medium">{user?.email}</span>
                          <span className="text-gray-400 text-xs">
                            {uploadedFiles[userId]?.length || 0} archivo(s)
                          </span>
                        </div>
                        
                        <input
                          type="file"
                          accept=".pdf"
                          multiple
                          onChange={(e) => handleFileUpload(userId, e.target.files)}
                          className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                        />
                        
                        {uploadedFiles[userId] && uploadedFiles[userId].length > 0 && (
                          <div className="mt-2 space-y-1">
                            {uploadedFiles[userId].map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-700 rounded px-2 py-1">
                                <span className="text-white text-xs truncate">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => removeFile(userId, index)}
                                  className="text-red-400 hover:text-red-300 ml-2"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creando...' : 'Crear Contratos'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateContract(false);
                    setError(null);
                    setSuccess(null);
                    setNewContract({ amount: '', startDate: '', endDate: '', status: 'active', rendimiento: '' });
                    setUploadedFiles({});
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Contracts Modal */}
      {showUserContracts && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Historial de Contratos</h2>
                  <p className="text-gray-400">Contratos del usuario</p>
                </div>
                <button
                  onClick={() => setShowUserContracts(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {selectedUserContracts.length > 0 ? (
                <div className="space-y-4">
                  {selectedUserContracts.map((contract, index) => (
                    <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-green-500/30 transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-white font-semibold">{contract.contractType}</p>
                              <p className="text-gray-400 text-sm">ID: {contract.id}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="bg-gray-700/50 rounded-lg p-3">
                              <p className="text-gray-400 text-xs">Monto Inicial</p>
                              <p className="text-white font-bold">${contract.investmentAmount?.toLocaleString() || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-700/50 rounded-lg p-3">
                              <p className="text-gray-400 text-xs">Rendimiento</p>
                              <p className="text-green-400 font-bold">{contract.monthlyReturn || 0}%</p>
                            </div>
                            <div className="bg-gray-700/50 rounded-lg p-3">
                              <p className="text-gray-400 text-xs">Inicio</p>
                              <p className="text-white font-bold">{contract.startDate}</p>
                            </div>
                            <div className="bg-gray-700/50 rounded-lg p-3">
                              <p className="text-gray-400 text-xs">Vencimiento</p>
                              <p className="text-white font-bold">{contract.expirationDate}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              contract.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              contract.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {contract.status === 'active' ? 'Activo' : 
                               contract.status === 'inactive' ? 'Inactivo' : 'Vencido'}
                            </span>
                            <button
                              onClick={() => handleViewContractDetails(contract)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Ver Detalles
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg">No hay contratos registrados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contract Details Modal */}
      {showContractDetails && selectedContract && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Detalles del Contrato</h2>
                  <p className="text-gray-400">{selectedContract.contractType}</p>
                </div>
                <button
                  onClick={() => setShowContractDetails(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Información del Contrato */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Información del Contrato</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">ID del Contrato</p>
                    <p className="text-white font-medium">{selectedContract.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Tipo</p>
                    <p className="text-white font-medium">{selectedContract.contractType}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Monto Inicial</p>
                    <p className="text-white font-medium">${selectedContract.investmentAmount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Rendimiento Mensual</p>
                    <p className="text-green-400 font-medium">{selectedContract.monthlyReturn}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Fecha de Inicio</p>
                    <p className="text-white font-medium">{selectedContract.startDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Fecha de Vencimiento</p>
                    <p className="text-white font-medium">{selectedContract.expirationDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Estado</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedContract.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      selectedContract.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {selectedContract.status === 'active' ? 'Activo' : 
                       selectedContract.status === 'inactive' ? 'Inactivo' : 'Vencido'}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Días Restantes</p>
                    <p className="text-white font-medium">{selectedContract.remainingDays || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Sección de PDFs */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Documentos PDF</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-white">Contrato_Inversion_1.pdf</span>
                    </div>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Ver
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-white">Anexos_Financieros.pdf</span>
                    </div>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Ver
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-gray-400 text-sm">Subir nuevo documento</p>
                    <input type="file" accept=".pdf" className="hidden" id="upload-pdf" />
                    <label htmlFor="upload-pdf" className="inline-block mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm cursor-pointer">
                      Seleccionar PDF
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowContractDetails(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};