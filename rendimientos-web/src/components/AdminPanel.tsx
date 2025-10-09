import { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { RendimientosService } from '../services/rendimientosService';
import { AdminAuthService } from '../services/adminAuthService';
import { ContractService } from '../services/contractService';
import { GlobalRendimientoForm } from './GlobalRendimientoForm';
import { AddRendimientoForm } from './AddRendimientoForm';
import { BulkUserUpload } from './BulkUserUpload';
import { BulkContractsUpload } from './BulkContractsUpload';

interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt?: any;
}

interface Rendimiento {
  id: string;
  uid: string;
  periodo: string;
  capital: number;
  rendimiento_pct: number;
  rendimiento_mxn: number;
  balance: number;
  notas?: string;
  createdAt?: any;
}

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rendimientos, setRendimientos] = useState<Rendimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para crear usuario
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Estados para pestañas
  const [activeTab, setActiveTab] = useState<'users' | 'contracts' | 'global'>('users');
  
  // Estados para contratos
  const [contractExpirations, setContractExpirations] = useState<any[]>([]);
  const [contractsPerPage, setContractsPerPage] = useState<number>(10);
  
  // Estados para formulario de rendimiento
  const [showAddRendimientoForm, setShowAddRendimientoForm] = useState(false);

  useEffect(() => {
    loadUsers();
    loadContractExpirations();
  }, []);

  useEffect(() => {
    // Filtrar usuarios basado en el término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [users, searchTerm]);

  useEffect(() => {
    if (selectedUser) {
      loadUserRendimientos(selectedUser.uid);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await UserService.getAllUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        setError(result.error || 'Error cargando usuarios');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const loadUserRendimientos = async (uid: string) => {
    try {
      const result = await RendimientosService.getRendimientosByUser(uid);
      if (result.success && result.data) {
        setRendimientos(result.data as Rendimiento[]);
      } else {
        setError(result.error || 'Error cargando rendimientos');
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando rendimientos');
    }
  };

  const loadContractExpirations = async () => {
    try {
      setLoading(true);
      
      // Primero cargar usuarios desde Firebase
      const usersResult = await UserService.getAuthUsers();
      if (!usersResult.success || !usersResult.data) {
        console.warn('No se pudieron cargar usuarios:', usersResult.error);
        setContractExpirations([]);
        return;
      }

      // Luego cargar contratos desde Firebase
      const contractsResult = await ContractService.getAllContracts();
      if (!contractsResult.success || !contractsResult.data) {
        console.warn('No se pudieron cargar contratos:', contractsResult.error);
        setContractExpirations([]);
        return;
      }

      // Combinar información de usuarios con contratos
      const enrichedContracts = contractsResult.data.map(contract => {
        const user = usersResult.data?.find(u => u.uid === contract.userId);
        return {
          ...contract,
          userEmail: user?.email || contract.userEmail,
          userName: user?.displayName || user?.email || contract.userEmail,
          userPhone: user?.phoneNumber || '',
          userCreatedAt: user?.createdAt || ''
        };
      });

      setContractExpirations(enrichedContracts);
      console.log('✅ Contratos cargados con información de usuarios:', enrichedContracts.length);
      
      if (enrichedContracts.length === 0) {
        setSuccessMessage('ℹ️ No hay contratos registrados. Usa "Rendimiento Global" para crear contratos automáticamente.');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err: any) {
      console.error('❌ Error cargando contratos:', err);
      setError('Error cargando datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) {
      setError('Email y contraseña son requeridos');
      return;
    }

    if (newUserPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await AdminAuthService.createUser({
        email: newUserEmail,
        password: newUserPassword
      });

      if (result.success) {
        setNewUserEmail('');
        setNewUserPassword('');
        setShowCreateUser(false);
        setError(null);
        
        // Mostrar mensaje de éxito
        if (result.requiresReauth) {
          setSuccessMessage(`✅ Usuario ${newUserEmail} creado exitosamente. Necesitas volver a iniciar sesión como administrador.`);
        } else {
          setSuccessMessage(`✅ Usuario ${newUserEmail} creado exitosamente.`);
        }
        
        // Limpiar mensaje de éxito después de 5 segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        setError(result.error || 'Error creando usuario');
      }
    } catch (err: any) {
      setError(err.message || 'Error creando usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleRendimientoSuccess = async () => {
    setShowAddRendimientoForm(false);
    if (selectedUser) {
      await loadUserRendimientos(selectedUser.uid);
    }
    setSuccessMessage('✅ Rendimiento agregado exitosamente');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-b-4 border-green-500 mx-auto mb-6"></div>
          <p className="text-lg sm:text-xl text-white font-semibold">Cargando panel de administración...</p>
          <p className="text-dark-textSecondary mt-2">Preparando datos del sistema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-12 lg:space-y-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-dark-bgSecondary via-dark-bgTertiary to-dark-bgSecondary rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 xl:p-16 border-4 border-dark-border hover:border-green-400 hover:shadow-green-500/20 hover:shadow-3xl hover:-translate-y-1 transition-all duration-500 ease-out ring-2 ring-dark-borderLight hover:ring-green-400/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-8">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-3">Panel de Administración</h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-dark-textSecondary">Gestiona usuarios, rendimientos y proyecciones financieras</p>
          </div>
          <button
            onClick={() => setShowCreateUser(true)}
            className="bg-gradient-silver text-white px-8 py-4 sm:px-10 sm:py-5 lg:px-12 lg:py-6 rounded-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 font-bold text-lg sm:text-xl shadow-lg"
          >
            <svg className="w-6 h-6 inline mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Crear Usuario
          </button>
        </div>
      </div>

      {/* Pestañas */}
      <div className="bg-dark-bgSecondary rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-dark-border overflow-hidden">
        <nav className="flex flex-wrap">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-4 px-6 text-center font-bold text-lg sm:text-xl transition-all duration-300 ${
              activeTab === 'users'
                ? 'bg-green-500/20 text-green-400 border-b-4 border-green-400'
                : 'text-dark-textSecondary hover:text-white hover:bg-dark-bgTertiary'
            }`}
          >
            <svg className="w-6 h-6 inline mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Gestión de Usuarios
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex-1 py-4 px-6 text-center font-bold text-lg sm:text-xl transition-all duration-300 ${
              activeTab === 'contracts'
                ? 'bg-green-500/20 text-green-400 border-b-4 border-green-400'
                : 'text-dark-textSecondary hover:text-white hover:bg-dark-bgTertiary'
            }`}
          >
            <svg className="w-6 h-6 inline mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Todos los Contratos
          </button>
          <button
            onClick={() => setActiveTab('global')}
            className={`flex-1 py-4 px-6 text-center font-bold text-lg sm:text-xl transition-all duration-300 ${
              activeTab === 'global'
                ? 'bg-green-500/20 text-green-400 border-b-4 border-green-400'
                : 'text-dark-textSecondary hover:text-white hover:bg-dark-bgTertiary'
            }`}
          >
            <svg className="w-6 h-6 inline mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Rendimiento Global
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-400 font-semibold text-lg">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-6 shadow-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <p className="text-green-400 font-semibold text-lg">{successMessage}</p>
          </div>
        </div>
      )}


      {activeTab === 'users' && (
        <div className="space-y-8 sm:space-y-12">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            {/* Lista de Usuarios */}
            <div className="xl:col-span-1">
              <div className="bg-dark-bgSecondary rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border-2 border-dark-border hover:border-green-400 hover:shadow-green-500/20 hover:-translate-y-1 transition-all duration-500 ease-out">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Usuarios</h3>
                  <span className="text-lg sm:text-xl text-dark-textSecondary font-semibold">({filteredUsers.length})</span>
                </div>
            
                {/* Barra de búsqueda */}
                <div className="mb-6 sm:mb-8">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-dark-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por email o nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border-2 border-dark-border bg-dark-bgTertiary text-dark-text rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg placeholder-dark-textMuted transition-all hover:border-green-500/50"
                    />
                  </div>
                </div>
            
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.uid}
                      onClick={() => setSelectedUser(user)}
                      className={`p-4 sm:p-6 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                        selectedUser?.uid === user.uid
                          ? 'bg-green-500/10 border-2 border-green-500/30 shadow-lg'
                          : 'bg-dark-bgTertiary border-2 border-transparent hover:bg-dark-bg hover:border-green-500/30 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-lg sm:text-xl">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white text-lg sm:text-xl">{user.email}</p>
                          <p className="text-dark-textSecondary text-sm sm:text-base">
                            Creado: {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        {selectedUser?.uid === user.uid && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              
                  {filteredUsers.length === 0 && searchTerm && (
                    <div className="text-center py-4">
                      <p className="text-dark-textSecondary text-sm">No se encontraron usuarios</p>
                    </div>
                  )}
                  
                  {filteredUsers.length === 0 && !searchTerm && (
                    <div className="text-center py-4">
                      <p className="text-dark-textSecondary text-sm">No hay usuarios registrados</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Histórico del Usuario */}
            <div className="xl:col-span-1">
              {selectedUser ? (
                <div className="space-y-6">
                  {/* Información del Usuario */}
                  <div className="bg-dark-bgSecondary rounded-xl shadow-2xl p-6 border border-dark-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-dark-text">
                        📊 Histórico de {selectedUser.email}
                      </h3>
                      <button
                        onClick={() => setShowAddRendimientoForm(true)}
                        className="bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-semibold"
                      >
                        + Agregar Rendimiento
                      </button>
                    </div>

                    {/* Tabla de Rendimientos */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-dark-border">
                        <thead className="bg-dark-bgTertiary">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                              Período
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                              Capital
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                              Rendimiento %
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                              Rendimiento MXN
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                              Balance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-dark-bgSecondary divide-y divide-dark-border">
                          {rendimientos.map((rendimiento) => (
                            <tr key={rendimiento.id} className="hover:bg-dark-bgTertiary transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">
                                {rendimiento.periodo}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                ${rendimiento.capital?.toLocaleString() || '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                {rendimiento.rendimiento_pct || 0}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                ${rendimiento.rendimiento_mxn?.toLocaleString() || '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                ${rendimiento.balance?.toLocaleString() || '0'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-textSecondary">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => alert('Funcionalidad de editar rendimiento próximamente')}
                                    className="text-blue-400 hover:text-blue-300 transition-colors"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('¿Estás seguro de que quieres eliminar este rendimiento?')) {
                                        // TODO: Implementar eliminación
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {rendimientos.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-dark-textSecondary">No hay rendimientos registrados para este usuario.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-dark-bgSecondary border border-dark-border rounded-xl shadow-2xl p-12 text-center">
                  <div className="text-dark-textMuted mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-dark-text mb-2">Selecciona un usuario</h3>
                  <p className="text-dark-textSecondary">Haz clic en un usuario de la lista para ver su histórico de rendimientos.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Carga Masiva de Usuarios */}
          <div className="mt-6">
            <BulkUserUpload 
              onSuccess={(createdCount, skippedCount) => {
                setSuccessMessage(`✅ Carga masiva completada: ${createdCount} usuarios creados, ${skippedCount} omitidos`);
                setTimeout(() => setSuccessMessage(''), 5000);
                loadUsers(); // Recargar la lista de usuarios
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="space-y-4 lg:space-y-6">
          <div className="bg-dark-bgSecondary rounded-xl shadow-2xl p-4 lg:p-6 border border-dark-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-dark-text">📋 Todos los Contratos</h2>
              <div className="flex space-x-3">
                <button
                  onClick={loadContractExpirations}
                  disabled={loading}
                  className="bg-gradient-silver text-white px-4 py-2 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  🔄 Recargar Contratos
                </button>
              </div>
            </div>

            {/* Estadísticas de Contratos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{contractExpirations.length}</div>
                <div className="text-sm text-blue-400">Total Contratos</div>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-400">
                  {contractExpirations.filter(c => c.daysRemaining < 0).length}
                </div>
                <div className="text-sm text-red-400">Vencidos</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">
                  {contractExpirations.filter(c => c.daysRemaining >= 0 && c.daysRemaining <= 30).length}
                </div>
                <div className="text-sm text-green-400">Próximos a Vencer</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">
                  {contractExpirations.filter(c => c.daysRemaining > 30).length}
                </div>
                <div className="text-sm text-green-400">Activos</div>
              </div>
            </div>

            {/* Lista de Contratos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-dark-text">Lista de Contratos</h3>
                
                {/* Filtro de contratos por página */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-dark-textSecondary">Mostrar:</label>
                  <select
                    value={contractsPerPage}
                    onChange={(e) => setContractsPerPage(Number(e.target.value))}
                    className="px-3 py-1 border border-dark-border bg-dark-bgTertiary text-dark-text rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  >
                    <option value={5}>5 contratos</option>
                    <option value={10}>10 contratos</option>
                    <option value={25}>25 contratos</option>
                    <option value={50}>50 contratos</option>
                    <option value={100}>100 contratos</option>
                    <option value={contractExpirations.length}>Todos ({contractExpirations.length})</option>
                  </select>
                </div>
              </div>
              
              {contractExpirations.length === 0 ? (
                <div className="text-center py-8 text-dark-textSecondary">
                  <svg className="mx-auto h-12 w-12 text-dark-textMuted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium text-dark-text mb-2">No hay contratos en la base de datos</p>
                  <p className="text-sm text-dark-textSecondary mb-4">Los contratos se crean automáticamente cuando aplicas rendimientos globales.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 lg:mx-0">
                  <table className="min-w-full divide-y divide-dark-border">
                    <thead className="bg-dark-bgTertiary">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Tipo de Contrato</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Fecha Inicio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Fecha Vencimiento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Días Restantes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-dark-textSecondary uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-dark-bgSecondary divide-y divide-dark-border">
                      {contractExpirations.slice(0, contractsPerPage).map((contract) => (
                        <tr key={contract.id} className="hover:bg-dark-bgTertiary transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {(contract.userName || contract.userEmail).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-dark-text">
                                  {contract.userName || contract.userEmail}
                                </div>
                                <div className="text-sm text-dark-textSecondary">{contract.userEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                            {contract.contractType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                            ${contract.investmentAmount?.toLocaleString() || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                            {new Date(contract.startDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                            {new Date(contract.expirationDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              contract.daysRemaining < 0
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : contract.daysRemaining <= 30
                                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                : 'bg-green-500/10 text-green-400 border-green-500/30'
                            }`}>
                              {contract.daysRemaining < 0 ? 'Vencido' : `${contract.daysRemaining} días`}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              contract.status === 'active'
                                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                            }`}>
                              {contract.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Información de paginación */}
                  <div className="mt-4 flex items-center justify-between text-sm text-dark-textSecondary">
                    <div>
                      Mostrando {Math.min(contractsPerPage, contractExpirations.length)} de {contractExpirations.length} contratos
                    </div>
                    {contractExpirations.length > contractsPerPage && (
                      <div className="text-green-400">
                        Usa el filtro "Mostrar" para ver más contratos
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Carga Masiva de Contratos */}
          <div className="mt-6">
            <BulkContractsUpload 
              onSuccess={(createdCount, skippedCount) => {
                setSuccessMessage(`✅ Carga masiva de contratos completada: ${createdCount} contratos creados, ${skippedCount} omitidos`);
                setTimeout(() => setSuccessMessage(''), 5000);
                loadContractExpirations(); // Recargar la lista de contratos
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'global' && (
        <GlobalRendimientoForm />
      )}

      {/* Modal para Crear Usuario */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-dark-bgSecondary border border-dark-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold text-dark-text mb-4">Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-dark-border bg-dark-bgTertiary text-dark-text rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-textSecondary mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-dark-border bg-dark-bgTertiary text-dark-text rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-silver text-white py-2 px-4 rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Creando...' : 'Crear Usuario'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUser(false);
                    setNewUserEmail('');
                    setNewUserPassword('');
                  }}
                  className="flex-1 bg-dark-bgTertiary border border-dark-border text-dark-text py-2 px-4 rounded-lg hover:bg-dark-bg transition-all duration-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Agregar Rendimiento */}
      {showAddRendimientoForm && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <AddRendimientoForm
            userId={selectedUser.uid}
            userEmail={selectedUser.email}
            onSuccess={handleRendimientoSuccess}
            onCancel={() => setShowAddRendimientoForm(false)}
          />
        </div>
      )}
    </div>
  );
}