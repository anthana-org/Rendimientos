import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import app from '../firebase';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [firebaseStatus, setFirebaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkFirebaseConnection = async () => {
      try {
        // Verificar conexión con Firestore
        const db = getFirestore(app);
        
        // Intentar hacer una operación simple para verificar la conexión
        // Intentamos acceder a una colección que sabemos que existe
        const testCollection = collection(db, 'users');
        await getDocs(testCollection);
        
        // Si llegamos aquí sin error, Firebase está conectado
        setFirebaseStatus('connected');
      } catch (error) {
        console.log('Firebase connection check:', error);
        setFirebaseStatus('disconnected');
      }
    };

    if (isOnline) {
      checkFirebaseConnection();
    } else {
      setFirebaseStatus('disconnected');
    }
  }, [isOnline]);

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        text: 'Sin conexión',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        dotColor: 'bg-red-500'
      };
    }

    switch (firebaseStatus) {
      case 'checking':
        return {
          text: 'Verificando...',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          dotColor: 'bg-green-500'
        };
      case 'connected':
        return {
          text: 'Con conexión',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          dotColor: 'bg-green-500'
        };
      case 'disconnected':
        return {
          text: 'Sin conexión Firebase',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          dotColor: 'bg-red-500'
        };
      default:
        return {
          text: 'Sin conexión',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          dotColor: 'bg-red-500'
        };
    }
  };

  const status = getStatusInfo();

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
      <div className={`w-2 h-2 rounded-full ${status.dotColor}`}></div>
      <span>{status.text}</span>
    </div>
  );
}
