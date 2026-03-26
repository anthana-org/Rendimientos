import React, { useState, useEffect } from 'react';
import { UserService } from '../services/userService';
import { ContractService } from '../services/contractService';
import { AdminAuthService } from '../services/adminAuthService';
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
  userId?: string;
  contractType: string;
  investmentAmount: number;
  monthlyReturn: number;
  startDate: string;
  expirationDate: string;
  status: string;
  remainingDays?: number;
  pdfUrl?: string;
  pdfFileName?: string;
  pdfData?: string; // Base64 data (deprecated - use pdfUrl from Storage instead)
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

  // Estado para tabs y reportes
  const [activeTab, setActiveTab] = useState<'users' | 'reports'>('users');
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

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

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      const response = await ContractService.getAllContracts();
      if (response.success && response.data) {
        setAllContracts(response.data as Contract[]);
      }
    } catch (err) {
      // silent
    } finally {
      setLoadingReports(false);
    }
  };

  // Helper function to upload PDF to Firebase Storage
  const uploadPdfToStorage = async (file: File, userId: string, contractId?: string): Promise<string> => {
    console.log('Iniciando subida de PDF a Storage...', { fileName: file.name, size: file.size, userId, contractId });
    
    if (!storage) {
      console.error('Firebase Storage no está inicializado');
      throw new Error('Firebase Storage no está configurado. Verifica las variables de entorno.');
    }

    try {
      const fileName = contractId 
        ? `contracts/${userId}/${contractId}_${file.name}`
        : `contracts/${userId}/${Date.now()}_${file.name}`;
      
      console.log('Ruta del archivo en Storage:', fileName);
      
      const storageRef = ref(storage, fileName);
      
      // Subir archivo con timeout para evitar que se quede colgado (60 segundos)
      console.log('Subiendo bytes a Storage...', `Tamaño: ${(file.size / 1024).toFixed(2)} KB`);
      const uploadTask = uploadBytes(storageRef, file);
      
      // Crear timeout controlado
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('La subida del archivo tomó demasiado tiempo (timeout de 60 segundos). Verifica tu conexión a internet.'));
        }, 60000); // 60 segundos para archivos más grandes
      });
      
      try {
        await Promise.race([uploadTask, timeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);
        console.log('Archivo subido exitosamente a Storage');
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }
      
      // Obtener URL de descarga
      console.log('Obteniendo URL de descarga...');
      const downloadURL = await getDownloadURL(storageRef);
      console.log('URL de descarga obtenida:', downloadURL);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Error detallado en uploadPdfToStorage:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });
      
      // Mensajes de error más descriptivos
      if (error.code === 'storage/unauthorized') {
        throw new Error('No tienes permisos para subir archivos. Verifica las reglas de Firebase Storage.');
      } else if (error.code === 'storage/canceled') {
        throw new Error('La subida fue cancelada.');
      } else if (error.code === 'storage/unknown') {
        throw new Error('Error desconocido al subir el archivo. Verifica tu conexión a internet.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('La subida tardó demasiado. Intenta con un archivo más pequeño o verifica tu conexión.');
      } else {
        throw new Error(`Error al subir PDF: ${error.message || 'Error desconocido'}`);
      }
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

    if (!newUser.email || !newUser.password) {
      setError('Email y contraseña son requeridos');
      setIsLoading(false);
      return;
    }

    if (newUser.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const result = await AdminAuthService.createUser({
        email: newUser.email,
        password: newUser.password,
      });

      if (result.success) {
        if (result.requiresReauth) {
          // Si requiere reautenticación, mostrar alerta y redirigir
          alert(`✅ Usuario ${newUser.email} creado exitosamente.\n\n⚠️ IMPORTANTE: Tu sesión fue cerrada por seguridad.\n\nPor favor, vuelve a iniciar sesión como administrador.`);
          // Redirigir al login
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
        } else {
          setSuccess(`Usuario ${newUser.email} creado exitosamente.`);
          setNewUser({ email: '', password: '' });
          setShowCreateUser(false);
          
          // Limpiar mensaje de éxito después de 5 segundos
          setTimeout(() => {
            setSuccess(null);
          }, 5000);
          
          // Recargar usuarios
          loadUsers();
        }
      } else {
        setError(result.error || 'Error creando usuario');
      }
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
    setUploadingPdf(!!contractPdfFile); // Solo activar si hay PDF
    setError(null);
    setSuccess(null);

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Si hay PDF, subirlo una sola vez y reutilizar la URL para todos los usuarios
      let sharedPdfUrl: string | undefined = undefined;
      
      if (contractPdfFile && selectedUsers.length > 0) {
        try {
          const firstUser = users.find(u => selectedUsers.includes(u.uid));
          if (firstUser) {
            console.log(`Subiendo PDF compartido a Storage:`, contractPdfFile.name);
            setSuccess(`Subiendo PDF...`);
            sharedPdfUrl = await uploadPdfToStorage(contractPdfFile, firstUser.uid);
            console.log(`PDF compartido subido exitosamente:`, sharedPdfUrl);
            setSuccess(`PDF subido. Creando contratos...`);
          }
        } catch (uploadError: any) {
          console.error(`Error subiendo PDF compartido:`, uploadError);
          const errorMsg = uploadError.message || 'Error desconocido al subir PDF';
          setError(`Error subiendo PDF: ${errorMsg}`);
          setIsLoading(false);
          setUploadingPdf(false);
          return; // Salir si falla la subida del PDF
        }
      }

      for (const userId of selectedUsers) {
        const user = users.find(u => u.uid === userId);
        if (!user) continue;

        setUploadingPdf(false); // Ya terminó la subida del PDF
        setIsLoading(true); // Pero aún estamos creando contratos

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
          pdfUrl: sharedPdfUrl,
          pdfFileName: contractPdfFile?.name || undefined,
          pdfMimeType: contractPdfFile?.type || undefined
          // Removed pdfData to avoid exceeding Firestore document size limit
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

  const handleUpdateContractStatus = async (contractId: string, newStatus: 'active' | 'inactive' | 'expired') => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await ContractService.updateContractStatus(contractId, newStatus);
      
      if (result.success) {
        const statusLabel = newStatus === 'active' ? 'Activo' : newStatus === 'inactive' ? 'Inactivo' : 'Vencido';
        setSuccess(`✅ Estado del contrato actualizado a "${statusLabel}"`);
        
        // Actualizar el contrato seleccionado si es el mismo
        if (selectedContract && selectedContract.id === contractId) {
          setSelectedContract({ ...selectedContract, status: newStatus });
        }
        
        // Recargar los contratos del usuario si estamos viendo contratos de un usuario específico
        if (selectedUserData) {
          const contractsResult = await ContractService.getContractsByUser(selectedUserData.uid);
          if (contractsResult.success && contractsResult.data) {
            setSelectedUserContracts(contractsResult.data);
          }
        }
      } else {
        setError(`Error actualizando estado del contrato: ${result.error}`);
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
        console.log('Detalles de PDFs en contratos cargados:');
        result.data.forEach((contract, index) => {
          console.log(`Contrato ${index + 1} (${contract.id}):`, {
            pdfFileName: contract.pdfFileName,
            hasPdfData: !!contract.pdfData,
            pdfDataLength: contract.pdfData?.length || 0,
            pdfUrl: contract.pdfUrl,
            pdfMimeType: contract.pdfMimeType
          });
        });
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
      setError(null); // Limpiar errores previos
      
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF');
        return;
      }

      // Validar tamaño (máximo 10MB para Firebase Storage)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError(`El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). El máximo permitido es 10MB.`);
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

    if (!documentName.trim()) {
      setError('Ingresa un nombre para el documento');
      return;
    }

    setUploadingDocument(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Subiendo documento al contrato:', selectedContract.id);
      console.log('Usuario autenticado:', user?.email);
      console.log('Archivo:', {
        name: documentFile.name,
        size: documentFile.size,
        type: documentFile.type
      });
      
      // Upload PDF to Firebase Storage instead of storing as base64
      let pdfUrl: string;
      try {
        const userId = selectedContract.userId || selectedUserData?.uid || '';
        if (!userId) {
          throw new Error('No se pudo identificar el usuario del contrato');
        }
        pdfUrl = await uploadPdfToStorage(documentFile, userId, selectedContract.id);
        console.log('Documento subido a Storage exitosamente:', pdfUrl);
      } catch (uploadError: any) {
        console.error('Error subiendo PDF a Storage:', uploadError);
        setError('Error subiendo el documento: ' + uploadError.message);
        setUploadingDocument(false);
        return;
      }
      
      // Update contract document in Firestore with Storage URL (remove pdfData)
      const contractRef = doc(db, 'contracts', selectedContract.id);
      await updateDoc(contractRef, {
        pdfUrl: pdfUrl,
        pdfFileName: documentName || documentFile.name,
        pdfMimeType: documentFile.type,
        updatedAt: serverTimestamp()
      });
      
      console.log('Documento guardado en Firestore con URL de Storage');
      
      // Update local state
      setSelectedContract({
        ...selectedContract,
        pdfUrl: pdfUrl,
        pdfFileName: documentName || documentFile.name,
        pdfMimeType: documentFile.type
      });
      
      // Reload user contracts to show changes
      if (selectedUserData) {
        console.log('Recargando contratos para usuario:', selectedUserData.uid);
        const contractsResult = await ContractService.getContractsByUser(selectedUserData.uid);
        if (contractsResult.success && contractsResult.data) {
          setSelectedUserContracts(contractsResult.data);
          console.log('Contratos recargados con PDF actualizado:', contractsResult.data.length);
          
          // Find updated contract
          const updatedContract = contractsResult.data.find(c => c.id === selectedContract.id);
          if (updatedContract) {
            console.log('Contrato actualizado encontrado:', {
              id: updatedContract.id,
              pdfFileName: updatedContract.pdfFileName,
              pdfUrl: updatedContract.pdfUrl,
              pdfMimeType: updatedContract.pdfMimeType
            });
            
            // Update selected contract with fresh data
            setSelectedContract(updatedContract);
          } else {
            console.error('No se encontró el contrato actualizado en la lista recargada');
          }
        }
      }
      
      setSuccess('Documento subido exitosamente');
      setDocumentFile(null);
      setDocumentName('');
      
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        setShowDocumentUpload(false);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error subiendo documento:', error);
      const errorMessage = error.message || 'Error desconocido al subir el documento';
      setError('Error subiendo el documento: ' + errorMessage);
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
      setError('Selecciona un archivo Excel o CSV');
      return;
    }

    try {
      setIsLoading(true);
      setBulkUploadProgress('Leyendo archivo...');
      
      let jsonData: any[] = [];
      
      // Leer archivo (Excel o CSV) usando XLSX que maneja ambos formatos
      const data = await bulkUploadFile.arrayBuffer();
      
      // Leer el archivo usando XLSX (maneja tanto Excel como CSV)
      const workbook = XLSX.read(data, { 
        type: 'array'
      });
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (!jsonData || jsonData.length === 0) {
        setError('El archivo está vacío o no se pudo leer correctamente');
        setIsLoading(false);
        setBulkUploadProgress('');
        return;
      }
      
      console.log('Datos leídos:', jsonData.length, 'filas');
      console.log('Primera fila de ejemplo:', jsonData[0]);

      setBulkUploadProgress(`Procesando ${jsonData.length} usuarios...`);
      
      // Guardar información del admin antes de crear usuarios (para logging)
      const adminInfo = user ? {
        email: user.email || '',
        uid: user.uid
      } : null;
      
      console.log('Admin actual:', adminInfo);
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      let requiresReauth = false;

      // Detectar nombres de columnas del archivo (primera fila)
      const firstRow = jsonData[0] as any;
      const columnNames = Object.keys(firstRow || {});
      console.log('Columnas encontradas en el archivo:', columnNames);
      
      // Buscar columnas de email con múltiples variantes
      const findColumn = (variants: string[]) => {
        for (const variant of variants) {
          // Buscar exacto
          if (columnNames.includes(variant)) return variant;
          // Buscar case-insensitive
          const found = columnNames.find(col => col.toLowerCase() === variant.toLowerCase());
          if (found) return found;
        }
        return null;
      };
      
      const emailColumn = findColumn(['email', 'correo', 'mail', 'e-mail']);
      const passwordColumn = findColumn(['password', 'contraseña', 'pass', 'pwd']);
      const nameColumn = findColumn(['name', 'nombre', 'displayName', 'displayname']);
      const phoneColumn = findColumn(['phone', 'telefono', 'phoneNumber', 'phonenumber', 'tel']);
      
      console.log('Columnas detectadas:', {
        email: emailColumn,
        password: passwordColumn,
        name: nameColumn,
        phone: phoneColumn
      });
      
      if (!emailColumn) {
        setError(`No se encontró columna de email. Columnas disponibles: ${columnNames.join(', ')}`);
        setIsLoading(false);
        setBulkUploadProgress('');
        return;
      }
      
      if (!passwordColumn) {
        setError(`No se encontró columna de contraseña. Columnas disponibles: ${columnNames.join(', ')}`);
        setIsLoading(false);
        setBulkUploadProgress('');
        return;
      }

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as any;
        const email = row[emailColumn]?.toString().trim();
        const password = row[passwordColumn]?.toString().trim();
        const displayName = nameColumn ? row[nameColumn]?.toString().trim() : email;
        const phoneNumber = phoneColumn ? row[phoneColumn]?.toString().trim() : '';
        
        if (!email) {
          errorCount++;
          errors.push(`Fila ${i + 1}: Email requerido`);
          continue;
        }

        if (!password) {
          errorCount++;
          errors.push(`Fila ${i + 1}: Contraseña requerida`);
          continue;
        }

        setBulkUploadProgress(`Creando usuario ${i + 1}/${jsonData.length}: ${email}`);

        try {
          // Verificar si el usuario ya existe
          const existingUser = await UserService.getUserByEmail(email);
          if (existingUser.success && existingUser.data) {
            console.log(`Usuario ${email} ya existe, omitiendo...`);
            continue;
          }

          // Crear el usuario usando AdminAuthService
          const result = await AdminAuthService.createUser({
            email: email.trim(),
            password: password.trim(),
            displayName: displayName?.trim() || email.trim(),
            phoneNumber: phoneNumber?.trim() || ''
          });

          if (result.success) {
            successCount++;
            console.log(`✅ Usuario creado: ${email}`);
            
            // Si requiere reautenticación, marcar la bandera
            if (result.requiresReauth) {
              requiresReauth = true;
            }
          } else {
            errorCount++;
            errors.push(`${email}: ${result.error || 'Error desconocido'}`);
          }
        } catch (err: any) {
          errorCount++;
          errors.push(`${email}: ${err.message || 'Error desconocido'}`);
        }
      }

      if (successCount > 0) {
        const message = `✅ ${successCount} usuarios creados exitosamente${errorCount > 0 ? `. ${errorCount} errores.` : ''}`;
        
        if (requiresReauth) {
          // Mostrar alerta antes de redirigir
          alert(`${message}\n\n⚠️ IMPORTANTE: Tu sesión fue cerrada por seguridad.\n\nPor favor, vuelve a iniciar sesión como administrador.`);
          // Esperar un momento y luego redirigir al login
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
        } else {
          setSuccess(message);
          setShowBulkUserUpload(false);
          setBulkUploadFile(null);
          // Esperar un momento para que Firebase sincronice antes de recargar
          setTimeout(() => {
            loadUsers();
          }, 1000);
        }
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

  const renderReports = () => {
    if (loadingReports) {
      return (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando reportes...</p>
        </div>
      );
    }
    const activeC = allContracts.filter(c => c.status === 'active');
    const expiredC = allContracts.filter(c => c.status === 'expired');
    const inactiveC = allContracts.filter(c => c.status === 'inactive');
    const totalCapital = activeC.reduce((s, c) => s + (c.investmentAmount || 0), 0);
    const totalGains = activeC.reduce((s, c) => {
      const start = new Date(c.startDate);
      const now = new Date();
      const daysElapsed = Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return s + (c.investmentAmount * (c.monthlyReturn / 100) * (daysElapsed / 30));
    }, 0);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs mb-1">Contratos Activos</p>
            <p className="text-2xl font-bold text-green-400">{activeC.length}</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs mb-1">Contratos Vencidos</p>
            <p className="text-2xl font-bold text-red-400">{expiredC.length}</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs mb-1">Capital bajo gestión</p>
            <p className="text-xl font-bold text-white">{`$${totalCapital.toLocaleString()}`}</p>
          </div>
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-xs mb-1">Ganancias generadas</p>
            <p className="text-xl font-bold text-green-400">{`+$${Math.round(totalGains).toLocaleString()}`}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="text-white font-semibold">Todos los Contratos ({allContracts.length})</h3>
            <span className="text-gray-400 text-sm">{inactiveC.length} inactivos</span>
          </div>
          {allContracts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50 text-left">
                    <th className="py-3 px-4 text-gray-400 font-medium">Usuario</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">Tipo</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">Monto</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">Rend.%</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">Ganancias</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">Vencimiento</th>
                    <th className="py-3 px-4 text-gray-400 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {allContracts.map(c => {
                    const start = new Date(c.startDate);
                    const now = new Date();
                    const daysElapsed = Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    const gains = c.status === 'active' ? Math.round(c.investmentAmount * (c.monthlyReturn / 100) * (daysElapsed / 30)) : 0;
                    const contractData = c as any;
                    const statusLabel = c.status === 'active' ? 'Activo' : c.status === 'expired' ? 'Vencido' : 'Inactivo';
                    const statusClass = c.status === 'active' ? 'bg-green-500/20 text-green-400' : c.status === 'expired' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400';
                    return (
                      <tr key={c.id} className="border-b border-gray-700/30 hover:bg-gray-800/30">
                        <td className="py-3 px-4 text-gray-300 text-xs">{contractData.userEmail || c.userId || '-'}</td>
                        <td className="py-3 px-4 text-white">{c.contractType}</td>
                        <td className="py-3 px-4 text-white">{`$${(c.investmentAmount || 0).toLocaleString()}`}</td>
                        <td className="py-3 px-4 text-green-400 font-bold">{c.monthlyReturn || 0}%</td>
                        <td className="py-3 px-4 text-green-400">{`+$${gains.toLocaleString()}`}</td>
                        <td className="py-3 px-4 text-gray-300">{c.expirationDate}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-400">No hay contratos registrados</p>
            </div>
          )}
        </div>
      </div>
    );
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700 pb-0">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 font-semibold text-sm rounded-t-lg transition-colors ${
              activeTab === 'users'
                ? 'bg-gray-800 text-white border border-b-0 border-gray-700'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Usuarios
          </button>
          <button
            onClick={() => { setActiveTab('reports'); loadReports(); }}
            className={`px-5 py-2.5 font-semibold text-sm rounded-t-lg transition-colors ${
              activeTab === 'reports'
                ? 'bg-gray-800 text-white border border-b-0 border-gray-700'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Reportes
          </button>
        </div>

        {/* Tab: Reportes */}
        {activeTab === 'reports' && renderReports()}

        {/* Tab: Lista de Usuarios */}
        {activeTab === 'users' && (
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
        )}
      </div>

      {/* Modal Crear Usuario */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Crear Usuario</h2>
                      <button
                  onClick={() => {
                    setShowCreateUser(false);
                    setError(null);
                    setSuccess(null);
                    setNewUser({ email: '', password: '' });
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                      >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                      </button>
                    </div>

              {/* Mensajes de error y éxito */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

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

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-yellow-400 text-xs leading-relaxed">
                      <strong>Importante:</strong> Al crear este usuario, tu sesión cerrará automáticamente por seguridad. Deberás volver a iniciar sesión como administrador.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                  >
                    {isLoading ? 'Creando...' : 'Crear Usuario'}
                                  </button>

                                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateUser(false);
                      setError(null);
                      setSuccess(null);
                      setNewUser({ email: '', password: '' });
                    }}
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
              {(() => {
                const now = new Date();
                const completedContracts = selectedUserContracts.filter(c => {
                  const expirationDate = new Date(c.expirationDate);
                  const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return c.status === 'expired' || daysRemaining < 0;
                });
                
                const totalEarnings = completedContracts.reduce((sum, contract) => {
                  const startDate = new Date(contract.startDate);
                  const expirationDate = new Date(contract.expirationDate);
                  const contractDurationMonths = Math.max(1, Math.ceil(
                    (expirationDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
                  ));
                  const investmentAmount = contract.investmentAmount || 0;
                  const monthlyReturnPct = contract.monthlyReturn || 0;
                  return sum + (investmentAmount * (monthlyReturnPct / 100) * contractDurationMonths);
                }, 0);
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl p-4 border border-purple-500/30">
                      <p className="text-purple-400 text-sm font-medium mb-1">Ganancias Totales</p>
                      <p className="text-white text-2xl font-bold">
                        ${totalEarnings.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-purple-300 text-xs mt-1">
                        {completedContracts.length} contrato{completedContracts.length !== 1 ? 's' : ''} finalizado{completedContracts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                );
              })()}
              
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
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Ganancia</th>
                      </tr>
                    </thead>
                      <tbody>
                        {selectedUserContracts.map((contract) => {
                          // Calcular días restantes
                          const now = new Date();
                          const startDate = new Date(contract.startDate);
                          const expirationDate = new Date(contract.expirationDate);
                          const timeDiff = expirationDate.getTime() - now.getTime();
                          const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                          
                          // Determinar si el contrato está finalizado
                          const isCompleted = contract.status === 'expired' || daysRemaining < 0;
                          
                          // Calcular ganancia para contratos finalizados
                          let earnings = null;
                          if (isCompleted) {
                            // Calcular duración del contrato en meses
                            const contractDurationMonths = Math.max(1, Math.ceil(
                              (expirationDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
                            ));
                            
                            // Ganancia total = monto invertido * (rendimiento mensual / 100) * meses
                            const investmentAmount = contract.investmentAmount || 0;
                            const monthlyReturnPct = contract.monthlyReturn || 0;
                            earnings = investmentAmount * (monthlyReturnPct / 100) * contractDurationMonths;
                          }
                          
                          return (
                            <tr 
                              key={contract.id} 
                              className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer"
                              onClick={() => {
                                console.log('Contrato seleccionado:', contract);
                                console.log('Datos de PDF del contrato seleccionado:', {
                                  pdfFileName: contract.pdfFileName,
                                  hasPdfData: !!contract.pdfData,
                                  pdfDataLength: contract.pdfData?.length || 0,
                                  pdfUrl: contract.pdfUrl,
                                  pdfMimeType: contract.pdfMimeType
                                });
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
                              <td className="py-3 px-4">
                                {isCompleted && earnings !== null ? (
                                  <span className="text-green-400 font-bold">
                                    +${earnings.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 text-sm">-</span>
                                )}
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
                    <p className="text-gray-400 text-sm mb-2">Estado</p>
                    <select
                      value={selectedContract.status || 'active'}
                      onChange={(e) => {
                        const newStatus = e.target.value as 'active' | 'inactive' | 'expired';
                        handleUpdateContractStatus(selectedContract.id, newStatus);
                      }}
                      disabled={isLoading}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        selectedContract.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        selectedContract.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-red-500/20 text-red-400'
                      }`}
                      style={{
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23fff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="active" className="bg-gray-800 text-green-400">Activo</option>
                      <option value="inactive" className="bg-gray-800 text-gray-400">Inactivo</option>
                      <option value="expired" className="bg-gray-800 text-red-400">Vencido</option>
                    </select>
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
                {(selectedContract.pdfUrl || selectedContract.pdfData) ? (
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
                          onClick={() => {
                            const pdfUrl = selectedContract.pdfUrl || selectedContract.pdfData;
                            if (pdfUrl) {
                              // If it's a base64 data URL, download directly
                              if (pdfUrl.startsWith('data:')) {
                                const link = document.createElement('a');
                                link.href = pdfUrl;
                                link.download = selectedContract.pdfFileName || 'contrato.pdf';
                                link.click();
                              } else {
                                // For Storage URLs, open in new tab (download attribute doesn't work cross-origin)
                                window.open(pdfUrl, '_blank');
                              }
                            }
                          }}
                          className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {selectedContract.pdfUrl && !selectedContract.pdfUrl.startsWith('data:') ? 'Ver PDF' : 'Descargar'}
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
                      <p>Debug: hasPdfData = {selectedContract.pdfData ? 'true' : 'false'}</p>
                      <p>Debug: pdfDataLength = {selectedContract.pdfData?.length || 0}</p>
                      <p>Debug: pdfMimeType = {selectedContract.pdfMimeType || 'null'}</p>
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
                    setSuccess(null);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Mensajes de error y éxito */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  </div>
                )}
                {success && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-green-400 text-sm">{success}</p>
                    </div>
                  </div>
                )}

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
                      setSuccess(null);
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