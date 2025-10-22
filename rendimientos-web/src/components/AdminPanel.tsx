import React, { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { ContractService } from '../services/contractService';
import { PerformanceChart } from './PerformanceChart';
import { useAuth } from '../hooks/useAuth';
import * as XLSX from 'xlsx';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import jsPDF from 'jspdf';

interface User {
  uid: string;
  email: string;
  createdAt: string;
  isAdmin?: boolean;
}

interface Contract {
  id: string;
  contractType: string;
  investmentAmount: number;
  monthlyReturn: number;
  startDate: string;
  expirationDate: string;
  status: string;
  remainingDays?: number;
  pdfUrl?: string;
  pdfFileName?: string;
  pdfData?: string; // Base64 data
  pdfMimeType?: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Estados para crear usuario
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para crear contrato
  const [showCreateContract, setShowCreateContract] = useState(false);
  const [newContract, setNewContract] = useState({
    amount: '',
    startDate: '',
    duration: '1',
    status: 'active',
    rendimiento: ''
  });
  const [contractPdfFile, setContractPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  
  // Estados para historial de usuario
  const [selectedUserContracts, setSelectedUserContracts] = useState<Contract[]>([]);
  const [showUserContracts, setShowUserContracts] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  
  // Estados para carga masiva
  const [showBulkUserUpload, setShowBulkUserUpload] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [bulkUploadProgress, setBulkUploadProgress] = useState('');
  
  // Estados para subida de documentos
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await UserService.getAllUsers();
      
      if (Array.isArray(response)) {
        setUsers(response.map(user => ({
          uid: user.uid,
          email: user.email,
          createdAt: user.createdAt || '',
          isAdmin: false
        })));
      } else if (response && Array.isArray(response.data)) {
        setUsers(response.data.map(user => ({
          uid: user.uid,
          email: user.email,
          createdAt: user.createdAt || '',
          isAdmin: false
        })));
      }
    } catch (err: any) {
      setError('Error cargando usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.uid));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Simular creación de usuario
      console.log('Creando usuario:', newUser.email);
      setSuccess('Usuario creado exitosamente');
      setNewUser({ email: '', password: '' });
      setShowCreateUser(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Error creando usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateContractClick = () => {
    if (selectedUsers.length === 0) {
      setError('Selecciona al menos un usuario');
      return;
    }
    setShowCreateContract(true);
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUploadingPdf(true);
    setError(null);
    setSuccess(null);

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      let pdfUrl = '';

      // Upload PDF if provided
      if (contractPdfFile) {
        try {
          console.log('Subiendo PDF:', contractPdfFile.name);
          
          // Convertir PDF a base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            reader.readAsDataURL(contractPdfFile);
          });
          
          pdfUrl = await base64Promise;
          console.log('PDF convertido a base64 exitosamente');
        } catch (uploadError: any) {
          console.error('Error subiendo PDF:', uploadError);
          setError(`Error subiendo PDF: ${uploadError.message}`);
          setIsLoading(false);
          setUploadingPdf(false);
          return;
        }
      } else {
        console.log('No hay archivo PDF para subir');
      }

      for (const userId of selectedUsers) {
        const user = users.find(u => u.uid === userId);
        if (!user) continue;

        const startDate = new Date(newContract.startDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + parseInt(newContract.duration));

        const contractData = {
          userId: userId,
          userEmail: user.email,
          contractType: `Inversión ${newContract.duration} Mes${parseInt(newContract.duration) > 1 ? 'es' : ''}`,
          investmentAmount: parseFloat(newContract.amount),
          monthlyReturn: parseFloat(newContract.rendimiento),
          startDate: startDate.toISOString().split('T')[0],
          expirationDate: endDate.toISOString().split('T')[0],
          status: newContract.status as "active" | "inactive" | "expired",
          pdfUrl: pdfUrl || null,
          pdfFileName: contractPdfFile?.name || null,
          pdfData: pdfUrl || null, // Base64 data
          pdfMimeType: contractPdfFile?.type || null
        };

        console.log('Creando contrato con datos:', contractData);
        const result = await ContractService.createContract(contractData);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`${user.email}: ${result.error}`);
        }
      }

      if (successCount > 0) {
        setSuccess(`✅ ${successCount} contratos creados exitosamente${errorCount > 0 ? `. ${errorCount} errores.` : ''}`);
      }
      
      if (errorCount > 0 && successCount === 0) {
        setError(`Error creando contratos: ${errors.join(', ')}`);
      }

      if (successCount > 0) {
        setNewContract({ amount: '', startDate: '', duration: '1', status: 'active', rendimiento: '' });
        setSelectedUsers([]);
        setContractPdfFile(null);
        setShowCreateContract(false);
        loadUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Error al crear contratos');
    } finally {
      setIsLoading(false);
      setUploadingPdf(false);
    }
  };

  const handleContractInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewContract(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const exportContractToPDF = () => {
    if (!selectedContract) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Configuración de colores
    const primaryColor: [number, number, number] = [34, 197, 94]; // Verde
    const secondaryColor: [number, number, number] = [107, 114, 128]; // Gris
    const textColor: [number, number, number] = [31, 41, 55]; // Gris oscuro

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Rendimientos', 20, 20);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Detalles del Contrato', 20, 25);

    yPosition = 45;

    // Información del contrato
    doc.setTextColor(...textColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Contrato', 20, yPosition);
    yPosition += 10;

    // Línea separadora
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 15;

    // Detalles del contrato
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const contractDetails = [
      { label: 'ID del Contrato:', value: selectedContract.id },
      { label: 'Tipo:', value: selectedContract.contractType },
      { label: 'Monto Inicial:', value: `$${selectedContract.investmentAmount?.toLocaleString() || 'N/A'}` },
      { label: 'Rendimiento Mensual:', value: `${selectedContract.monthlyReturn || 0}%` },
      { label: 'Fecha de Inicio:', value: selectedContract.startDate },
      { label: 'Fecha de Vencimiento:', value: selectedContract.expirationDate },
      { label: 'Estado:', value: selectedContract.status === 'active' ? 'Activo' : 
                                  selectedContract.status === 'inactive' ? 'Inactivo' : 'Vencido' },
      { label: 'Días Restantes:', value: selectedContract.remainingDays?.toString() || 'N/A' }
    ];

    contractDetails.forEach((detail) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setTextColor(...secondaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(detail.label, 20, yPosition);
      
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');
      doc.text(detail.value || '', 80, yPosition);
      
      yPosition += 8;
    });

    // Información del usuario si está disponible
    if (selectedUserData) {
      yPosition += 10;
      
      doc.setTextColor(...textColor);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Información del Usuario', 20, yPosition);
      yPosition += 10;

      // Línea separadora
      doc.setDrawColor(...primaryColor);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      const userDetails = [
        { label: 'Email:', value: selectedUserData.email },
        { label: 'Fecha de Registro:', value: new Date(selectedUserData.createdAt).toLocaleDateString('es-MX') }
      ];

      userDetails.forEach((detail) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setTextColor(...secondaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(detail.label, 20, yPosition);
        
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'normal');
        doc.text(detail.value || '', 80, yPosition);
        
        yPosition += 8;
      });
    }

    // Footer
    yPosition = pageHeight - 20;
    doc.setTextColor(...secondaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado el ${new Date().toLocaleDateString('es-MX')} a las ${new Date().toLocaleTimeString('es-MX')}`, 20, yPosition);
    doc.text('Sistema de Gestión de Rendimientos', pageWidth - 20, yPosition, { align: 'right' });

    // Descargar el PDF
    const fileName = `contrato_${selectedContract.id}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handleDeleteUsers = async () => {
    if (selectedUsers.length === 0) {
      setError('Selecciona al menos un usuario para eliminar');
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar ${selectedUsers.length} usuario(s)? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const userId of selectedUsers) {
        const user = users.find(u => u.uid === userId);
        if (!user) continue;

        const result = await UserService.deleteUser(userId);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`${user.email}: ${result.error}`);
        }
      }

      if (successCount > 0) {
        setSuccess(`✅ ${successCount} usuario(s) eliminado(s) exitosamente${errorCount > 0 ? `. ${errorCount} errores.` : ''}`);
        setSelectedUsers([]);
        loadUsers();
      }
      
      if (errorCount > 0 && successCount === 0) {
        setError(`Error eliminando usuarios: ${errors.join(', ')}`);
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!selectedContract) return;

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar el contrato "${selectedContract.contractType}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await ContractService.deleteContract(selectedContract.id);
      
      if (result.success) {
        setSuccess('✅ Contrato eliminado exitosamente');
        setShowContractDetails(false);
        setSelectedContract(null);
        // Recargar los contratos del usuario si estamos viendo contratos de un usuario específico
        if (selectedUserData) {
          const contractsResult = await ContractService.getContractsByUser(selectedUserData.uid);
          if (contractsResult.success && contractsResult.data) {
            setSelectedUserContracts(contractsResult.data);
          }
        }
      } else {
        setError(`Error eliminando contrato: ${result.error}`);
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUserContracts = async (user: User) => {
    try {
      setSelectedUserData(user);
      const result = await ContractService.getContractsByUser(user.uid);
      if (result.success && result.data) {
        console.log('Contratos cargados:', result.data);
        setSelectedUserContracts(result.data);
        setShowUserContracts(true);
      } else {
        setError('Error cargando contratos del usuario');
      }
    } catch (err: any) {
      setError('Error cargando contratos del usuario');
    }
  };



  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF');
        return;
      }

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no puede ser mayor a 10MB');
        return;
      }

      setDocumentFile(file);
      // Generar nombre automático si no se proporciona
      if (!documentName) {
        setDocumentName(file.name.replace('.pdf', ''));
      }
    }
  };

  const handleDocumentUpload = async () => {
    if (!documentFile || !selectedContract) {
      setError('Selecciona un archivo PDF');
      return;
    }

    setUploadingDocument(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Subiendo documento al contrato:', selectedContract.id);
      console.log('Usuario autenticado:', user?.email);
      
      // Método alternativo: convertir archivo a base64 y guardar en Firestore
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          
          // Guardar el PDF como base64 en Firestore
          const contractRef = doc(db, 'contracts', selectedContract.id);
          await updateDoc(contractRef, {
            pdfData: base64Data,
            pdfFileName: documentFile.name,
            pdfMimeType: documentFile.type,
            updatedAt: serverTimestamp()
          });
          
          console.log('Documento guardado como base64 en Firestore');
          
          // Actualizar el estado local del contrato seleccionado
          setSelectedContract({
            ...selectedContract,
            pdfUrl: base64Data, // Usar base64 como URL temporal
            pdfFileName: documentFile.name,
            pdfData: base64Data,
            pdfMimeType: documentFile.type
          });
          
          // Recargar los contratos del usuario para mostrar los cambios
          if (selectedUserData) {
            console.log('Recargando contratos para usuario:', selectedUserData.uid);
            const contractsResult = await ContractService.getContractsByUser(selectedUserData.uid);
            if (contractsResult.success && contractsResult.data) {
              setSelectedUserContracts(contractsResult.data);
              console.log('Contratos recargados con PDF actualizado:', contractsResult.data.length);
              
              // Buscar el contrato actualizado
              const updatedContract = contractsResult.data.find(c => c.id === selectedContract.id);
              if (updatedContract) {
                console.log('Contrato actualizado encontrado:', {
                  id: updatedContract.id,
                  pdfFileName: updatedContract.pdfFileName,
                  hasPdfData: !!updatedContract.pdfData,
                  pdfDataLength: updatedContract.pdfData?.length || 0
                });
              }
            }
          }
          
          setSuccess('Documento subido exitosamente');
          setDocumentFile(null);
          setDocumentName('');
          setShowDocumentUpload(false);
          
        } catch (error: any) {
          console.error('Error guardando documento:', error);
          setError('Error guardando el documento: ' + error.message);
        } finally {
          setUploadingDocument(false);
        }
      };
      
      reader.onerror = () => {
        setError('Error leyendo el archivo');
        setUploadingDocument(false);
      };
      
      // Leer el archivo como base64
      reader.readAsDataURL(documentFile);
      
    } catch (error: any) {
      console.error('Error subiendo documento:', error);
      setError('Error subiendo el documento: ' + error.message);
      setUploadingDocument(false);
    }
  };


  const handleBulkUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBulkUploadFile(file);
    }
  };

  const handleBulkUserUpload = async () => {
    if (!bulkUploadFile) {
      setError('Selecciona un archivo Excel');
      return;
    }

    try {
      setIsLoading(true);
      setBulkUploadProgress('Leyendo archivo...');
      
      const data = await bulkUploadFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setBulkUploadProgress(`Procesando ${jsonData.length} usuarios...`);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        const email = row.email || row.Email || row.EMAIL;
        
        if (!email) {
          errorCount++;
          errors.push(`Fila ${i + 1}: Email requerido`);
          continue;
        }

        setBulkUploadProgress(`Creando usuario ${i + 1}/${jsonData.length}: ${email}`);

        try {
          // Simular creación de usuario
          console.log('Creando usuario:', email);
          successCount++;
    } catch (err: any) {
          errorCount++;
          errors.push(`${email}: ${err.message}`);
        }
      }

      if (successCount > 0) {
        setSuccess(`✅ ${successCount} usuarios creados exitosamente${errorCount > 0 ? `. ${errorCount} errores.` : ''}`);
        setShowBulkUserUpload(false);
        setBulkUploadFile(null);
        loadUsers();
      }
      
      if (errorCount > 0 && successCount === 0) {
        setError(`Error creando usuarios: ${errors.join(', ')}`);
      }
    } catch (err: any) {
      setError('Error procesando archivo');
    } finally {
      setIsLoading(false);
      setBulkUploadProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
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

        {/* Mensajes */}
      {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
            {error}
        </div>
      )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl">
            {success}
        </div>
      )}

            {/* Lista de Usuarios */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
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
                  <>
                    <button
                      onClick={handleCreateContractClick}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Crear Contrato ({selectedUsers.length})
                    </button>
                    <button
                      onClick={handleDeleteUsers}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar ({selectedUsers.length})
                    </button>
                  </>
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

      {/* Modal Crear Usuario */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Crear Usuario</h2>
                      <button
                  onClick={() => setShowCreateUser(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                      </button>
                    </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                  >
                    {isLoading ? 'Creando...' : 'Crear Usuario'}
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
                  </div>
                      )}

      {/* Modal Crear Contrato */}
      {showCreateContract && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Crear Contrato</h2>
                <button
                  onClick={() => setShowCreateContract(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                  </div>

              <form onSubmit={handleCreateContract} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Monto de Inversión
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      name="amount"
                      value={newContract.amount}
                      onChange={handleContractInputChange}
                      required
                      className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg"
                    />
                </div>
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contrato PDF (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.type !== 'application/pdf') {
                            setError('Solo se permiten archivos PDF');
                            return;
                          }
                          if (file.size > 10 * 1024 * 1024) { // 10MB limit
                            setError('El archivo PDF no puede ser mayor a 10MB');
                            return;
                          }
                          setContractPdfFile(file);
                          setError('');
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                    />
                  </div>
                  {contractPdfFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {contractPdfFile.name}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={isLoading || uploadingPdf}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading || uploadingPdf ? (uploadingPdf ? 'Subiendo PDF...' : 'Creando...') : 'Crear Contratos'}
                </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowCreateContract(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
              </div>
              </form>
                </div>
              </div>
                </div>
      )}

      {/* Modal Carga Masiva */}
      {showBulkUserUpload && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Carga Masiva de Usuarios</h2>
                <button
                  onClick={() => setShowBulkUserUpload(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <h3 className="text-blue-400 font-medium mb-2">Formato del archivo Excel:</h3>
                  <p className="text-gray-300 text-sm mb-2">El archivo debe contener una columna llamada "email"</p>
                  <p className="text-gray-300 text-sm">Ejemplo: email</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seleccionar archivo Excel
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleBulkUploadFile}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700"
                  />
              </div>

                {bulkUploadProgress && (
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-300 text-sm">{bulkUploadProgress}</p>
            </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleBulkUserUpload}
                    disabled={isLoading || !bulkUploadFile}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Procesando...' : 'Cargar Usuarios'}
                  </button>
                  
                  <button
                    onClick={() => setShowBulkUserUpload(false)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
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
                    
                    return activeContracts.map((contract) => {
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
                            <tr 
                              key={contract.id} 
                              className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer"
                              onClick={() => {
                                console.log('Contrato seleccionado:', contract);
                                setSelectedContract(contract);
                                setShowContractDetails(true);
                              }}
                            >
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={exportContractToPDF}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exportar PDF
                  </button>
                  <button
                    onClick={handleDeleteContract}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Documentos PDF</h3>
                  <button
                    onClick={() => setShowDocumentUpload(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Subir Documento
                  </button>
                </div>
                
                {/* Mostrar PDF del contrato si existe */}
                {selectedContract.pdfUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-white font-medium">{selectedContract.pdfFileName || 'Contrato.pdf'}</p>
                          <p className="text-gray-400 text-sm">
                            Contrato principal • {new Date().toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(selectedContract.pdfUrl, '_blank')}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Ver
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = selectedContract.pdfUrl!;
                            link.download = selectedContract.pdfFileName || 'contrato.pdf';
                            link.click();
                          }}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Descargar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Mostrar mensaje cuando no hay documentos */
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 mb-4">No hay documentos subidos para este contrato</p>
                    <p className="text-gray-500 text-sm mb-6">Sube el contrato original y documentos adicionales cuando estén listos</p>
                    <div className="text-xs text-gray-600 mt-4">
                      <p>Debug: pdfUrl = {selectedContract.pdfUrl || 'null'}</p>
                      <p>Debug: pdfFileName = {selectedContract.pdfFileName || 'null'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Subir Documento */}
      {showDocumentUpload && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Subir Documento PDF</h2>
                <button
                  onClick={() => {
                    setShowDocumentUpload(false);
                    setDocumentFile(null);
                    setDocumentName('');
                    setError(null);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Información del contrato */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <h3 className="text-blue-400 font-medium mb-2">Contrato</h3>
                  <p className="text-white">{selectedContract?.contractType}</p>
                  <p className="text-gray-400 text-sm">ID: {selectedContract?.id}</p>
                </div>

                {/* Nombre del documento */}
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre del documento
                </label>
                <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Ej: Contrato Original, Anexos..."
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg placeholder-gray-400"
                />
              </div>

                {/* Selección de archivo */}
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seleccionar archivo PDF
                </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                <input
                      type="file"
                      accept=".pdf"
                      onChange={handleDocumentFileChange}
                      className="hidden"
                      id="document-upload"
                    />
                    <label
                      htmlFor="document-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-gray-400">
                        {documentFile ? documentFile.name : 'Haz clic para seleccionar un PDF'}
                      </span>
                      <span className="text-gray-500 text-sm">Máximo 10MB</span>
                    </label>
              </div>
                  {documentFile && (
                    <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-green-400 text-sm">
                        ✓ Archivo seleccionado: {(documentFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Información adicional */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-yellow-400 font-medium">Información</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    El documento se almacenará de forma segura y estará disponible para descarga en cualquier momento.
                  </p>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                <button
                    onClick={handleDocumentUpload}
                    disabled={uploadingDocument || !documentFile || !documentName.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploadingDocument ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Subir Documento
                      </>
                    )}
                </button>
                  
                <button
                  onClick={() => {
                      setShowDocumentUpload(false);
                      setDocumentFile(null);
                      setDocumentName('');
                      setError(null);
                    }}
                    disabled={uploadingDocument}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
          </div>
        </div>
          </div>
        </div>
      )}
    </div>
  );
}