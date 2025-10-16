import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, serverTimestamp } from 'firebase/firestore';

export interface ContractData {
  id?: string;
  userId: string;
  userEmail: string;
  contractType: string;
  startDate: string;
  expirationDate: string;
  investmentAmount: number;
  monthlyReturn: number;
  status: 'active' | 'inactive' | 'expired';
  lastNotification?: string;
  createdAt?: any;
  updatedAt?: any;
  remainingDays?: number;
  contractDuration?: number;
}

export interface ContractExpiration {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userPhone?: string;
  userCreatedAt?: any;
  contractType: string;
  startDate: string;
  expirationDate: string;
  investmentAmount: number;
  monthlyReturn: number;
  status: 'active' | 'inactive' | 'expired';
  lastNotification: string;
  remainingDays: number;
  daysRemaining: number;
  contractDuration: number;
  pdfUrl?: string;
  pdfFileName?: string;
}

export interface ExpirationConfig {
  daysBeforeExpiration: number;
  autoNotificationEnabled: boolean;
  notificationEmail: string;
}

export class ContractService {
  static async createContract(contractData: Omit<ContractData, 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const docRef = await addDoc(collection(db, 'contracts'), {
        ...contractData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { success: true, id: docRef.id };
    } catch (error: any) {
      console.error('Error creando contrato:', error);
      return { success: false, error: error.message };
    }
  }

  static async deleteContract(contractId: string): Promise<{ success: boolean; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const contractRef = doc(db, 'contracts', contractId);
      await deleteDoc(contractRef);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error eliminando contrato:', error);
      return { success: false, error: error.message };
    }
  }

  static async getAllContracts(): Promise<{ success: boolean; data?: ContractExpiration[]; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const contractsRef = collection(db, 'contracts');
      const snapshot = await getDocs(contractsRef);

      const contracts: ContractExpiration[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const now = new Date();
        const expirationDate = new Date(data.expirationDate);
        const startDate = new Date(data.startDate);
        
        const remainingDays = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const contractDuration = Math.ceil((expirationDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        contracts.push({
          id: doc.id,
          userId: data.userId,
          userEmail: data.userEmail,
          contractType: data.contractType,
          startDate: data.startDate,
          expirationDate: data.expirationDate,
          investmentAmount: data.investmentAmount || 0,
          monthlyReturn: data.monthlyReturn || 0,
          status: data.status || 'active',
          lastNotification: data.lastNotification || '',
          remainingDays,
          daysRemaining: remainingDays,
          contractDuration,
          pdfUrl: data.pdfUrl || null,
          pdfFileName: data.pdfFileName || null
        });
      });

      // Ordenar por fecha de vencimiento (más próximos primero)
      contracts.sort((a, b) => a.remainingDays - b.remainingDays);

      return { success: true, data: contracts };
    } catch (error: any) {
      console.error('Error obteniendo contratos:', error);
      return { success: false, error: error.message };
    }
  }

  static async getContractsByUser(userId: string): Promise<{ success: boolean; data?: ContractExpiration[]; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const contractsRef = collection(db, 'contracts');
      // Temporalmente sin orderBy mientras se construye el índice
      const q = query(contractsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const contracts: ContractExpiration[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const now = new Date();
        const expirationDate = new Date(data.expirationDate);
        const startDate = new Date(data.startDate);
        
        const remainingDays = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const contractDuration = Math.ceil((expirationDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        contracts.push({
          id: doc.id,
          userId: data.userId,
          userEmail: data.userEmail,
          contractType: data.contractType,
          startDate: data.startDate,
          expirationDate: data.expirationDate,
          investmentAmount: data.investmentAmount || 0,
          monthlyReturn: data.monthlyReturn || 0,
          status: data.status || 'active',
          lastNotification: data.lastNotification || '',
          remainingDays,
          daysRemaining: remainingDays,
          contractDuration,
          pdfUrl: data.pdfUrl || null,
          pdfFileName: data.pdfFileName || null
        });
      });

      // Ordenar en memoria por fecha de expiración (más reciente primero)
      contracts.sort((a, b) => {
        const dateA = new Date(a.expirationDate).getTime();
        const dateB = new Date(b.expirationDate).getTime();
        return dateB - dateA;
      });

      return { success: true, data: contracts };
    } catch (error: any) {
      console.error('Error obteniendo contratos del usuario:', error);
      return { success: false, error: error.message };
    }
  }

  static async getExpiringContracts(daysBeforeExpiration: number = 30): Promise<{ success: boolean; data?: ContractExpiration[]; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const result = await this.getAllContracts();
      if (!result.success || !result.data) {
        return result;
      }

      const expiringContracts = result.data.filter(contract => 
        contract.remainingDays >= 0 && contract.remainingDays <= daysBeforeExpiration
      );

      return { success: true, data: expiringContracts };
    } catch (error: any) {
      console.error('Error obteniendo contratos próximos a vencer:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateContract(contractId: string, updates: Partial<ContractData>): Promise<{ success: boolean; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const contractRef = doc(db, 'contracts', contractId);
      await updateDoc(contractRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error actualizando contrato:', error);
      return { success: false, error: error.message };
    }
  }

  static async updateLastNotification(contractId: string, notificationDate: string): Promise<{ success: boolean; error?: string }> {
    return this.updateContract(contractId, { lastNotification: notificationDate });
  }

  static async updateContractStatus(contractId: string, status: 'active' | 'inactive' | 'expired'): Promise<{ success: boolean; error?: string }> {
    return this.updateContract(contractId, { status });
  }

  static async deleteContract(contractId: string): Promise<{ success: boolean; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      await deleteDoc(doc(db, 'contracts', contractId));
      return { success: true };
    } catch (error: any) {
      console.error('Error eliminando contrato:', error);
      return { success: false, error: error.message };
    }
  }

  static async getExpirationConfig(): Promise<{ success: boolean; data?: ExpirationConfig; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const configRef = doc(db, 'expiration_config', 'default');
      const configDoc = await getDoc(configRef);

      if (configDoc.exists()) {
        const data = configDoc.data();
        return { 
          success: true, 
          data: {
            daysBeforeExpiration: data.daysBeforeExpiration || 30,
            autoNotificationEnabled: data.autoNotificationEnabled || true,
            notificationEmail: data.notificationEmail || 'Su contrato está próximo a vencer'
          }
        };
      } else {
        // Crear configuración por defecto
        const defaultConfig: ExpirationConfig = {
          daysBeforeExpiration: 30,
          autoNotificationEnabled: true,
          notificationEmail: 'Su contrato está próximo a vencer'
        };
        return { success: true, data: defaultConfig };
      }
    } catch (error: any) {
      console.error('Error obteniendo configuración:', error);
      return { success: false, error: error.message };
    }
  }

  static async saveExpirationConfig(config: ExpirationConfig): Promise<{ success: boolean; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const configRef = doc(db, 'expiration_config', 'default');
      await updateDoc(configRef, {
        ...config,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error guardando configuración:', error);
      return { success: false, error: error.message };
    }
  }

  static async createSampleContracts(): Promise<{ success: boolean; createdCount?: number; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      // Obtener usuarios existentes
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      if (usersSnapshot.empty) {
        return { success: false, error: 'No hay usuarios para crear contratos de muestra' };
      }

      const sampleContracts: ContractData[] = [];
      const now = new Date();
      
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Crear 1-2 contratos por usuario
        const contractCount = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < contractCount; i++) {
          const startDate = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Últimos 90 días
          const durationDays = 30 + Math.floor(Math.random() * 300); // 30-330 días
          const expirationDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
          
          const contractData = {
            userId: userId,
            userEmail: userData.email || 'usuario@ejemplo.com',
            contractType: `Inversión ${i === 0 ? 'Principal' : 'Secundaria'}`,
            startDate: startDate.toISOString().split('T')[0],
            expirationDate: expirationDate.toISOString().split('T')[0],
            investmentAmount: 50000 + Math.floor(Math.random() * 450000), // $50k - $500k
            monthlyReturn: 1.5 + Math.random() * 2.5, // 1.5% - 4%
            status: 'active' as const,
            lastNotification: ''
          };
          
          sampleContracts.push(contractData);
        }
      });

      // Crear contratos en Firebase
      let createdCount = 0;
      for (const contractData of sampleContracts) {
        const result = await this.createContract(contractData);
        if (result.success) {
          createdCount++;
        }
      }

      return { success: true, createdCount };
    } catch (error: any) {
      console.error('Error creando contratos de muestra:', error);
      return { success: false, error: error.message };
    }
  }

  static async getTotalContractsAmount(): Promise<{ success: boolean; totalAmount?: number; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const result = await this.getAllContracts();
      if (!result.success || !result.data) {
        return result;
      }

      const totalAmount = result.data.reduce((sum, contract) => {
        return sum + (contract.investmentAmount || 0);
      }, 0);

      return { success: true, totalAmount };
    } catch (error: any) {
      console.error('Error calculando total de contratos:', error);
      return { success: false, error: error.message };
    }
  }
}