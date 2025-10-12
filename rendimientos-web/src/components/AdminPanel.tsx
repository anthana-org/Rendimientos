import React, { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { ContractService } from '../services/contractService';
import { RendimientoGenerator } from '../services/rendimientoGenerator';
import { RendimientosService } from '../services/rendimientosService';
import { PerformanceChart } from './PerformanceChart';
import * as XLSX from 'xlsx';

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
    duration: '1', // Duración en meses: 1, 3, 6, 9, 12
    status: 'active',
    rendimiento: ''
  });
  
  const [expiringContracts, setExpiringContracts] = useState<any[]>([]);
  const [showExpiringAlert, setShowExpiringAlert] = useState(false);
  const [showBulkUserUpload, setShowBulkUserUpload] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [bulkUploadProgress, setBulkUploadProgress] = useState<string>('');

  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File[]}>({});
  const [selectedUserContracts, setSelectedUserContracts] = useState<any[]>([]);
  const [showUserContracts, setShowUserContracts] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  const [selectedUserRendimientos, setSelectedUserRendimientos] = useState<any[]>([]);
  const [loadingRendimientos, setLoadingRendimientos] = useState(false);
  const [initializingContracts, setInitializingContracts] = useState(false);
  const [contractProgress, setContractProgress] = useState({ current: 0, total: 0, message: '' });
  const [deletingContracts, setDeletingContracts] = useState(false);

  useEffect(() => {
    loadUsers();
    checkExpiringContracts(); // Verificar contratos al cargar
    
    // Verificar contratos que expiran cada 5 minutos
    const intervalId = setInterval(() => {
      checkExpiringContracts();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(intervalId);
  }, []);

  // Comentado para evitar crear contratos automáticamente y exceder la cuota de Firebase
  // useEffect(() => {
  //   if (users.length > 0) {
  //     console.log('Usuarios cargados, iniciando generación de contratos...');
  //     initializeContracts().then(() => {
  //       console.log('Contratos inicializados, generando rendimientos...');
  //       // Después de crear contratos, generar rendimientos
  //       RendimientoGenerator.generateRendimientosForAllUsers().then(result => {
  //         console.log('Resultado de generación de rendimientos:', result);
  //         if (result.success && result.generated && result.generated > 0) {
  //           console.log(`✅ Generados ${result.generated} rendimientos automáticamente`);
  //         } else {
  //           console.log('⚠️ No se generaron rendimientos:', result.error);
  //         }
  //       });
  //     });
  //   }
  // }, [users]);

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

  const checkExpiringContracts = async () => {
    try {
      const today = new Date();
      const result = await ContractService.getAllContracts();
      
      if (result.success && result.data) {
        const expiring = result.data.filter(contract => {
          const expirationDate = new Date(contract.expirationDate);
          const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          // Alertar si falta 1 día o menos para que expire
          return daysUntilExpiration <= 1 && daysUntilExpiration >= 0 && contract.status === 'active';
        });
        
        if (expiring.length > 0) {
          setExpiringContracts(expiring);
          setShowExpiringAlert(true);
          
          // También actualizar estado de contratos vencidos
          result.data.forEach(async (contract) => {
            const expirationDate = new Date(contract.expirationDate);
            if (expirationDate < today && contract.status === 'active') {
              await ContractService.updateContractStatus(contract.id, 'expired');
            }
          });
        }
      }
    } catch (err) {
      console.error('Error verificando contratos que expiran:', err);
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
      console.log('Cargando información completa para usuario:', user.uid, user.email);
      setIsLoading(true);
      setLoadingRendimientos(true);
      setError(null);
      setSelectedUserData(user);
      
      // Cargar contratos
      const contractsResult = await ContractService.getContractsByUser(user.uid);
      console.log('Resultado de contratos:', contractsResult);
      
      if (contractsResult.success && contractsResult.data) {
        console.log('Contratos encontrados:', contractsResult.data.length);
        setSelectedUserContracts(contractsResult.data);
      } else {
        console.error('No se encontraron contratos:', contractsResult.error);
        setSelectedUserContracts([]);
      }

      // Cargar rendimientos
      const rendimientosResult = await RendimientosService.getRendimientosByUser(user.uid);
      console.log('Resultado de rendimientos:', rendimientosResult);
      
      if (rendimientosResult.success && rendimientosResult.data) {
        console.log('Rendimientos encontrados:', rendimientosResult.data.length);
        setSelectedUserRendimientos(rendimientosResult.data);
      } else {
        console.error('No se encontraron rendimientos:', rendimientosResult.error);
        setSelectedUserRendimientos([]);
      }

      setShowUserContracts(true);
      
    } catch (error: any) {
      console.error('Error cargando información del usuario:', error);
      setError(`Error al cargar información: ${error.message}`);
    } finally {
      setIsLoading(false);
      setLoadingRendimientos(false);
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

    if (!newContract.amount || !newContract.startDate || !newContract.duration || !newContract.rendimiento) {
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

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Calcular fecha de fin basada en la duración en meses
      const startDate = new Date(newContract.startDate);
      const durationMonths = parseInt(newContract.duration);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);

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
          contractType: `Inversión ${durationMonths} ${durationMonths === 1 ? 'Mes' : 'Meses'}`,
          startDate: newContract.startDate,
          expirationDate: endDate.toISOString().split('T')[0],
          investmentAmount: parseFloat(newContract.amount),
          monthlyReturn: parseFloat(newContract.rendimiento),
          status: newContract.status as 'active' | 'inactive' | 'expired',
          lastNotification: '',
          contractDuration: durationMonths
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

  const handleBulkUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBulkUploadFile(file);
    }
  };

  const handleBulkUserUpload = async () => {
    if (!bulkUploadFile) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setBulkUploadProgress('Leyendo archivo...');

    try {
      const data = await bulkUploadFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      setBulkUploadProgress(`Procesando ${jsonData.length} usuarios...`);

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const email = row.email || row.Email || row.EMAIL || row.correo || row.Correo;
        const password = row.password || row.Password || row.PASSWORD || row.contraseña || row.Contraseña;

        if (!email || !password) {
          errorCount++;
          errors.push(`Fila ${i + 2}: Email o contraseña faltante`);
          continue;
        }

        if (password.length < 6) {
          errorCount++;
          errors.push(`Fila ${i + 2}: La contraseña debe tener al menos 6 caracteres`);
          continue;
        }

        setBulkUploadProgress(`Creando usuario ${i + 1}/${jsonData.length}: ${email}`);

        try {
          await UserService.createUser(email, password);
          successCount++;
        } catch (err: any) {
          errorCount++;
          errors.push(`${email}: ${err.message}`);
        }

        // Pequeña pausa para no saturar Firebase
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setBulkUploadProgress('');
      
      if (successCount > 0) {
        setSuccess(`✅ ${successCount} usuarios creados exitosamente${errorCount > 0 ? `. ${errorCount} errores.` : ''}`);
        loadUsers(); // Recargar lista
      }
      
      if (errorCount > 0 && errorCount === jsonData.length) {
        setError(`❌ No se pudo crear ningún usuario. Errores: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
      }

      setBulkUploadFile(null);
      setTimeout(() => {
        setShowBulkUserUpload(false);
      }, 3000);

    } catch (err: any) {
      setError(`Error procesando archivo: ${err.message}`);
      setBulkUploadProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllContracts = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro de que quieres eliminar TODOS los contratos? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setDeletingContracts(true);
      setContractProgress({ current: 0, total: 0, message: 'Eliminando todos los contratos...' });

      const result = await ContractService.getAllContracts();
      
      if (result.success && result.data) {
        const totalContracts = result.data.length;
        setContractProgress({ current: 0, total: totalContracts, message: 'Eliminando contratos...' });
        
        let deleted = 0;
        for (const contract of result.data) {
          try {
            await ContractService.deleteContract(contract.id);
            deleted++;
            setContractProgress({ 
              current: deleted, 
              total: totalContracts, 
              message: `Eliminado ${deleted}/${totalContracts} contratos` 
            });
            // Pausa para no saturar
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            console.error('Error eliminando contrato:', err);
          }
        }
        
        setContractProgress({ 
          current: deleted, 
          total: totalContracts, 
          message: `✅ ${deleted} contratos eliminados` 
        });
        
        setTimeout(() => {
          setContractProgress({ current: 0, total: 0, message: '' });
          setDeletingContracts(false);
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error eliminando contratos:', err);
      setContractProgress({ current: 0, total: 0, message: `❌ Error: ${err.message}` });
      setTimeout(() => {
        setContractProgress({ current: 0, total: 0, message: '' });
        setDeletingContracts(false);
      }, 5000);
    }
  };

  const initializeContracts = async (force = false) => {
    if (users.length === 0) {
      console.log('No hay usuarios para crear contratos');
      return;
    }

    try {
      if (!force) {
        console.log(`Verificando contratos existentes para ${users.length} usuarios...`);
        setContractProgress({ current: 0, total: 0, message: 'Verificando contratos existentes...' });
        
        // Verificar si ya existen contratos para evitar duplicados
        const contractsResult = await ContractService.getAllContracts();
        console.log('Contratos existentes:', contractsResult.data?.length || 0);
        
        if (contractsResult.success && contractsResult.data && contractsResult.data.length > 0) {
          console.log('Ya existen contratos, no se crearán más');
          setContractProgress({ current: 0, total: 0, message: '' });
          return; // Ya hay contratos, no crear más
        }
      } else {
        console.log('Modo forzado: creando contratos sin verificar existentes');
      }

      setInitializingContracts(true);
      const contractsPerUser = 5; // Reducido de 20 a 5 para evitar exceder cuota
      const totalContracts = users.length * contractsPerUser;
      setContractProgress({ current: 0, total: totalContracts, message: 'Iniciando creación de contratos...' });
      
      console.log(`Creando ${contractsPerUser} contratos por cada usuario...`);
      let totalCreated = 0;
      const durations = [1, 3, 6, 9, 12]; // Duraciones predefinidas en meses
      
      // Generar contratos por cada usuario
      for (let userIndex = 0; userIndex < users.length; userIndex++) {
        const user = users[userIndex];
        console.log(`Creando contratos para usuario: ${user.email}`);
        setContractProgress({ 
          current: userIndex * contractsPerUser, 
          total: totalContracts, 
          message: `Creando contratos para ${user.email}...` 
        });
        
        for (let i = 1; i <= contractsPerUser; i++) {
          // Fechas aleatorias en los últimos 12 meses
          const now = new Date();
          const startDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
          
          // Seleccionar duración aleatoria de las predefinidas
          const duration = durations[Math.floor(Math.random() * durations.length)];
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + duration);

          // Montos aleatorios entre $10,000 y $500,000
          const amount = 10000 + Math.random() * 490000;
          
          // Rendimientos aleatorios entre 1% y 8%
          const rendimiento = 1 + Math.random() * 7;

          const contractData = {
            userId: user.uid,
            userEmail: user.email,
            contractType: `Inversión ${duration} ${duration === 1 ? 'Mes' : 'Meses'}`,
            startDate: startDate.toISOString().split('T')[0],
            expirationDate: endDate.toISOString().split('T')[0],
            investmentAmount: Math.round(amount),
            monthlyReturn: parseFloat(rendimiento.toFixed(2)),
            status: 'active' as const,
            lastNotification: '',
            contractDuration: duration
          };

          const result = await ContractService.createContract(contractData);
          if (result.success) {
            totalCreated++;
            setContractProgress({ 
              current: totalCreated, 
              total: totalContracts, 
              message: `Creando contrato ${i}/${contractsPerUser} para ${user.email}` 
            });
          } else {
            console.error(`Error creando contrato ${i} para ${user.email}:`, result.error);
          }
          
          // Pausa de 300ms entre cada contrato para no saturar Firebase
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Pausa adicional entre usuarios
        if (userIndex < users.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setContractProgress({ 
        current: totalCreated, 
        total: totalContracts, 
        message: `✅ ${totalCreated} contratos creados exitosamente` 
      });
      
      console.log(`✅ Creados ${totalCreated} contratos en total`);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setContractProgress({ current: 0, total: 0, message: '' });
        setInitializingContracts(false);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error inicializando contratos:', err);
      setContractProgress({ 
        current: 0, 
        total: 0, 
        message: `❌ Error: ${err.message}` 
      });
      setTimeout(() => {
        setContractProgress({ current: 0, total: 0, message: '' });
        setInitializingContracts(false);
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Progress Indicator - Floating */}
      {contractProgress.message && (
        <div className="fixed top-4 right-4 z-50 bg-blue-900 border border-blue-500 rounded-lg shadow-xl p-4 min-w-[350px]">
          <div className="flex items-center space-x-3">
            {initializingContracts && (
              <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
            )}
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{contractProgress.message}</p>
              {contractProgress.total > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-blue-200 mb-1">
                    <span>{contractProgress.current}/{contractProgress.total}</span>
                    <span>{Math.round((contractProgress.current / contractProgress.total) * 100)}%</span>
        </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${(contractProgress.current / contractProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkUserUpload(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Carga Masiva
            </button>
        <button
          onClick={() => setShowCreateUser(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
        >
              Crear Usuario
        </button>
          </div>
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
                          {user.createdAt && (
                            <p className="text-gray-400 text-sm">
                              Creado: {new Date(user.createdAt).toLocaleDateString('es-MX')}
                            </p>
                          )}
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
                  Duración del Contrato
                </label>
                <select
                  name="duration"
                  value={newContract.duration}
                  onChange={handleContractInputChange}
                  required
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg"
                >
                  <option value="1">1 Mes</option>
                  <option value="3">3 Meses</option>
                  <option value="6">6 Meses</option>
                  <option value="9">9 Meses</option>
                  <option value="12">12 Meses</option>
                </select>
                <p className="text-gray-400 text-xs mt-1">
                  {newContract.startDate && (
                    <>Fecha de vencimiento: {(() => {
                      const start = new Date(newContract.startDate);
                      const end = new Date(start);
                      end.setMonth(end.getMonth() + parseInt(newContract.duration || '1'));
                      return end.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
                    })()}</>
                  )}
                </p>
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

      {/* User Complete History Modal */}
      {showUserContracts && selectedUserData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-gray-700 w-full max-w-7xl my-8">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-green-900/20 to-blue-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {selectedUserData.email.charAt(0).toUpperCase()}
                    </span>
                    </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{selectedUserData.email}</h2>
                    <p className="text-gray-400">ID: {selectedUserData.uid}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserContracts(false);
                    setSelectedUserData(null);
                    setSelectedUserContracts([]);
                    setSelectedUserRendimientos([]);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                  </div>
                </div>
            
            <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Resumen General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl p-4 border border-green-500/30">
                  <p className="text-green-400 text-sm font-medium mb-1">Total Invertido</p>
                  <p className="text-white text-2xl font-bold">
                    ${selectedUserContracts.reduce((sum, c) => sum + (c.investmentAmount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl p-4 border border-blue-500/30">
                  <p className="text-blue-400 text-sm font-medium mb-1">Contratos Activos</p>
                  <p className="text-white text-2xl font-bold">
                    {selectedUserContracts.filter(c => c.status === 'active').length}
                  </p>
            </div>
          </div>
          
              {/* Tabla de Contratos */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Contratos ({selectedUserContracts.length})
                </h3>
                
                {selectedUserContracts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Tipo</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Monto</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Rendimiento</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Inicio</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Vencimiento</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Días Restantes</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Estado</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUserContracts.map((contract) => {
                          // Calcular días restantes
                          const now = new Date();
                          const expirationDate = new Date(contract.expirationDate);
                          const timeDiff = expirationDate.getTime() - now.getTime();
                          const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                          
                          return (
                            <tr key={contract.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                              <td className="py-3 px-4 text-white font-medium">{contract.contractType}</td>
                              <td className="py-3 px-4 text-white">${contract.investmentAmount?.toLocaleString() || 'N/A'}</td>
                              <td className="py-3 px-4 text-green-400 font-bold">{contract.monthlyReturn || 0}%</td>
                              <td className="py-3 px-4 text-gray-300 text-sm">{contract.startDate}</td>
                              <td className="py-3 px-4 text-gray-300 text-sm">{contract.expirationDate}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  contract.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                  contract.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {contract.status === 'active' ? 'Activo' : 
                                   contract.status === 'inactive' ? 'Inactivo' : 'Vencido'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => handleViewContractDetails(contract)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                  Ver PDFs
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No hay contratos registrados</p>
                  </div>
                )}
              </div>

              {/* Gráfica de Rendimientos */}
              <div className="mb-6">
                <PerformanceChart 
                  data={(() => {
                    // Filtrar solo contratos activos y ordenar por fecha de inicio
                    const activeContracts = selectedUserContracts
                      .filter(contract => contract.status === 'active')
                      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                    
                    // Calcular crecimiento acumulativo
                    let cumulativeAmount = 0;
                    let cumulativeBalance = 0;
                    
                    return activeContracts.map((contract, index) => {
                      const contractAmount = contract.investmentAmount || 0;
                      const monthlyReturn = contract.monthlyReturn || 0;
                      const monthsElapsed = Math.max(1, Math.ceil(
                        (new Date().getTime() - new Date(contract.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
                      ));
                      
                      // Calcular rendimiento acumulado hasta ahora
                      const monthlyReturnAmount = contractAmount * (monthlyReturn / 100);
                      const totalReturnAmount = monthlyReturnAmount * monthsElapsed;
                      
                      cumulativeAmount += contractAmount;
                      cumulativeBalance += contractAmount + totalReturnAmount;
                      
                      return {
                        period: `${contract.contractType} - ${new Date(contract.startDate).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}`,
                        capital: contractAmount,
                        rendimientoAmount: totalReturnAmount,
                        balance: cumulativeBalance,
                        contractType: contract.contractType,
                        monthlyReturn: monthlyReturn,
                        monthsElapsed: monthsElapsed
                      };
                    });
                  })()}
                  height={400}
                />
              </div>

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

      {/* Bulk User Upload Modal */}
      {showBulkUserUpload && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Carga Masiva de Usuarios</h2>
              <p className="text-gray-400 text-sm mt-1">
                Sube un archivo Excel (.xls, .xlsx) con las columnas: email, password
              </p>
                    </div>
            
            <div className="p-6 space-y-4">
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

              {bulkUploadProgress && (
                <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-3 rounded-lg text-sm flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {bulkUploadProgress}
                </div>
              )}

              {/* Formato de ejemplo */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Formato del archivo Excel:</h3>
                <div className="bg-black/50 rounded p-3 font-mono text-xs text-gray-300">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left pb-2">email</th>
                        <th className="text-left pb-2 pl-4">password</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="pt-2">usuario1@ejemplo.com</td>
                        <td className="pt-2 pl-4">password123</td>
                      </tr>
                      <tr>
                        <td>usuario2@ejemplo.com</td>
                        <td className="pl-4">password456</td>
                      </tr>
                    </tbody>
                  </table>
            </div>
                <p className="text-gray-400 text-xs mt-2">
                  * La contraseña debe tener al menos 6 caracteres
                </p>
          </div>
          
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={handleBulkUploadFile}
                  className="hidden"
                  id="bulk-upload-input"
                  disabled={isLoading}
                />
                <label htmlFor="bulk-upload-input" className="cursor-pointer">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-400 mb-2">
                    {bulkUploadFile ? bulkUploadFile.name : 'Haz clic para seleccionar archivo'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Archivos soportados: .xls, .xlsx
                  </p>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBulkUserUpload}
                  disabled={isLoading || !bulkUploadFile}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  {isLoading ? 'Procesando...' : 'Subir Usuarios'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkUserUpload(false);
                    setBulkUploadFile(null);
                    setBulkUploadProgress('');
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal - Contratos por Expirar */}
      {showExpiringAlert && expiringContracts.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gradient-to-br from-red-900/90 to-gray-900/90 rounded-xl border-2 border-red-500/50 w-full max-w-2xl shadow-2xl">
            <div className="p-6 border-b border-red-500/30">
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-8 text-red-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-2xl font-bold text-white">⚠️ Alerta de Contratos</h2>
              </div>
              <p className="text-red-200 mt-2">
                {expiringContracts.length} contrato{expiringContracts.length > 1 ? 's están' : ' está'} próximo{expiringContracts.length > 1 ? 's' : ''} a vencer
              </p>
            </div>
            
            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {expiringContracts.map((contract) => (
                <div key={contract.id} className="bg-black/30 backdrop-blur-sm rounded-lg border border-red-500/30 p-4 hover:border-red-400/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-bold border border-red-500/30">
                          ⏰ {contract.remainingDays} día{contract.remainingDays !== 1 ? 's' : ''} restante{contract.remainingDays !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-white font-semibold text-lg">{contract.userEmail}</p>
                      <p className="text-gray-300 text-sm">
                        <span className="text-gray-400">Contrato:</span> {contract.contractType}
                      </p>
                      <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                          <p className="text-gray-400 text-xs">Monto</p>
                          <p className="text-green-400 font-semibold">${contract.investmentAmount.toLocaleString()}</p>
              </div>
              <div>
                          <p className="text-gray-400 text-xs">Vence el</p>
                          <p className="text-red-300 font-semibold">{new Date(contract.expirationDate).toLocaleDateString('es-MX')}</p>
              </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-red-500/30 flex gap-3">
                <button
                onClick={() => setShowExpiringAlert(false)}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                Entendido
                </button>
                <button
                  onClick={() => {
                  setShowExpiringAlert(false);
                  // Recargar en 5 minutos
                  setTimeout(() => checkExpiringContracts(), 5 * 60 * 1000);
                }}
                className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Recordar en 5 min
                </button>
              </div>
          </div>
        </div>
      )}

    </div>
  );
};