import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface UserData {
  email: string;
  displayName?: string;
  phoneNumber?: string;
  address?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserSearchResult {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  createdAt?: any;
}

export class UserService {
  /**
   * Crear o actualizar un usuario en Firestore
   */
  static async createOrUpdateUser(uid: string, userData: Partial<UserData>): Promise<{ success: boolean; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      // Filtrar campos undefined para evitar errores en Firestore
      const cleanUserData = Object.fromEntries(
        Object.entries(userData).filter(([_, value]) => value !== undefined)
      );

      const dataToSave: any = {
        ...cleanUserData,
        updatedAt: serverTimestamp(),
      };

      // Si el usuario no existe, agregar createdAt
      if (!userDoc.exists()) {
        dataToSave.createdAt = serverTimestamp();
      }

      await setDoc(userRef, dataToSave, { merge: true });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error creando/actualizando usuario:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener datos de un usuario
   */
  static async getUser(uid: string): Promise<{ success: boolean; data?: UserData; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return { success: true, data: userDoc.data() as UserData };
      } else {
        return { success: false, error: 'Usuario no encontrado' };
      }
    } catch (error: any) {
      console.error('Error obteniendo usuario:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar usuarios por email (autocomplete)
   */
  static async searchUsersByEmail(searchTerm: string): Promise<{ success: boolean; data?: UserSearchResult[]; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    if (!searchTerm || searchTerm.length < 2) {
      return { success: true, data: [] };
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff'),
        orderBy('email'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email,
          displayName: data.displayName || undefined,
        };
      });

      return { success: true, data: users };
    } catch (error: any) {
      console.error('Error buscando usuarios:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener todos los usuarios (solo admin)
   */
  static async getAllUsers(): Promise<{ success: boolean; data?: UserSearchResult[]; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('email'));

      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email,
          displayName: data.displayName || undefined,
        };
      });

      return { success: true, data: users };
    } catch (error: any) {
      console.error('Error obteniendo usuarios:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener usuarios de Firebase Auth (simulado desde Firestore)
   * En un entorno real, esto usaría Firebase Admin SDK
   */
  static async getAuthUsers(): Promise<{ success: boolean; data?: UserSearchResult[]; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('email'));

      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email,
          displayName: data.displayName || undefined,
          phoneNumber: data.phoneNumber || undefined,
          createdAt: data.createdAt || undefined,
        };
      });

      return { success: true, data: users };
    } catch (error: any) {
      console.error('Error obteniendo usuarios de Auth:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar usuario por email exacto
   */
  static async getUserByEmail(email: string): Promise<{ success: boolean; data?: UserData; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), limit(1));

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { success: true, data: doc.data() as UserData };
      } else {
        return { success: false, error: 'Usuario no encontrado' };
      }
    } catch (error: any) {
      console.error('Error buscando usuario por email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Eliminar un usuario
   */
  static async deleteUser(uid: string): Promise<{ success: boolean; error?: string }> {
    if (!db) {
      return { success: false, error: 'Firestore no está configurado' };
    }

    try {
      const userRef = doc(db, 'users', uid);
      await deleteDoc(userRef);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crear usuarios masivamente desde un archivo Excel
   */
  static async createBulkUsers(users: Array<{
    email: string;
    password: string;
    displayName?: string;
    phoneNumber?: string;
  }>): Promise<{ success: boolean; createdCount: number; skippedCount: number; error?: string }> {
    if (!db) {
      return { success: false, createdCount: 0, skippedCount: 0, error: 'Firestore no está configurado' };
    }

    try {
      let createdCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // Procesar usuarios uno por uno
      for (const userData of users) {
        try {
          // Verificar si el usuario ya existe
          const existingUser = await this.getUserByEmail(userData.email);
          if (existingUser.success && existingUser.data) {
            console.log(`Usuario ${userData.email} ya existe, omitiendo...`);
            skippedCount++;
            continue;
          }

          // Crear el usuario en Firebase Auth (simulado creando en Firestore)
          // En un entorno real, aquí usarías Firebase Admin SDK
          const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const userDoc = {
            email: userData.email,
            displayName: userData.displayName || userData.email,
            phoneNumber: userData.phoneNumber || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // Nota: En un entorno real, la contraseña se manejaría con Firebase Admin SDK
            // Aquí solo guardamos la referencia para que el usuario pueda hacer login
            passwordHash: 'bulk_created', // Placeholder
          };

          await setDoc(doc(db, 'users', uid), userDoc);
          createdCount++;
          
          console.log(`✅ Usuario creado: ${userData.email}`);
        } catch (userError: any) {
          console.error(`❌ Error creando usuario ${userData.email}:`, userError);
          errors.push(`${userData.email}: ${userError.message}`);
        }
      }

      if (errors.length > 0) {
        console.warn('Algunos usuarios no se pudieron crear:', errors);
      }

      return {
        success: true,
        createdCount,
        skippedCount,
        error: errors.length > 0 ? `Algunos errores: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}` : undefined
      };

    } catch (error: any) {
      console.error('Error en creación masiva:', error);
      return { success: false, createdCount: 0, skippedCount: 0, error: error.message };
    }
  }
}
